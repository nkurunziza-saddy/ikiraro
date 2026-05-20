import type { IkiraroPlugin, PluginContext, IkiraroEvent } from "../types";
import type { TranslationEnvelope } from "@ikiraro/engine/types";
import { createTranslationPlanners, type TranslationPlanner } from "../translation-planner";
import type { TranslationRequest } from "../types";

export interface TranslationState {
  lastEnvelope?: TranslationEnvelope;
  isTranslating: boolean;
  error?: string;
}

/**
 * The TranslationPlugin deepens the runtime by owning the local-first
 * translation lifecycle using Effect.
 */
export class TranslationPlugin implements IkiraroPlugin<TranslationState> {
  name = "translation";
  initialState: TranslationState = { isTranslating: false };
  private planners: TranslationPlanner[] = [];

  setup(ctx: PluginContext<TranslationState>) {
    this.planners = createTranslationPlanners(ctx.config.sdk);

    ctx.subscribe("translation:cmd:request", async (event) => {
      await this.handleTranslationRequest(event.payload, ctx);
    });
  }

  reducer(state: TranslationState, event: IkiraroEvent): TranslationState {
    switch (event.type) {
      case "translation:started":
        return { ...state, isTranslating: true, error: undefined };
      case "translation:finished":
        return { ...state, isTranslating: false, lastEnvelope: event.payload };
      case "translation:error":
        return { ...state, isTranslating: false, error: event.payload };
      default:
        return state;
    }
  }

  private async handleTranslationRequest(
    options: TranslationRequest,
    ctx: PluginContext<TranslationState>,
  ) {
    ctx.emit({
      type: "translation:started",
      payload: options,
      timestamp: Date.now(),
      source: this.name,
    });

    try {
      const planner = this.planners.find((candidate) => candidate.canPlan(options));
      if (!planner) {
        throw new Error(`No translation planner is configured for mode: ${options.mode}`);
      }

      const envelope: TranslationEnvelope = await planner.plan(options);
      ctx.emit({
        type: "translation:finished",
        payload: envelope,
        timestamp: Date.now(),
        source: this.name,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Translation failed";
      ctx.emit({
        type: "translation:error",
        payload: message,
        timestamp: Date.now(),
        source: this.name,
      });
    }
  }
}
