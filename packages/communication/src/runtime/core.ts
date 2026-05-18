import type {
  RuntimeConfig,
  IkiraroEvent,
  IkiraroPlugin,
  IkiraroState,
  PluginContext,
  EventRegistry,
  PluginTeardown,
} from "./types";

/**
 * The IkiraroRuntime is the "Nucleus" of the system.
 * It coordinates plugins through an Event Bus and maintains a unified state.
 */
export class IkiraroRuntime {
  private state: IkiraroState = {
    status: "idle",
    activeTracks: [],
    plugins: {} as IkiraroState["plugins"],
  };

  private handlers: Map<string, Set<(event: IkiraroEvent<any>) => void>> = new Map();
  private plugins: IkiraroPlugin[] = [];
  private pluginDisposers: Array<() => void | Promise<void>> = [];
  private started = false;

  constructor(private config: RuntimeConfig) {}

  /**
   * Initializes the runtime and its plugins.
   */
  async start() {
    if (this.started) return;
    this.started = true;
    this.plugins = this.config.plugins || [];

    // Pre-populate plugin states. The cast is load-bearing: plugins register by name at
    // runtime, so TypeScript can't verify the key matches PluginRegistry at compile time.
    const pluginStates = this.state.plugins as unknown as Record<string, unknown>;
    for (const plugin of this.plugins) {
      if (plugin.initialState !== undefined) {
        pluginStates[plugin.name] = plugin.initialState;
      }
    }

    for (const plugin of this.plugins) {
      const addPluginDisposer = (teardown: PluginTeardown) => {
        if (!teardown) return;
        if (Array.isArray(teardown)) {
          this.pluginDisposers.push(...teardown);
        } else {
          this.pluginDisposers.push(teardown);
        }
      };

      const ctx: PluginContext = {
        emit: (event) => this.dispatch(event),
        subscribe: (type, handler) => {
          const unsubscribe = this.subscribe(type, handler);
          this.pluginDisposers.push(unsubscribe);
          return unsubscribe;
        },
        getState: () => ({ ...this.state }),
        getPluginState: () => pluginStates[plugin.name] as any,
        config: this.config,
      };
      addPluginDisposer(await plugin.setup(ctx));
    }

    this.dispatch({
      type: "runtime:ready",
      payload: undefined,
      timestamp: Date.now(),
      source: "core",
    });
  }

  async stop() {
    if (!this.started) return;

    for (const dispose of [...this.pluginDisposers].reverse()) {
      await dispose();
    }
    this.pluginDisposers = [];

    for (const plugin of this.plugins) {
      if (plugin.teardown) await plugin.teardown();
    }
    this.started = false;
  }

  /**
   * Dispatches an event to the internal bus.
   */
  public dispatch<K extends keyof EventRegistry>(event: IkiraroEvent<K>) {
    // 1. Update core state
    this.updateInternalState(event);

    // 2. Run plugin reducers for local state updates
    const pluginStates = this.state.plugins as unknown as Record<string, unknown>;
    for (const plugin of this.plugins) {
      if (plugin.reducer && pluginStates[plugin.name] !== undefined) {
        pluginStates[plugin.name] = plugin.reducer(pluginStates[plugin.name], event);
      }
    }

    // 3. Notify subscribers
    const typeHandlers = this.handlers.get(event.type as string);
    typeHandlers?.forEach((h) => h(event));

    const wildcardHandlers = this.handlers.get("*");
    wildcardHandlers?.forEach((h) => h(event));
  }

  public subscribe<K extends keyof EventRegistry>(
    type: K,
    handler: (event: IkiraroEvent<K>) => void,
  ) {
    const typeStr = type as string;
    const set = this.handlers.get(typeStr) ?? new Set();
    set.add(handler as any);
    this.handlers.set(typeStr, set);
    return () => {
      this.handlers.get(typeStr)?.delete(handler as any);
    };
  }

  /** Subscribe to every event on the bus. Use sparingly — prefer typed subscriptions. */
  public subscribeAll(handler: (event: IkiraroEvent<any>) => void) {
    const set = this.handlers.get("*") ?? new Set();
    set.add(handler);
    this.handlers.set("*", set);
    return () => {
      this.handlers.get("*")?.delete(handler);
    };
  }

  private updateInternalState(event: IkiraroEvent<any>) {
    if (event.type === "runtime:status-change") {
      this.state.status = event.payload;
    }
    // TODO: Logic for other core state updates (activeTracks, etc.) would go here.
  }

  getState() {
    return { ...this.state };
  }
}

/**
 * The entry point.
 */
export async function articulate(config: RuntimeConfig) {
  const runtime = new IkiraroRuntime(config);
  await runtime.start();
  return runtime;
}
