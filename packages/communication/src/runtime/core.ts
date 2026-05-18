import type {
  RuntimeConfig,
  SensaEvent,
  SensaPlugin,
  SensaState,
  PluginContext,
  EventRegistry,
} from "./types";

/**
 * The SensaRuntime is the "Nucleus" of the system.
 * It coordinates plugins through an Event Bus and maintains a unified state.
 */
export class SensaRuntime {
  private state: SensaState = {
    status: "idle",
    activeTracks: [],
    plugins: {} as SensaState["plugins"],
  };

  private handlers: Map<string, Set<(event: SensaEvent<any>) => void>> = new Map();
  private plugins: SensaPlugin[] = [];

  constructor(private config: RuntimeConfig) {}

  /**
   * Initializes the runtime and its plugins.
   */
  async start() {
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
      const ctx: PluginContext = {
        emit: (event) => this.dispatch(event),
        subscribe: (type, handler) => this.subscribe(type, handler),
        getState: () => ({ ...this.state }),
        getPluginState: () => pluginStates[plugin.name] as any,
        config: this.config,
      };
      await plugin.setup(ctx);
    }

    this.dispatch({
      type: "runtime:ready",
      payload: undefined,
      timestamp: Date.now(),
      source: "core",
    });
  }

  async stop() {
    for (const plugin of this.plugins) {
      if (plugin.teardown) await plugin.teardown();
    }
  }

  /**
   * Dispatches an event to the internal bus.
   */
  public dispatch<K extends keyof EventRegistry>(event: SensaEvent<K>) {
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
    handler: (event: SensaEvent<K>) => void,
  ) {
    const typeStr = type as string;
    const set = this.handlers.get(typeStr) ?? new Set();
    set.add(handler as any);
    this.handlers.set(typeStr, set);
    return () => this.handlers.get(typeStr)?.delete(handler as any);
  }

  /** Subscribe to every event on the bus. Use sparingly — prefer typed subscriptions. */
  public subscribeAll(handler: (event: SensaEvent<any>) => void) {
    const set = this.handlers.get("*") ?? new Set();
    set.add(handler);
    this.handlers.set("*", set);
    return () => this.handlers.get("*")?.delete(handler);
  }

  private updateInternalState(event: SensaEvent<any>) {
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
  const runtime = new SensaRuntime(config);
  await runtime.start();
  return runtime;
}
