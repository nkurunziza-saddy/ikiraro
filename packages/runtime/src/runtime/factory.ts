import { articulate } from "./core";
import { SessionPlugin } from "./plugins/session";
import { CompositionPlugin } from "./plugins/composition";
import { TranslationPlugin } from "./plugins/translation";
import { SpeechPlugin } from "./plugins/speech";
import { VisionPlugin } from "./plugins/vision";
import { KeyboardPlugin } from "./plugins/keyboard";
import type { HandProcessor } from "@ikiraro/engine/vision";
import type { IkiraroConfig } from "../sdk";
import type { IkiraroPlugin } from "./types";
export interface IkiraroDefaultConfig {
  sdk: IkiraroConfig;
  baseUrl?: string;
  vision?: {
    processor: HandProcessor;
  };
  /**
   * Enable the physical keyboard input adapter.
   * Captures single-character key presses as sign tokens.
   */
  keyboard?: boolean;
  /**
   * Additional plugins to mount after the defaults.
   * Use this to add analytics, custom input adapters, or inspector tooling.
   */
  plugins?: IkiraroPlugin<any>[];
}
/**
 * Creates and starts the Ikiraro Runtime with the default plugin set.
 * This is the primary entry point for all integrations.
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

  const plugins: IkiraroPlugin<any>[] = [
    new SessionPlugin(),
    new CompositionPlugin(),
    new TranslationPlugin(),
    new SpeechPlugin(),
  ];
  if (config.vision) {
    plugins.push(new VisionPlugin(config.vision.processor));
  }
  if (config.keyboard) {
    plugins.push(new KeyboardPlugin());
  }
  if (config.plugins) {
    plugins.push(...config.plugins);
  }
  return articulate({
    ...config,
    plugins,
  });
}
