import type { SemanticIntent } from "../types";
import { GlossOutputSchema, GroqChatResponseSchema } from "./schemas";
import { SYSTEM_PROMPT_HINT } from "./gloss-registry";
import { normalizeText } from "./normalizer";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

export const GLOSS_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"] as const;
export type GlossModel = (typeof GLOSS_MODELS)[number];
export const DEFAULT_GLOSS_MODEL: GlossModel = "llama-3.1-8b-instant";

const SYSTEM_PROMPT = `You are an expert ASL (American Sign Language) gloss notation generator.

Convert English text to ASL gloss notation following these rules:
1. Output UPPERCASE words representing ASL signs, separated by spaces
2. Drop articles (a, an, the), most copulas (is, am, are, was), and auxiliary verbs (do, does, did) unless semantically critical
3. Move WH-question words (WHAT, WHERE, WHO, WHEN, WHY, HOW) to the END of the sentence per ASL grammar
4. Prefer these known signs when the meaning matches: ${SYSTEM_PROMPT_HINT}
5. For proper nouns or words without a matching sign, output them in UPPERCASE (they will be fingerspelled)
6. Preserve numbers as digits (e.g. "five" → 5, "room 3" → ROOM 3)
7. Express negation with NO before the concept (e.g. "I don't understand" → UNDERSTAND NO)

Respond with valid JSON only — no markdown, no explanation:
{"gloss": "SIGN SIGN SIGN", "confidence": 0.9}`;

function buildFingerspellFallback(text: string): SemanticIntent {
  const normalized = normalizeText(text);
  const words = normalized.split(" ").filter(Boolean);
  const glossTokens = words.map((w) => w.toUpperCase());
  return {
    rawGloss: glossTokens.join(" "),
    glossTokens,
    confidence: 0,
    model: "deterministic-fallback",
  };
}

export async function generateGloss(options: {
  text: string;
  apiKey: string;
  model?: GlossModel;
}): Promise<SemanticIntent> {
  const normalized = normalizeText(options.text);
  if (!normalized) return buildFingerspellFallback(options.text);

  const model = options.model ?? DEFAULT_GLOSS_MODEL;

  let response: Response;
  try {
    response = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Convert to ASL gloss: "${normalized}"` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 256,
      }),
    });
  } catch {
    return buildFingerspellFallback(options.text);
  }

  if (!response.ok) return buildFingerspellFallback(options.text);

  let rawJson: unknown;
  try {
    rawJson = await response.json();
  } catch {
    return buildFingerspellFallback(options.text);
  }

  const chatResult = GroqChatResponseSchema.safeParse(rawJson);
  if (!chatResult.success) return buildFingerspellFallback(options.text);

  const content = chatResult.data.choices[0]?.message.content ?? "";

  let parsedContent: unknown;
  try {
    parsedContent = JSON.parse(content);
  } catch {
    return buildFingerspellFallback(options.text);
  }

  const glossResult = GlossOutputSchema.safeParse(parsedContent);
  if (!glossResult.success) return buildFingerspellFallback(options.text);

  const rawGloss = glossResult.data.gloss.trim();
  const glossTokens = rawGloss
    .split(/\s+/)
    .map((t) => t.toUpperCase())
    .filter(Boolean);

  return {
    rawGloss,
    glossTokens,
    confidence: glossResult.data.confidence,
    model,
    promptTokens: chatResult.data.usage?.prompt_tokens,
  };
}
