import { useEffect, useState } from "react";
import { IkiraroRuntime } from "../runtime/core";
import type { IkiraroEvent, IkiraroState } from "../runtime/types";

/**
 * React adapter for the Ikiraro Runtime.
 * Provides reactive access to the event bus and internal state.
 */
export function useIkiraro(runtime: IkiraroRuntime) {
  const [state, setState] = useState<IkiraroState>(runtime.getState());
  const [lastEvent, setLastEvent] = useState<IkiraroEvent | null>(null);

  useEffect(() => {
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
