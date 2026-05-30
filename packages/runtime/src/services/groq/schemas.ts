import { Schema } from "effect";
export const GLOSS_OUTPUT_SCHEMA = Schema.Struct({
  gloss: Schema.String.pipe(Schema.minLength(1)),
  confidence: Schema.optional(Schema.Number.pipe(Schema.between(0, 1))).pipe(
    Schema.withDefaults({ constructor: () => 1, decoding: () => 1 }),
  ),
});
export const GROQ_CHAT_RESPONSE_SCHEMA = Schema.Struct({
  model: Schema.String,
  choices: Schema.Array(
    Schema.Struct({
      message: Schema.Struct({
        content: Schema.String,
      }),
    }),
  ).pipe(Schema.minItems(1)),
  usage: Schema.optional(
    Schema.Struct({
      prompt_tokens: Schema.optional(Schema.Number),
      total_tokens: Schema.optional(Schema.Number),
    }),
  ),
});
export type GlossOutput = Schema.Schema.Type<typeof GLOSS_OUTPUT_SCHEMA>;
export type GroqChatResponse = Schema.Schema.Type<typeof GROQ_CHAT_RESPONSE_SCHEMA>;

export const STT_RESPONSE_SCHEMA = Schema.Struct({
  text: Schema.optional(Schema.String),
  language: Schema.optional(Schema.String),
  duration: Schema.optional(Schema.Number),
  words: Schema.optional(
    Schema.Array(
      Schema.Struct({
        word: Schema.String,
        start: Schema.Number,
        end: Schema.Number,
        confidence: Schema.Number,
      }),
    ),
  ),
  segments: Schema.optional(
    Schema.Array(
      Schema.Struct({
        id: Schema.Number,
        start: Schema.Number,
        end: Schema.Number,
        text: Schema.String,
      }),
    ),
  ),
});
