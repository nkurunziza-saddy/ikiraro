import { useEffect, useState } from "react";
import { SensaRuntime } from "../runtime/core";
import type { SensaEvent, SensaState } from "../runtime/types";

/**
 * React adapter for the Sensa Runtime.
 * Provides reactive access to the event bus and internal state.
 */
export function useSensa(runtime: SensaRuntime) {
  const [state, setState] = useState<SensaState>(runtime.getState());
  const [lastEvent, setLastEvent] = useState<SensaEvent | null>(null);

  useEffect(() => {
    // Subscribe to all events to keep state in sync
    const unsubscribe = runtime.subscribe("*", (event: SensaEvent) => {
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
