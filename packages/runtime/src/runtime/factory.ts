import type { HandProcessor } from "@ikiraro/engine/vision";
import type { IkiraroConfig } from "../sdk";
import { articulate } from "./core";
import { CompositionPlugin } from "./plugins/composition";
import { KeyboardPlugin } from "./plugins/keyboard";
import { SessionPlugin } from "./plugins/session";
import { SpeechPlugin } from "./plugins/speech";
import { TranslationPlugin } from "./plugins/translation";
import { VisionPlugin } from "./plugins/vision";
import type { IkiraroPlugin } from "./types";
export interface IkiraroDefaultConfig {
  sdk: IkiraroConfig;
  baseUrl?: string;
  vision?: {
    processor: HandProcessor;
  };
  /** Enable keyboard input adapter. */
  keyboard?: boolean;
  /** Additional plugins to mount after defaults. */
  plugins?: IkiraroPlugin<any>[];
}
/**
 * Creates and starts the Ikiraro Runtime with default plugins.
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
