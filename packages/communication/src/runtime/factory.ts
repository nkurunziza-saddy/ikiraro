import { articulate } from "./core";
import { CompositionPlugin } from "./plugins/composition";
import { TranslationPlugin } from "./plugins/translation";
import { SpeechPlugin } from "./plugins/speech";
import { VisionPlugin } from "./plugins/vision";
import type { HandProcessor } from "@sensa/engine/vision";
import type { SensaConfig } from "../sdk";
import type { SensaPlugin } from "./types";

export interface SensaDefaultConfig {
  sdk: SensaConfig;
  baseUrl?: string;
  vision?: {
    processor: HandProcessor;
  };
}

/**
 * High-level factory for the Sensa Runtime.
 * Provides the "tiny declarative API" similar to Better Auth.
 */
export async function createSensa(config: SensaDefaultConfig) {
  const plugins: SensaPlugin[] = [
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
