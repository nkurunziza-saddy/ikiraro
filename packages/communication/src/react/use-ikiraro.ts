import { useEffect, useState } from "react";
import { IkiraroRuntime } from "../runtime/core";
import type { IkiraroEvent, IkiraroState } from "../runtime/types";

/**
 * React adapter for the Ikiraro Runtime.
 * Provides reactive access to the event bus and internal state.
 */
export function useIkiraro(runtime: IkiraroRuntime | null) {
  const [state, setState] = useState<IkiraroState | null>(runtime?.getState() || null);
  const [lastEvent, setLastEvent] = useState<IkiraroEvent | null>(null);

  useEffect(() => {
    if (!runtime) return;

    // Initial sync
    setState(runtime.getState());

    const unsubscribe = runtime.subscribeAll((event: IkiraroEvent) => {
      setLastEvent(event);
      setState(runtime.getState());
    });

    return () => {
      unsubscribe();
    };
  }, [runtime]);

  return {
    state,
    lastEvent,
    runtime,
  };
}
