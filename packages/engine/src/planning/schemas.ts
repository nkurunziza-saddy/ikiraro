import { z } from "zod";
import { Schema } from "effect";

export const GlossOutputSchema = z.object({
  gloss: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const GLOSS_OUTPUT_SCHEMA = Schema.Struct({
  gloss: Schema.String.pipe(Schema.minLength(1)),
  confidence: Schema.Number.pipe(Schema.between(0, 1)),
});

export const GroqChatResponseSchema = z.object({
  model: z.string(),
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string(),
        }),
      }),
    )
    .min(1),
  usage: z
    .object({
      prompt_tokens: z.number().optional(),
      total_tokens: z.number().optional(),
    })
    .optional(),
});

export type GlossOutput = z.infer<typeof GlossOutputSchema>;
export type GroqChatResponse = z.infer<typeof GroqChatResponseSchema>;
