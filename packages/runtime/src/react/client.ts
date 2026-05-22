import { useSyncExternalStore, useEffect, useCallback } from "react";
import { createIkiraro } from "../runtime/factory";
import type { IkiraroDefaultConfig } from "../runtime/factory";
import type { IkiraroRuntime } from "../runtime/core";
import type { RuntimeSnapshot, PluginRegistry } from "../runtime/types";
import type { TranslationEnvelope, SttModel, TranslationContext } from "@ikiraro/engine/types";
const INITIAL_SNAPSHOT: RuntimeSnapshot = {
  status: "idle",
  isTranslating: false,
  lastEnvelope: null,
  compositionTokens: [],
  compositionText: "",
  speechStatus: "idle",
  speechLevel: 0,
  error: null,
};
export interface IkiraroReactClient {
  /**
   * The primary hook to access the runtime.
   * Mounting this hook will automatically start the runtime if it isn't running.
   */
  useIkiraro: () => {
    isReady: boolean;
    error: string | null;
    snapshot: RuntimeSnapshot;
    translate: (text: string, options?: { context?: TranslationContext }) => void;
    translateUnits: (units: string[]) => void;
    startSpeech: (options?: {
      sttModel?: SttModel;
      prompt?: string;
      context?: TranslationContext;
    }) => void;
    stopSpeech: () => void;
    cancel: () => void;
    onTranslated: (handler: (envelope: TranslationEnvelope) => void) => () => void;
  };
  /**
   * Access state specific to a single plugin.
   * Mounting this hook will also ensure the runtime is started.
   */
  useIkiraroPlugin: <K extends keyof PluginRegistry>(
    pluginName: K,
  ) => PluginRegistry[K] | undefined;
  /**
   * Imperatively start the runtime without a React component.
   */
  start: () => Promise<IkiraroRuntime>;
  /**
   * Imperatively stop the runtime.
   */
  stop: () => Promise<void>;
  /**
   * Direct access to the underlying runtime instance. Null until started.
   */
  readonly runtime: IkiraroRuntime | null;
}
/**
 * Creates a provider-less React client for the Ikiraro Runtime.
 *
 * This creates a module-level singleton instance of the runtime.
 * Hooks returned from this factory (`useIkiraro`, `useIkiraroPlugin`) are bound to this specific instance
 * and will automatically start/stop the runtime (via reference counting) when components mount/unmount.
 *
 * @example
 * // lib/ikiraro.ts
 * export const ikiraro = createIkiraroClient({ sdk: { groqApiKey: '...' } });
 * export const { useIkiraro, useIkiraroPlugin } = ikiraro;
 */
export function createIkiraroClient(config: IkiraroDefaultConfig): IkiraroReactClient {
  let runtime: IkiraroRuntime | null = null;
  let initPromise: Promise<IkiraroRuntime> | null = null;
  let initError: string | null = null;
  let activeMounts = 0;
  let destroyTimeout: ReturnType<typeof setTimeout> | null = null;
  const subscribers = new Set<() => void>();
  const notify = () => subscribers.forEach((cb) => cb());
  const start = async () => {
    if (destroyTimeout) {
      clearTimeout(destroyTimeout);
      destroyTimeout = null;
    }
    if (initPromise) return initPromise;
    initError = null;
    initPromise = createIkiraro(config)
      .then((rt) => {
        runtime = rt;
        rt.subscribeAll(notify);
        notify();
        return rt;
      })
      .catch((err) => {
        initPromise = null;
        initError = err instanceof Error ? err.message : "Failed to initialize runtime";
        notify();
        throw err;
      });
    return initPromise;
  };
  const stop = async () => {
    if (runtime) {
      await runtime.stop();
      runtime = null;
    }
    initPromise = null;
    initError = null;
    notify();
  };
  const mount = () => {
    activeMounts++;
    start().catch(() => {});
  };
  const unmount = () => {
    activeMounts--;
    if (activeMounts <= 0) {
      activeMounts = 0;
      destroyTimeout = setTimeout(() => {
        if (activeMounts === 0) stop();
      }, 500);
    }
  };
  const getSnapshot = () => runtime?.snapshot() ?? INITIAL_SNAPSHOT;
  function useIkiraro() {
    useEffect(() => {
      mount();
      return () => unmount();
    }, []);
    const snapshot = useSyncExternalStore(
      (cb) => {
        subscribers.add(cb);
        return () => subscribers.delete(cb);
      },
      getSnapshot,
      getSnapshot,
    );
    return {
      isReady: !!runtime,
      error: initError,
      snapshot,
      translate: useCallback((text: string, opts?: { context?: TranslationContext }) => {
        runtime?.translate(text, opts);
      }, []),
      translateUnits: useCallback((units: string[]) => {
        runtime?.translateUnits(units);
      }, []),
      startSpeech: useCallback(
        (opts?: { sttModel?: SttModel; prompt?: string; context?: TranslationContext }) => {
          runtime?.startSpeech(opts);
        },
        [],
      ),
      stopSpeech: useCallback(() => runtime?.stopSpeech(), []),
      cancel: useCallback(() => runtime?.cancel(), []),
      onTranslated: useCallback((cb: (envelope: TranslationEnvelope) => void) => {
        return runtime?.onTranslated(cb) ?? (() => {});
      }, []),
    };
  }
  function useIkiraroPlugin<K extends keyof PluginRegistry>(pluginName: K) {
    useEffect(() => {
      mount();
      return () => unmount();
    }, []);
    const getPluginState = useCallback(() => {
      return runtime?.getState().plugins[pluginName] as PluginRegistry[K] | undefined;
    }, [pluginName]);
    return useSyncExternalStore(
      (cb) => {
        subscribers.add(cb);
        return () => subscribers.delete(cb);
      },
      getPluginState,
      getPluginState,
    );
  }
  return {
    useIkiraro,
    useIkiraroPlugin,
    start,
    stop,
    get runtime() {
      return runtime;
    },
  };
}
