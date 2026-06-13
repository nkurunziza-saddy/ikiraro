import { buildPlanFromUnits, createEnvelope } from "@ikiraro/engine/planning";
import type { TranslationEnvelope } from "@ikiraro/engine/types";
import { ManagedRuntime } from "effect";
import { getAudioFileExtension } from "../capture/audio-utils";
import { makeGroqLayer, translateSpeechEffect, translateTextEffect } from "../sdk";
import type { TranslationRequest } from "./types";
export interface TranslationPlanner {
  canPlan(request: TranslationRequest): boolean;
  plan(request: TranslationRequest): Promise<TranslationEnvelope>;
  dispose?: () => Promise<void> | void;
}
export class DeterministicUnitsPlanner implements TranslationPlanner {
  canPlan(request: TranslationRequest): boolean {
    return request.mode === "sign-keys";
  }
  async plan(request: TranslationRequest): Promise<TranslationEnvelope> {
    if (request.mode !== "sign-keys" || !request.units) {
      throw new Error("Deterministic planner requires sign units.");
    }
    const plan = buildPlanFromUnits(request.units);
    return createEnvelope(plan, {
      mode: "sign-keys",
      rawInput: request.units.join(" "),
    });
  }
}
export class GroqSemanticPlanner implements TranslationPlanner {
  private effectRuntime: ManagedRuntime.ManagedRuntime<any, never>;
  constructor(config: import("../sdk").IkiraroConfig) {
    this.effectRuntime = ManagedRuntime.make(makeGroqLayer(config));
  }
  canPlan(request: TranslationRequest): boolean {
    return request.mode === "text" || request.mode === "speech";
  }
  async plan(request: TranslationRequest): Promise<TranslationEnvelope> {
    if (request.mode === "speech" && request.audio) {
      const ext = getAudioFileExtension(request.audio.type);
      const file = new File([request.audio], `speech.${ext}`, { type: request.audio.type });
      return this.effectRuntime.runPromise(
        translateSpeechEffect(file, request.sttModel, request.prompt),
      );
    }
    if (request.mode === "text" && request.text) {
      return this.effectRuntime.runPromise(translateTextEffect(request.text));
    }
    throw new Error(`Unsupported or invalid translation request: ${request.mode}`);
  }
  async dispose() {
    await this.effectRuntime.dispose();
  }
}

export function createTranslationPlanners(
  config?: import("../sdk").IkiraroConfig,
): TranslationPlanner[] {
  const planners: TranslationPlanner[] = [new DeterministicUnitsPlanner()];
  if (config) {
    planners.push(new GroqSemanticPlanner(config));
  }
  return planners;
}
