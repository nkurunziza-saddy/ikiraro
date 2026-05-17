import type {
  CommunicationMode,
  SemanticIntent,
  SignPlan,
  SignToken,
  SpeechIntake,
  TranslationEnvelope,
} from "../types";
import { isKnownGloss } from "./gloss-registry";
import { normalizeText } from "./normalizer";
import {
  INTER_UNIT_PAUSE_MS,
  INTER_WORD_PAUSE_MS,
  buildRendererQueue,
  fingerspellToken,
  lexemeToken,
  numberToken,
  pauseToken,
  pointingToken,
} from "./tokens";

const WH_GLOSS = new Set(["WHAT", "WHERE", "WHO", "WHEN", "WHY", "HOW"]);

export function buildPlanFromGloss(intent: SemanticIntent): SignPlan {
  const tokens: SignToken[] = [];
  const glosses: string[] = [];
  let hasWH = false;

  for (const token of intent.glossTokens) {
    const clean = token.trim().toUpperCase();
    if (!clean || clean === "/") {
      tokens.push(pauseToken(INTER_UNIT_PAUSE_MS));
      continue;
    }

    if (WH_GLOSS.has(clean)) hasWH = true;

    if (/^\d+$/.test(clean)) {
      tokens.push(numberToken(clean));
      glosses.push(`#${clean}`);
    } else if (isKnownGloss(clean)) {
      const t = lexemeToken(clean);
      if (WH_GLOSS.has(clean)) {
        t.facialExpression = "inquisitive";
        t.emphasis = "high";
      }
      tokens.push(t);
      glosses.push(clean);
    } else {
      tokens.push(fingerspellToken(clean));
      glosses.push(`FS:${clean}`);
    }

    tokens.push(pauseToken(INTER_WORD_PAUSE_MS));
  }

  return {
    sourceText: intent.rawGloss,
    normalizedText: normalizeText(intent.rawGloss),
    glossText: glosses.join(" "),
    track: intent.model === "deterministic-fallback" ? "deterministic" : "semantic",
    strategy: intent.model === "deterministic-fallback" ? "deterministic" : "semantic",
    clauses: [{ intent: hasWH ? "question" : "statement", tokens }],
    metadata: {
      confidence: intent.confidence,
      reviewNeeded: intent.confidence < 0.6,
      notes: [`Gloss model: ${intent.model}`],
    },
  };
}

export function buildPlanFromUnits(units: string[]): SignPlan {
  const tokens: SignToken[] = [];

  for (const unit of units) {
    if (unit === "/") {
      tokens.push(pauseToken(INTER_UNIT_PAUSE_MS));
    } else if (/^\d+$/.test(unit)) {
      tokens.push(numberToken(unit));
    } else if (unit === unit.toUpperCase() && unit.length === 1) {
      tokens.push(fingerspellToken(unit));
    } else if (unit.startsWith("PTR:")) {
      tokens.push(pointingToken(unit.slice(4)));
    } else {
      tokens.push(lexemeToken(unit));
    }
  }

  return {
    sourceText: units.join(" "),
    normalizedText: units.join(" "),
    glossText: units.join(" "),
    track: "deterministic",
    strategy: "deterministic",
    clauses: [{ intent: "manual-input", tokens }],
    metadata: { confidence: 1.0, reviewNeeded: false, notes: ["Manual sign entry"] },
  };
}

export function createEnvelope(
  plan: SignPlan,
  options: {
    mode?: CommunicationMode;
    rawInput?: string;
    intake?: SpeechIntake | null;
    intent?: SemanticIntent;
  } = {},
): TranslationEnvelope {
  return {
    mode: options.mode ?? "text",
    intake: options.intake ?? null,
    plan,
    rendererQueue: buildRendererQueue(plan),
    rawInput: options.rawInput ?? plan.sourceText,
    normalizedText: plan.normalizedText,
    intent: options.intent,
  };
}
