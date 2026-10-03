/** Framework-independent runtime and translation adapters. */
export { IkiraroRuntime } from "./runtime/core";
export { createIkiraro } from "./runtime/factory";
export type { IkiraroDefaultConfig } from "./runtime/factory";
export type { IkiraroConfig } from "./sdk";
export { translate } from "./translate";
export type { TranslationPlanner } from "./runtime/translation-planner";
export { DeterministicUnitsPlanner, GroqSemanticPlanner } from "./runtime/translation-planner";
export type {
  IkiraroPlugin,
  PluginContext,
  PluginTeardown,
  RuntimeConfig,
  RuntimeSnapshot,
  TranslationRequest,
} from "./runtime/types";
export type { SignPlan, SignToken, TranslationEnvelope } from "@ikiraro/engine/types";
