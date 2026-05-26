import { useState, useEffect, useMemo } from "react";
import { globalAgent, type AgentDecision } from "./llm-agent";
import type { UserIntent } from "./input-channels";

export type InteractionStatus = "idle" | "thinking" | "acting" | "speaking";

export interface InteractionState {
  status: InteractionStatus;
  lastDecision: AgentDecision | null;
  error: Error | null;
}

export type OrchestratorListener = (state: InteractionState) => void;

export class InteractionOrchestrator {
  private state: InteractionState = {
    status: "idle",
    lastDecision: null,
    error: null,
  };

  private listeners = new Set<OrchestratorListener>();

  constructor(
    private translate: (text: string) => void,
    private speakFn: (text: string) => Promise<void>,
  ) {}

  async handleIntent(intent: UserIntent) {
    if (this.state.status !== "idle") return;

    try {
      this.updateState({ status: "thinking", error: null });

      const decision = await globalAgent.think(intent.text);
      this.updateState({ lastDecision: decision, status: "acting" });

      this.translate(decision.response);

      // Fire speech concurrently with action execution — status tracks until audio finishes
      this.updateState({ status: "speaking" });
      const speakDone = this.speakFn(decision.response);

      if (decision.actionId) {
        await globalAgent.execute(decision.actionId);
      }

      // Wait for speech to finish before going idle
      await speakDone;
      this.updateState({ status: "idle" });
    } catch (error: any) {
      this.updateState({
        status: "idle",
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  subscribe(cb: OrchestratorListener) {
    this.listeners.add(cb);
    cb({ ...this.state });
    return () => this.listeners.delete(cb);
  }

  private updateState(patch: Partial<InteractionState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l({ ...this.state }));
  }
}

export function useOrchestrator(
  translate: (text: string) => void,
  speakFn: (text: string) => Promise<void>,
) {
  const orchestrator = useMemo(
    () => new InteractionOrchestrator(translate, speakFn),
    [translate, speakFn],
  );
  const [state, setState] = useState<InteractionState>({
    status: "idle",
    lastDecision: null,
    error: null,
  });

  useEffect(() => {
    const unsub = orchestrator.subscribe(setState);
    return () => {
      unsub();
    };
  }, [orchestrator]);

  return { orchestrator, state };
}
