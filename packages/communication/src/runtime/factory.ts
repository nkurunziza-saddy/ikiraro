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
 * Factory for the Ikiraro Runtime.
 */
export async function createIkiraro(config: IkiraroDefaultConfig) {
  const key = config.sdk.groqApiKey;
  if (!key || key.trim() === "" || key === "YOUR_GROQ_API_KEY") {
    throw new Error(
      "Ikiraro: a valid Groq API key is required. " +
        "Pass it via createIkiraro({ sdk: { groqApiKey: '...' } }) " +
        "or set VITE_GROQ_API_KEY in your environment.",
    );
  }

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
