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
  fingerspellToken,
  lexemeToken,
  numberToken,
  pauseToken,
  pointingToken,
} from "./tokens";
import { buildFrameQueue } from "./frame-queue";
const WH_GLOSS = new Set(["WHAT", "WHERE", "WHO", "WHEN", "WHY", "HOW"]);

const PRONOUN_PTR: Record<string, string> = {
  I: "SELF",
  ME: "SELF",
  MY: "SELF",
  YOU: "YOU",
  YOUR: "YOU",
  HE: "THAT",
  SHE: "THAT",
  HIM: "THAT",
  HER: "THAT",
  IT: "THAT",
  THEY: "THAT",
  THEM: "THAT",
};
function pushLexeme(tokens: SignToken[], glosses: string[], hasWH: { v: boolean }, clean: string) {
  if (WH_GLOSS.has(clean)) hasWH.v = true;
  const t = lexemeToken(clean);
  if (WH_GLOSS.has(clean)) {
    t.facialExpression = "inquisitive";
    t.emphasis = "high";
  }
  tokens.push(t);
  glosses.push(clean);
}
export function buildPlanFromGloss(intent: SemanticIntent, intake?: SpeechIntake | null): SignPlan {
  const tokens: SignToken[] = [];
  const glosses: string[] = [];
  const hasWH = { v: false };

  for (const token of intent.glossTokens) {
    const clean = token.trim().toUpperCase();
    if (!clean || clean === "/") {
      tokens.push(pauseToken(INTER_UNIT_PAUSE_MS));
      continue;
    }

    if (clean.startsWith("PTR:")) {
      tokens.push(pointingToken(clean.slice(4)));
      glosses.push(clean);
      tokens.push(pauseToken(INTER_WORD_PAUSE_MS));
      continue;
    }

    if (clean.startsWith("FS:")) {
      let word = clean.slice(3);
      if (word.startsWith("FS:")) word = word.slice(3);
      if (word.startsWith("PTR:")) {
        tokens.push(pointingToken(word.slice(4)));
        glosses.push(`PTR:${word.slice(4)}`);
      } else if (PRONOUN_PTR[word]) {
        tokens.push(pointingToken(PRONOUN_PTR[word]!));
        glosses.push(`PTR:${PRONOUN_PTR[word]}`);
      } else if (isKnownGloss(word)) {
        pushLexeme(tokens, glosses, hasWH, word);
      } else {
        tokens.push(fingerspellToken(word));
        glosses.push(`FS:${word}`);
      }
      tokens.push(pauseToken(INTER_WORD_PAUSE_MS));
      continue;
    }
    if (/^\d+$/.test(clean)) {
      tokens.push(numberToken(clean));
      glosses.push(`#${clean}`);
    } else if (PRONOUN_PTR[clean]) {
      tokens.push(pointingToken(PRONOUN_PTR[clean]!));
      glosses.push(`PTR:${PRONOUN_PTR[clean]}`);
    } else if (isKnownGloss(clean)) {
      pushLexeme(tokens, glosses, hasWH, clean);
    } else {
      tokens.push(fingerspellToken(clean));
      glosses.push(`FS:${clean}`);
    }
    tokens.push(pauseToken(INTER_WORD_PAUSE_MS));
  }
  const hasWHValue = hasWH.v;

  if (intake && intake.durationSeconds) {
    const totalSpeechMs = intake.durationSeconds * 1000;
    const totalBaseMs = tokens.reduce((acc, t) => acc + t.durationMs, 0);

    const scale = Math.min(2.0, Math.max(0.5, totalSpeechMs / totalBaseMs));
    for (const token of tokens) {
      if (token.type !== "pause") {
        token.durationMs = Math.round(token.durationMs * scale);
      }
    }
  }
  return {
    sourceText: intent.rawGloss,
    normalizedText: normalizeText(intent.rawGloss),
    glossText: glosses.join(" "),
    track: intent.model === "deterministic-fallback" ? "deterministic" : "semantic",
    strategy: intent.model === "deterministic-fallback" ? "deterministic" : "semantic",
    clauses: [{ intent: hasWHValue ? "question" : "statement", tokens }],
    metadata: {
      confidence: intent.confidence,
      reviewNeeded: intent.confidence < 0.6,
      notes: [
        `Gloss model: ${intent.model}`,
        intake ? `Synchronized to ${intake.durationSeconds?.toFixed(2)}s audio` : "Static timing",
      ],
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
    rendererQueue: buildFrameQueue(plan),
    rawInput: options.rawInput ?? plan.sourceText,
    normalizedText: plan.normalizedText,
    intent: options.intent,
  };
}
