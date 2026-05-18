import { Effect, Layer, Schema } from "effect";
import { GlossService } from "@ikiraro/engine/planning";
import { Groq } from "./client";
import { GLOSS_OUTPUT_SCHEMA } from "@ikiraro/engine/planning";

const DEFAULT_GROQ_GLOSS_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GLOSS_MODEL = "llama-3.1-70b-versatile";

const SYSTEM_PROMPT = `
You are a professional ASL Gloss translator.
Convert English text into a pure ASL Gloss sequence.
Rules:
1. Use UPPERCASE for glosses.
2. Use "PTR:SELF", "PTR:YOU", "PTR:THAT" for pointing.
3. Use "/" for significant pauses.
4. If a word is unknown, use fingerspelling (e.g., "FS:WORD").
5. Output ONLY valid JSON in the specified format.
`;

export const GlossGroqLive = Layer.effect(
  GlossService,
  Effect.gen(function* (_) {
    const groq = yield* _(Groq);

    return {
      generate: (text: string, model?: string) =>
        Effect.gen(function* (_) {
          const url = groq.baseUrl ? `${groq.baseUrl}/chat/completions` : DEFAULT_GROQ_GLOSS_URL;

          const response = yield* _(
            Effect.tryPromise({
              try: () =>
                fetch(url, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${groq.apiKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    model: model ?? DEFAULT_GLOSS_MODEL,
                    messages: [
                      { role: "system", content: SYSTEM_PROMPT },
                      { role: "user", content: text },
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.1,
                  }),
                }),
              catch: (e) => (e instanceof Error ? e : new Error(String(e))),
            }),
          );

          if (!response.ok) {
            const errorText = yield* _(
              Effect.tryPromise({
                try: () => response.text(),
                catch: () => "Unknown error",
              }),
            );
            return yield* _(
              Effect.fail(new Error(errorText || `Groq Gloss returned ${response.status}`)),
            );
          }

          const raw = yield* _(
            Effect.tryPromise({
              try: () => response.json(),
              catch: (e) => (e instanceof Error ? e : new Error(String(e))),
            }),
          );

          const content = raw.choices?.[0]?.message?.content;
          if (!content) return yield* _(Effect.fail(new Error("No gloss content returned")));

          const parsed = JSON.parse(content);
          const validated = yield* _(
            Schema.decodeUnknown(GLOSS_OUTPUT_SCHEMA)(parsed) as Effect.Effect<any, any>,
          );

          return {
            rawGloss: (validated as any).gloss,
            glossTokens: (validated as any).gloss.split(" "),
            confidence: (validated as any).confidence,
            model: model ?? DEFAULT_GLOSS_MODEL,
            promptTokens: raw.usage?.prompt_tokens,
          } as any;
        }).pipe(Effect.mapError((e) => (e instanceof Error ? e : new Error(String(e))))),
    };
  }),
);
