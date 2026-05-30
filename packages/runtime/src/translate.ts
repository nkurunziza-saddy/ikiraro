import { Effect } from "effect";
import type { TranslationEnvelope } from "@ikiraro/engine/types";
import { translateTextEffect, makeGroqLayer, type IkiraroConfig } from "./sdk";
export async function translate(text: string, config: IkiraroConfig): Promise<TranslationEnvelope> {
  return Effect.runPromise(translateTextEffect(text).pipe(Effect.provide(makeGroqLayer(config))));
}
