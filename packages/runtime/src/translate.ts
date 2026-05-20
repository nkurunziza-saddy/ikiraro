import { Effect } from "effect";
import type { TranslationEnvelope } from "@ikiraro/engine/types";
import { IkiraroSDK, type IkiraroConfig } from "./sdk";

export async function translate(text: string, config: IkiraroConfig): Promise<TranslationEnvelope> {
  return Effect.runPromise(
    IkiraroSDK.translateText(text).pipe(Effect.provide(IkiraroSDK.makeLayer(config))),
  );
}
