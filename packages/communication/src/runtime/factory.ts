import { articulate } from "./core";
import { SessionPlugin } from "./plugins/session";
import { CompositionPlugin } from "./plugins/composition";
import { TranslationPlugin } from "./plugins/translation";
import { SpeechPlugin } from "./plugins/speech";
import { VisionPlugin } from "./plugins/vision";
import type { HandProcessor } from "@ikiraro/engine/vision";
import type { IkiraroConfig } from "../sdk";
import type { IkiraroPlugin } from "./types";

export interface IkiraroDefaultConfig {
  sdk: IkiraroConfig;
  baseUrl?: string;
  vision?: {
    processor: HandProcessor;
  };
}

/**
 * High-level factory for the Ikiraro Runtime.
 * Provides the "tiny declarative API" similar to Better Auth.
 */
export async function createIkiraro(config: IkiraroDefaultConfig) {
  const plugins: IkiraroPlugin[] = [
    new SessionPlugin(),
    new CompositionPlugin(),
    new TranslationPlugin(),
    new SpeechPlugin(),
  ];

  if (config.vision) {
    plugins.push(new VisionPlugin(config.vision.processor));
  }

  return articulate({
    ...config,
    plugins,
  });
}
