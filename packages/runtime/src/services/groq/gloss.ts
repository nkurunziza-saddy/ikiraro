import { Effect, Layer, Schema } from "effect";
import {
  GlossService,
  GLOSS_REGISTRY_KEYS,
  GLOSS_OUTPUT_SCHEMA,
  GROQ_CHAT_RESPONSE_SCHEMA,
} from "@ikiraro/engine/planning";
import type { SemanticIntent } from "@ikiraro/engine/types";
import { Groq } from "./client";

const DEFAULT_GROQ_GLOSS_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GLOSS_MODEL = "llama-3.3-70b-versatile";

// Exclude pronouns handled by PTR: tokens — listing them as known signs
// contradicts section 2 of the prompt and confuses the model.
const PRONOUN_OVERRIDES = new Set(["MY"]);
const KNOWN_SIGNS = GLOSS_REGISTRY_KEYS.filter((k) => !PRONOUN_OVERRIDES.has(k)).join(" ");

const SYSTEM_PROMPT = `You are an expert ASL (American Sign Language) interpreter.
Convert English to ASL Gloss — the written notation used by ASL educators.

OUTPUT (valid JSON only): {"gloss": "TOKEN TOKEN ...", "confidence": 0.0–1.0}

═══ TOKEN TYPES (three kinds, never mix them) ═══

1. KNOWN SIGNS — output the word in CAPS exactly as shown. Do NOT prefix with FS:.
   ${KNOWN_SIGNS}

2. POINTING TOKENS — replace English pronouns with these exactly:
   I / ME / MY / MINE  →  PTR:SELF
   YOU / YOUR          →  PTR:YOU
   HE / SHE / HIM / HER / IT / THEY / THEM  →  PTR:THAT
   ⚠ Never write FS:PTR:SELF. PTR: tokens are NOT fingerspelled.

3. FINGERSPELL — for proper nouns (names, places) and any word NOT in the known signs list:
   FS:JACK   FS:CALIFORNIA   FS:PIZZA
   ⚠ Never write FS:FS:WORD. One FS: prefix only.

4. PAUSE — use / between distinct clauses.

═══ ASL GRAMMAR RULES ═══
• Drop: a, an, the, am, is, are, was, were, to (infinitive), of
• Topic-comment order when natural (BATHROOM WHERE, not WHERE IS BATHROOM)
• Signs exist for: name → NAME, my name → NAME PTR:SELF, thank you → THANK-YOU

═══ EXAMPLES ═══
"Hello, my name is Jack"           → HELLO NAME PTR:SELF FS:JACK
"I like to sing"                   → PTR:SELF LIKE MUSIC
"Do you want water?"               → PTR:YOU WANT WATER
"Where is the bathroom?"           → BATHROOM WHERE
"I need help, please"              → PTR:SELF NEED HELP PLEASE
"Thank you, I understand"          → THANK-YOU PTR:SELF UNDERSTAND
"Hi my name is Jack and I like to sing" → HELLO NAME PTR:SELF FS:JACK / PTR:SELF LIKE MUSIC
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

          const rawJson = yield* _(
            Effect.tryPromise({
              try: () => response.json() as Promise<unknown>,
              catch: (e) => (e instanceof Error ? e : new Error(String(e))),
            }),
          );

          const groqResponse = yield* _(
            Schema.decodeUnknown(GROQ_CHAT_RESPONSE_SCHEMA)(rawJson),
            Effect.mapError(() => new Error("Invalid Groq response format")),
          );

          const content = groqResponse.choices[0]?.message.content;
          if (!content) return yield* _(Effect.fail(new Error("No gloss content returned")));

          const glossResult = yield* _(
            Effect.try({
              try: () => JSON.parse(content) as unknown,
              catch: () => new Error("Invalid gloss format returned by model"),
            }),
            Effect.flatMap(Schema.decodeUnknown(GLOSS_OUTPUT_SCHEMA)),
            Effect.mapError(() => new Error("Invalid gloss format returned by model")),
          );

          return {
            rawGloss: glossResult.gloss,
            glossTokens: glossResult.gloss.split(" "),
            confidence: glossResult.confidence,
            model: model ?? DEFAULT_GLOSS_MODEL,
            promptTokens: groqResponse.usage?.prompt_tokens,
          } satisfies SemanticIntent;
        }).pipe(Effect.mapError((e) => (e instanceof Error ? e : new Error(String(e))))),
    };
  }),
);
