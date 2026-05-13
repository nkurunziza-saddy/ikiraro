import { z } from "zod";

import {
  DEFAULT_STT_SPELLING_HINTS,
  FIXED_PHRASE_LIBRARY,
  SIGN_LEXEME_IDS,
  SIGN_LEXICON,
  WORD_TO_LEXEME,
  fingerspellToken,
  lexemeToken,
  numberToken,
  pauseToken,
  pointingToken,
  type SignLexemeId,
} from "./lexicon";
import {
  BENCHMARK_TAGS,
  EMPHASIS_LEVELS,
  PLANNER_MODELS,
  POINTING_TARGETS,
  TRANSLATION_DOMAINS,
  TRANSLATION_INTENTS,
  type BenchmarkTag,
  type CommunicationMode,
  type PlannerModel,
  type SignPlan,
  type SignToken,
  type TranslationContext,
  type TranslationDomain,
  type TranslationEnvelope,
  type TranslationIntent,
} from "./types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "am",
  "and",
  "are",
  "be",
  "for",
  "is",
  "me",
  "of",
  "please",
  "the",
  "to",
]);

const lexemeIdSchema = z.enum(SIGN_LEXEME_IDS);
const emphasisSchema = z.enum(EMPHASIS_LEVELS);
const pointingTargetSchema = z.enum(POINTING_TARGETS);
const intentSchema = z.enum(TRANSLATION_INTENTS);
const domainSchema = z.enum(TRANSLATION_DOMAINS);
const benchmarkTagSchema = z.enum(BENCHMARK_TAGS);
const plannerModelSchema = z.enum(PLANNER_MODELS);

const signTokenSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("lexeme"),
    lexemeId: lexemeIdSchema,
    durationMs: z.number().int().min(180).max(1600),
    emphasis: emphasisSchema,
  }),
  z.object({
    type: z.literal("fingerspell"),
    text: z.string().trim().min(1).max(40),
    durationMs: z.number().int().min(180).max(2200),
    emphasis: emphasisSchema,
  }),
  z.object({
    type: z.literal("number"),
    value: z.string().regex(/^[0-9]+$/),
    durationMs: z.number().int().min(180).max(2200),
    emphasis: emphasisSchema,
  }),
  z.object({
    type: z.literal("pointing"),
    target: pointingTargetSchema,
    durationMs: z.number().int().min(180).max(1200),
    emphasis: emphasisSchema,
  }),
  z.object({
    type: z.literal("pause"),
    durationMs: z.number().int().min(120).max(1500),
  }),
]);

export const signPlanSchema = z.object({
  sourceText: z.string(),
  normalizedText: z.string(),
  track: z.union([z.literal("semantic-translation"), z.literal("deterministic-fallback")]),
  strategy: z.union([z.literal("semantic"), z.literal("deterministic")]),
  clauses: z
    .array(
      z.object({
        intent: intentSchema,
        tokens: z.array(signTokenSchema).min(1),
      }),
    )
    .min(1),
  metadata: z.object({
    confidence: z.number().min(0).max(1),
    fallbackUsed: z.boolean(),
    reviewNeeded: z.boolean(),
    domain: domainSchema,
    benchmarkTag: benchmarkTagSchema,
    plannerModel: plannerModelSchema.optional(),
    notes: z.array(z.string()),
  }),
});

export function sanitizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function buildSttPrompt(hints: string[] = []): string {
  return [...DEFAULT_STT_SPELLING_HINTS, ...hints].join(", ");
}

function splitClauses(input: string): string[] {
  return input
    .split(/[.?!;]+/)
    .map((part) => sanitizeText(part))
    .filter(Boolean);
}

function inferIntent(normalized: string, domain: TranslationDomain): TranslationIntent {
  const lower = normalized.toLowerCase();

  if (/\bhello\b|\bhi\b/.test(lower)) {
    return "greeting";
  }

  if (/\bhelp\b/.test(lower)) {
    return "request-help";
  }

  if (/\bwhere\b|\bfind\b/.test(lower)) {
    return "locate";
  }

  if (/\bdoctor\b|\bnurse\b|\bmedicine\b|\bpain\b|\ballergy\b/.test(lower)) {
    return "medical";
  }

  if (/\bschool\b|\blearn\b/.test(lower)) {
    return "education";
  }

  if (/\bemergency\b/.test(lower)) {
    return "emergency";
  }

  if (/\bmy name\b/.test(lower)) {
    return "introduction";
  }

  if (/\bno\b|\bnot\b/.test(lower)) {
    return "negation";
  }

  if (/\byes\b/.test(lower)) {
    return "confirmation";
  }

  if (domain === "healthcare") {
    return "medical";
  }

  if (normalized.endsWith("?")) {
    return "question";
  }

  return "statement";
}

function normalizeTokenWord(word: string): string {
  return word.replace(/[^a-zA-Z0-9'-]/g, "");
}

function resolveWordToken(word: string): SignToken | null {
  const normalized = normalizeTokenWord(word).toLowerCase();

  if (!normalized || STOP_WORDS.has(normalized)) {
    return null;
  }

  if (normalized === "i" || normalized === "my") {
    return pointingToken("self");
  }

  if (normalized === "you" || normalized === "your") {
    return pointingToken("you");
  }

  if (normalized === "there" || normalized === "that") {
    return pointingToken("there");
  }

  if (/^[0-9]+$/.test(normalized)) {
    return numberToken(normalized);
  }

  const lexemeId = WORD_TO_LEXEME[normalized];
  if (lexemeId) {
    return lexemeToken(lexemeId);
  }

  return fingerspellToken(word.toUpperCase());
}

function tokensFromClause(clause: string): SignToken[] {
  const parts = clause.split(/\s+/);
  const tokens: SignToken[] = [];

  for (const part of parts) {
    const token = resolveWordToken(part);
    if (token) {
      tokens.push(token);
    }
  }

  return tokens;
}

function buildPhrasePlanMatch(
  normalized: string,
  domain: TranslationDomain,
  benchmarkTag: BenchmarkTag,
): SignPlan | null {
  for (const phrase of FIXED_PHRASE_LIBRARY) {
    if (!phrase.patterns.some((pattern) => pattern.test(normalized))) {
      continue;
    }

    const suffix = extractNameSuffix(normalized);
    const tokens = [...phrase.tokens];
    if (suffix) {
      tokens.push(pauseToken(), fingerspellToken(suffix));
    }

    return signPlanSchema.parse({
      sourceText: normalized,
      normalizedText: normalized.toLowerCase(),
      track: "deterministic-fallback",
      strategy: "deterministic",
      clauses: [
        {
          intent: phrase.intent,
          tokens,
        },
      ],
      metadata: {
        confidence: 0.92,
        fallbackUsed: tokens.some((token) => token.type === "fingerspell"),
        reviewNeeded: false,
        domain,
        benchmarkTag,
        notes: [`Matched fixed phrase: ${phrase.label}`],
      },
    });
  }

  return null;
}

function extractNameSuffix(normalized: string): string | null {
  const match = normalized.match(/\bmy name is ([a-zA-Z-]+)\b/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function finalizeNormalizedText(plan: SignPlan): string {
  return sanitizeText(plan.normalizedText || plan.sourceText);
}

export function buildDeterministicPlanFromText(
  sourceText: string,
  context: TranslationContext = {},
  options: {
    benchmarkTag?: BenchmarkTag;
    note?: string;
  } = {},
): SignPlan {
  const normalized = sanitizeText(sourceText);
  const domain = context.domain ?? "general";
  const benchmarkTag = options.benchmarkTag ?? "live-input";

  if (!normalized) {
    return signPlanSchema.parse({
      sourceText,
      normalizedText: "",
      track: "deterministic-fallback",
      strategy: "deterministic",
      clauses: [
        {
          intent: "statement",
          tokens: [pauseToken()],
        },
      ],
      metadata: {
        confidence: 0,
        fallbackUsed: false,
        reviewNeeded: true,
        domain,
        benchmarkTag,
        notes: ["No input provided."],
      },
    });
  }

  const phraseMatch = buildPhrasePlanMatch(normalized, domain, benchmarkTag);
  if (phraseMatch) {
    return phraseMatch;
  }

  const clauseTexts = splitClauses(sourceText);
  const clauses = clauseTexts.map((clauseText) => {
    const clauseTokens = tokensFromClause(clauseText);
    return {
      intent: inferIntent(clauseText, domain),
      tokens: clauseTokens.length > 0 ? clauseTokens : [fingerspellToken(clauseText.toUpperCase())],
    };
  });

  const fallbackUsed = clauses.some((clause) =>
    clause.tokens.some((token) => token.type === "fingerspell" || token.type === "number"),
  );

  const reviewNeeded = clauses.some((clause) =>
    clause.tokens.some((token) => token.type === "fingerspell"),
  );

  return signPlanSchema.parse({
    sourceText,
    normalizedText: normalized.toLowerCase(),
    track: "deterministic-fallback",
    strategy: "deterministic",
    clauses,
    metadata: {
      confidence: fallbackUsed ? 0.68 : 0.84,
      fallbackUsed,
      reviewNeeded,
      domain,
      benchmarkTag,
      notes: [options.note ?? "Deterministic phrase and fingerspelling fallback plan."],
    },
  });
}

export function buildDeterministicPlanFromUnits(
  units: string[],
  context: TranslationContext = {},
  mode: CommunicationMode = "sign-keys",
): SignPlan {
  const domain = context.domain ?? "general";
  const cleanedUnits = units.map((unit) => sanitizeText(unit)).filter(Boolean);
  const tokens: SignToken[] = [];
  let bufferedLetters = "";

  const flushLetters = () => {
    if (!bufferedLetters) {
      return;
    }

    tokens.push(fingerspellToken(bufferedLetters));
    bufferedLetters = "";
  };

  for (const unit of cleanedUnits) {
    if (unit === "/") {
      flushLetters();
      tokens.push(pauseToken());
      continue;
    }

    if (SIGN_LEXEME_IDS.includes(unit as SignLexemeId)) {
      flushLetters();
      tokens.push(lexemeToken(unit as SignLexemeId));
      continue;
    }

    if (/^[A-Z]$/.test(unit)) {
      bufferedLetters += unit;
      continue;
    }

    if (unit === "SELF" || unit === "YOU" || unit === "THERE") {
      flushLetters();
      tokens.push(pointingToken(unit.toLowerCase() as "self" | "you" | "there"));
      continue;
    }

    if (/^[0-9]+$/.test(unit)) {
      flushLetters();
      tokens.push(numberToken(unit));
      continue;
    }

    flushLetters();
    tokens.push(fingerspellToken(unit.toUpperCase()));
  }

  flushLetters();

  const sourceText = cleanedUnits.join(" ");
  const normalizedText = sourceText.replace(/\s*\/\s*/g, " / ");
  const note =
    mode === "camera-fingerspell"
      ? "Camera fingerspelling stays on the deterministic fallback track."
      : "Manual sign keyboard stays on the deterministic fallback track.";

  return signPlanSchema.parse({
    sourceText,
    normalizedText,
    track: "deterministic-fallback",
    strategy: "deterministic",
    clauses: [
      {
        intent: "statement",
        tokens: tokens.length > 0 ? tokens : [pauseToken()],
      },
    ],
    metadata: {
      confidence: 0.88,
      fallbackUsed: tokens.some((token) => token.type === "fingerspell" || token.type === "number"),
      reviewNeeded: false,
      domain,
      benchmarkTag: mode === "camera-fingerspell" ? "continuous-asl" : "live-input",
      notes: [note],
    },
  });
}

export function buildRendererQueue(plan: SignPlan): string[] {
  const queue: string[] = [];

  for (const clause of plan.clauses) {
    for (const token of clause.tokens) {
      if (token.type === "pause") {
        queue.push("/");
        continue;
      }

      if (token.type === "lexeme") {
        queue.push(SIGN_LEXICON[token.lexemeId as SignLexemeId]?.gloss ?? token.lexemeId);
        continue;
      }

      if (token.type === "pointing") {
        queue.push(`POINT:${token.target.toUpperCase()}`);
        continue;
      }

      if (token.type === "number") {
        queue.push(`#${token.value}`);
        continue;
      }

      queue.push(
        ...token.text
          .toUpperCase()
          .split("")
          .map((letter) => `FS:${letter}`),
      );
    }
  }

  return queue;
}

export function describePlan(plan: SignPlan): string[] {
  return plan.clauses.flatMap((clause) =>
    clause.tokens.map((token) => {
      if (token.type === "lexeme") {
        return SIGN_LEXICON[token.lexemeId as SignLexemeId]?.gloss ?? token.lexemeId;
      }

      if (token.type === "pointing") {
        return token.target.toUpperCase();
      }

      if (token.type === "number") {
        return token.value;
      }

      if (token.type === "pause") {
        return "/";
      }

      return token.text.toUpperCase();
    }),
  );
}

export function createStrictSignPlanJsonSchema(): Record<string, unknown> {
  const lexemeEnum = [...SIGN_LEXEME_IDS];
  const intentEnum = [...TRANSLATION_INTENTS];
  const domainEnum = [...TRANSLATION_DOMAINS];
  const emphasisEnum = [...EMPHASIS_LEVELS];
  const benchmarkEnum = [...BENCHMARK_TAGS];
  const plannerEnum = [...PLANNER_MODELS];
  const pointingEnum = [...POINTING_TARGETS];

  return {
    type: "object",
    additionalProperties: false,
    required: ["sourceText", "normalizedText", "track", "strategy", "clauses", "metadata"],
    properties: {
      sourceText: { type: "string" },
      normalizedText: { type: "string" },
      track: { const: "semantic-translation" },
      strategy: { const: "semantic" },
      clauses: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["intent", "tokens"],
          properties: {
            intent: { type: "string", enum: intentEnum },
            tokens: {
              type: "array",
              minItems: 1,
              items: {
                oneOf: [
                  {
                    type: "object",
                    additionalProperties: false,
                    required: ["type", "lexemeId", "durationMs", "emphasis"],
                    properties: {
                      type: { const: "lexeme" },
                      lexemeId: { type: "string", enum: lexemeEnum },
                      durationMs: { type: "integer", minimum: 180, maximum: 1600 },
                      emphasis: { type: "string", enum: emphasisEnum },
                    },
                  },
                  {
                    type: "object",
                    additionalProperties: false,
                    required: ["type", "text", "durationMs", "emphasis"],
                    properties: {
                      type: { const: "fingerspell" },
                      text: { type: "string", minLength: 1, maxLength: 40 },
                      durationMs: { type: "integer", minimum: 180, maximum: 2200 },
                      emphasis: { type: "string", enum: emphasisEnum },
                    },
                  },
                  {
                    type: "object",
                    additionalProperties: false,
                    required: ["type", "value", "durationMs", "emphasis"],
                    properties: {
                      type: { const: "number" },
                      value: { type: "string", pattern: "^[0-9]+$" },
                      durationMs: { type: "integer", minimum: 180, maximum: 2200 },
                      emphasis: { type: "string", enum: emphasisEnum },
                    },
                  },
                  {
                    type: "object",
                    additionalProperties: false,
                    required: ["type", "target", "durationMs", "emphasis"],
                    properties: {
                      type: { const: "pointing" },
                      target: { type: "string", enum: pointingEnum },
                      durationMs: { type: "integer", minimum: 180, maximum: 1200 },
                      emphasis: { type: "string", enum: emphasisEnum },
                    },
                  },
                  {
                    type: "object",
                    additionalProperties: false,
                    required: ["type", "durationMs"],
                    properties: {
                      type: { const: "pause" },
                      durationMs: { type: "integer", minimum: 120, maximum: 1500 },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      metadata: {
        type: "object",
        additionalProperties: false,
        required: [
          "confidence",
          "fallbackUsed",
          "reviewNeeded",
          "domain",
          "benchmarkTag",
          "plannerModel",
          "notes",
        ],
        properties: {
          confidence: { type: "number", minimum: 0, maximum: 1 },
          fallbackUsed: { type: "boolean" },
          reviewNeeded: { type: "boolean" },
          domain: { type: "string", enum: domainEnum },
          benchmarkTag: { type: "string", enum: benchmarkEnum },
          plannerModel: { type: "string", enum: plannerEnum },
          notes: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
  };
}

export function parseStructuredSignPlan(payload: unknown): SignPlan {
  const plan = signPlanSchema.parse(payload);
  return {
    ...plan,
    normalizedText: finalizeNormalizedText(plan),
  };
}

export function createTranslationEnvelope(
  mode: CommunicationMode,
  rawInput: string,
  plan: SignPlan,
  intake: TranslationEnvelope["intake"] = null,
): TranslationEnvelope {
  return {
    mode,
    intake,
    plan,
    rendererQueue: buildRendererQueue(plan),
    rawInput,
    normalizedText: plan.normalizedText,
  };
}

export function buildPlanningMessages(
  text: string,
  context: TranslationContext = {},
  plannerModel: PlannerModel,
): Array<{ role: "system" | "user"; content: string }> {
  const domain = context.domain ?? "general";
  const priorTurns = context.previousTurns ?? [];
  const hints = context.spellingHints ?? [];
  const lexiconSummary = SIGN_LEXEME_IDS.map((lexemeId) => {
    const lexeme = SIGN_LEXICON[lexemeId];
    return `${lexemeId}: ${lexeme.gloss}`;
  }).join(", ");

  return [
    {
      role: "system",
      content: [
        "You convert speech or text into a schema-validated ASL planning object.",
        "Do not invent sign strings or lexeme ids.",
        "Use only the lexeme ids provided in the schema/catalog.",
        "If a name or unknown term is not in the lexicon, use a fingerspell token.",
        "If a quantity appears, use a number token.",
        "If a pronoun is needed, prefer a pointing token.",
        `Planner model: ${plannerModel}.`,
        `Available lexeme ids: ${lexiconSummary}.`,
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        sourceText: text,
        domain,
        locale: context.locale ?? "en-US",
        spellingHints: hints,
        previousTurns: priorTurns,
        reminder:
          "Normalize meaning before signing. Preserve names, medication spellings, and unknown terms via fingerspelling.",
      }),
    },
  ];
}
