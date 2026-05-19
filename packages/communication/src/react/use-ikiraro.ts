import { useCallback, useEffect, useRef, useState, startTransition } from "react";
import { createIkiraro } from "../runtime/factory";
import type { IkiraroDefaultConfig } from "../runtime/factory";
import type { IkiraroRuntime } from "../runtime/core";
import type { RuntimeSnapshot } from "../runtime/types";
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

/**
 * Self-contained React hook for the Ikiraro runtime.
 * Manages the full lifecycle — create, subscribe, and cleanup — so you don't have to.
 *
 * @example
 * const { isReady, snapshot, translate, startSpeech, stopSpeech } = useIkiraro({
 *   sdk: { groqApiKey: import.meta.env.VITE_GROQ_API_KEY },
 * });
 *
 * // Fire a translation
 * translate("Hello, how are you?");
 *
 * // React to results
 * useEffect(() => {
 *   if (snapshot.lastEnvelope) { ... }
 * }, [snapshot.lastEnvelope]);
 */
export function useIkiraro(config: IkiraroDefaultConfig) {
  // Config is only read on mount — changes are intentionally not reactive.
  const configRef = useRef(config);

  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot>(INITIAL_SNAPSHOT);
  const runtimeRef = useRef<IkiraroRuntime | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    createIkiraro(configRef.current)
      .then((runtime) => {
        if (!active) {
          runtime.stop();
          return;
        }
        runtimeRef.current = runtime;
        setIsReady(true);
        setSnapshot(runtime.snapshot());

        unsubscribe = runtime.subscribeAll(() => {
          startTransition(() => {
            setSnapshot(runtime.snapshot());
          });
        });
      })
      .catch((err) => {
        if (!active) return;
        setInitError(err instanceof Error ? err.message : "Failed to initialize runtime");
      });

    return () => {
      active = false;
      unsubscribe?.();
      runtimeRef.current?.stop();
      runtimeRef.current = null;
    };
  }, []);

  const translate = useCallback((text: string, options?: { context?: TranslationContext }) => {
    runtimeRef.current?.translate(text, options);
  }, []);

  const translateUnits = useCallback((units: string[]) => {
    runtimeRef.current?.translateUnits(units);
  }, []);

  const startSpeech = useCallback(
    (options?: { sttModel?: SttModel; prompt?: string; context?: TranslationContext }) => {
      runtimeRef.current?.startSpeech(options);
    },
    [],
  );

  const stopSpeech = useCallback(() => {
    runtimeRef.current?.stopSpeech();
  }, []);

  const cancel = useCallback(() => {
    runtimeRef.current?.cancel();
  }, []);

  /**
   * Subscribe to completed translations outside of React state.
   * Must be called after `isReady` is true. Returns an unsubscribe function.
   */
  const onTranslated = useCallback((handler: (envelope: TranslationEnvelope) => void) => {
    return runtimeRef.current?.onTranslated(handler) ?? (() => {});
  }, []);

  return {
    /** True once the runtime has fully initialized and is ready to accept commands. */
    isReady,
    /** Set when initialization fails (e.g. missing API key). */
    error: initError,
    /** Reactive flat state — no nested plugin paths. Subscribe via `useEffect`. */
    snapshot,
    translate,
    translateUnits,
    startSpeech,
    stopSpeech,
    cancel,
    onTranslated,
    /** Escape hatch for advanced plugin access. Prefer the helpers above. */
    runtime: runtimeRef.current,
  };
}
