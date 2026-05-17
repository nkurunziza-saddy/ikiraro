import { z } from "zod";

export const GlossOutputSchema = z.object({
  gloss: z.string().min(1),
  confidence: z.number().min(0).max(1),
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
