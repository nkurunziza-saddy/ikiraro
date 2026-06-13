import type { SttModel, TranslationContext, TranslationEnvelope } from "@ikiraro/engine/types";
import { EventBus } from "./event-bus";
import { globalResourceRegistry } from "./resource-registry";
import type {
  EventRegistry,
  IkiraroEvent,
  IkiraroPlugin,
  IkiraroState,
  PluginContext,
  RuntimeConfig,
  RuntimeSnapshot,
} from "./types";

/**
 * The IkiraroRuntime is the "Nucleus" of the system.
 * It coordinates plugins through an Event Bus and maintains a unified state.
 */
export class IkiraroRuntime {
  private state: IkiraroState = {
    lifecycleStatus: "idle",
    plugins: {} as IkiraroState["plugins"],
  };
  private bus = new EventBus();
  private plugins: IkiraroPlugin<any>[] = [];
  private pluginDisposers: Array<() => void | Promise<void>> = [];
  private started = false;
  private cachedSnapshot: RuntimeSnapshot | null = null;
  constructor(private config: RuntimeConfig) {}
  async start() {
    if (this.started) return;
    this.started = true;
    this.plugins = this.config.plugins || [];

    const pluginStates = this.state.plugins as unknown as Record<string, unknown>;
    for (const plugin of this.plugins) {
      if (plugin.initialState !== undefined) {
        pluginStates[plugin.name] = plugin.initialState;
      }
    }
    for (const plugin of this.plugins) {
      const ctx: PluginContext = {
        emit: (event) => this.dispatch(event as IkiraroEvent),
        subscribe: (type, handler) => {
          const unsubscribe = this.subscribe(type, handler);
          this.pluginDisposers.push(unsubscribe);
          return unsubscribe;
        },
        getState: () => ({ ...this.state }),
        getPluginState: () => pluginStates[plugin.name] as never,
        config: this.config,
      };
      const teardown = await plugin.setup(ctx);
      if (!teardown) continue;
      if (Array.isArray(teardown)) {
        this.pluginDisposers.push(...teardown);
      } else {
        this.pluginDisposers.push(teardown);
      }
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

    // Final safety layer: dispose any leaked heavy resources
    await globalResourceRegistry.disposeAll();

    this.started = false;
  }
  /**
   * Dispatches an event: updates core state, runs plugin reducers, then emits on the bus.
   */
  public dispatch(event: IkiraroEvent) {
    this.updateInternalState(event);
    const pluginStates = this.state.plugins as unknown as Record<string, unknown>;
    for (const plugin of this.plugins) {
      if (plugin.reducer && pluginStates[plugin.name] !== undefined) {
        pluginStates[plugin.name] = plugin.reducer(pluginStates[plugin.name], event);
      }
    }
    this.cachedSnapshot = null;
    this.bus.emit(event);
  }
  public subscribe<K extends keyof EventRegistry>(
    type: K,
    handler: (event: IkiraroEvent<K>) => void,
  ): () => void {
    return this.bus.on(type, handler);
  }
  /** Subscribe to every event on the bus. Use sparingly — prefer typed subscriptions. */
  public subscribeAll(handler: (event: IkiraroEvent) => void): () => void {
    return this.bus.onAll(handler);
  }

  /** Translate a text string to signing. */
  translate(text: string, options: { context?: TranslationContext } = {}): void {
    this.dispatch({
      type: "session:cmd:start",
      payload: { mode: "text", text, context: options.context },
      timestamp: Date.now(),
      source: "sdk",
    });
  }
  /** Play back a sequence of manual sign units (e.g. from the sign keyboard). */
  translateUnits(units: string[]): void {
    this.dispatch({
      type: "session:cmd:start",
      payload: { mode: "sign-keys", units },
      timestamp: Date.now(),
      source: "sdk",
    });
  }
  /** Begin microphone capture. Call `stopSpeech()` to transcribe and translate. */
  startSpeech(
    options: { sttModel?: SttModel; prompt?: string; context?: TranslationContext } = {},
  ): void {
    this.dispatch({
      type: "session:cmd:start",
      payload: { mode: "speech", ...options },
      timestamp: Date.now(),
      source: "sdk",
    });
  }
  /** Stop capture and submit the recording for transcription → translation. */
  stopSpeech(): void {
    this.dispatch({
      type: "session:cmd:stop",
      payload: undefined,
      timestamp: Date.now(),
      source: "sdk",
    });
  }
  /** Cancel an in-progress capture or translation without committing. */
  cancel(): void {
    this.dispatch({
      type: "session:cmd:cancel",
      payload: undefined,
      timestamp: Date.now(),
      source: "sdk",
    });
  }
  /**
   * Subscribe to completed translations. Returns an unsubscribe function.
   * Tip: in React, prefer reading `snapshot().lastEnvelope` in a `useEffect`.
   */
  onTranslated(handler: (envelope: TranslationEnvelope) => void): () => void {
    return this.subscribe("translation:finished", (event) => handler(event.payload));
  }
  /**
   * Returns a flat snapshot of the runtime state — no nested plugin paths needed.
   * Safe to call on every render; returns a cached reference if no state changes occurred.
   */
  snapshot(): RuntimeSnapshot {
    if (this.cachedSnapshot) return this.cachedSnapshot;
    const plugins = this.state.plugins;
    this.cachedSnapshot = {
      status: plugins.session?.status ?? "idle",
      isTranslating: plugins.translation?.isTranslating ?? false,
      lastEnvelope: plugins.session?.lastEnvelope ?? null,
      compositionTokens: plugins.composition?.tokens ?? [],
      compositionText: plugins.composition?.text ?? "",
      speechStatus: plugins.speech?.status ?? "idle",
      speechLevel: plugins.speech?.level ?? 0,
      error: plugins.session?.error ?? null,
    };
    return this.cachedSnapshot;
  }
  /**
   * Returns the raw internal state. Plugin states are live references — do not mutate.
   * Prefer `snapshot()` for React consumption.
   */
  getState(): Readonly<IkiraroState> {
    return this.state;
  }

  private updateInternalState(event: IkiraroEvent) {
    if (event.type === "runtime:status-change") {
      this.state.lifecycleStatus = event.payload as IkiraroState["lifecycleStatus"];
    }
  }
}
/** Internal factory used by createIkiraro. Not part of the public API. */
export async function articulate(config: RuntimeConfig) {
  const runtime = new IkiraroRuntime(config);
  await runtime.start();
  return runtime;
}
