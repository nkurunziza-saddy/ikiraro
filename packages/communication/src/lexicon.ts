import type {
  BenchmarkTag,
  EmphasisLevel,
  FingerspellToken,
  LexemeToken,
  NumberToken,
  PauseToken,
  PointingTarget,
  PointingToken,
  SignToken,
  TranslationDomain,
  TranslationIntent,
} from "./types";

type LexemeDefinition = {
  label: string;
  gloss: string;
  durationMs: number;
  domains: TranslationDomain[];
};

export const SIGN_LEXICON = {
  AGAIN: { label: "Again", gloss: "AGAIN", durationMs: 420, domains: ["general", "education"] },
  ALLERGY: {
    label: "Allergy",
    gloss: "ALLERGY",
    durationMs: 520,
    domains: ["healthcare"],
  },
  BATHROOM: {
    label: "Bathroom",
    gloss: "BATHROOM",
    durationMs: 560,
    domains: ["general", "support", "healthcare"],
  },
  DOCTOR: { label: "Doctor", gloss: "DOCTOR", durationMs: 540, domains: ["healthcare"] },
  DRINK: { label: "Drink", gloss: "DRINK", durationMs: 480, domains: ["general", "healthcare"] },
  EMERGENCY: {
    label: "Emergency",
    gloss: "EMERGENCY",
    durationMs: 640,
    domains: ["support", "healthcare"],
  },
  FAMILY: { label: "Family", gloss: "FAMILY", durationMs: 520, domains: ["general"] },
  FIND: { label: "Find", gloss: "FIND", durationMs: 500, domains: ["general", "support"] },
  FOOD: { label: "Food", gloss: "FOOD", durationMs: 500, domains: ["general", "healthcare"] },
  GO: { label: "Go", gloss: "GO", durationMs: 420, domains: ["general"] },
  HELLO: { label: "Hello", gloss: "HELLO", durationMs: 520, domains: ["general", "support"] },
  HELP: { label: "Help", gloss: "HELP", durationMs: 560, domains: ["general", "support"] },
  INTERPRETER: {
    label: "Interpreter",
    gloss: "INTERPRETER",
    durationMs: 640,
    domains: ["support", "education", "healthcare"],
  },
  LEARN: { label: "Learn", gloss: "LEARN", durationMs: 520, domains: ["education"] },
  MEDICINE: {
    label: "Medicine",
    gloss: "MEDICINE",
    durationMs: 580,
    domains: ["healthcare"],
  },
  NAME: { label: "Name", gloss: "NAME", durationMs: 460, domains: ["general", "support"] },
  NEED: { label: "Need", gloss: "NEED", durationMs: 480, domains: ["general", "support"] },
  NO: { label: "No", gloss: "NO", durationMs: 340, domains: ["general", "support"] },
  NURSE: { label: "Nurse", gloss: "NURSE", durationMs: 540, domains: ["healthcare"] },
  PAIN: { label: "Pain", gloss: "PAIN", durationMs: 520, domains: ["healthcare"] },
  PLEASE: { label: "Please", gloss: "PLEASE", durationMs: 420, domains: ["general", "support"] },
  SCHOOL: { label: "School", gloss: "SCHOOL", durationMs: 540, domains: ["education"] },
  STOP: { label: "Stop", gloss: "STOP", durationMs: 420, domains: ["general", "support"] },
  THANK_YOU: {
    label: "Thank you",
    gloss: "THANK-YOU",
    durationMs: 540,
    domains: ["general", "support"],
  },
  UNDERSTAND: {
    label: "Understand",
    gloss: "UNDERSTAND",
    durationMs: 520,
    domains: ["general", "education", "support"],
  },
  WAIT: { label: "Wait", gloss: "WAIT", durationMs: 420, domains: ["general", "support"] },
  WATER: { label: "Water", gloss: "WATER", durationMs: 500, domains: ["general", "healthcare"] },
  WHAT: { label: "What", gloss: "WHAT", durationMs: 460, domains: ["general", "education"] },
  WHEN: { label: "When", gloss: "WHEN", durationMs: 460, domains: ["general", "education"] },
  WHERE: { label: "Where", gloss: "WHERE", durationMs: 480, domains: ["general", "support"] },
  WHO: { label: "Who", gloss: "WHO", durationMs: 460, domains: ["general"] },
  YES: { label: "Yes", gloss: "YES", durationMs: 340, domains: ["general", "support"] },
} as const satisfies Record<string, LexemeDefinition>;

export type SignLexemeId = keyof typeof SIGN_LEXICON;

export const SIGN_LEXEME_IDS = Object.keys(SIGN_LEXICON) as SignLexemeId[];

export const DEFAULT_STT_SPELLING_HINTS = [
  "Sensa",
  "ASL",
  "Kigali",
  "interpreter",
  "amoxicillin",
  "ibuprofen",
  "bathroom",
  "caregiver",
];

export const WORD_TO_LEXEME: Record<string, SignLexemeId> = {
  again: "AGAIN",
  allergy: "ALLERGY",
  allergies: "ALLERGY",
  bathroom: "BATHROOM",
  doctor: "DOCTOR",
  drink: "DRINK",
  emergency: "EMERGENCY",
  family: "FAMILY",
  find: "FIND",
  food: "FOOD",
  go: "GO",
  hello: "HELLO",
  help: "HELP",
  hi: "HELLO",
  interpreter: "INTERPRETER",
  learn: "LEARN",
  medicine: "MEDICINE",
  meds: "MEDICINE",
  name: "NAME",
  need: "NEED",
  no: "NO",
  nurse: "NURSE",
  pain: "PAIN",
  please: "PLEASE",
  restroom: "BATHROOM",
  school: "SCHOOL",
  stop: "STOP",
  thanks: "THANK_YOU",
  thank: "THANK_YOU",
  understand: "UNDERSTAND",
  wait: "WAIT",
  water: "WATER",
  what: "WHAT",
  when: "WHEN",
  where: "WHERE",
  who: "WHO",
  yes: "YES",
};

export type FixedPhraseDefinition = {
  id: string;
  label: string;
  intent: TranslationIntent;
  domain: TranslationDomain;
  benchmarkTag: BenchmarkTag;
  patterns: RegExp[];
  tokens: SignToken[];
};

export function lexemeToken(
  lexemeId: SignLexemeId,
  emphasis: EmphasisLevel = "normal",
  durationMs = SIGN_LEXICON[lexemeId].durationMs,
): LexemeToken {
  return {
    type: "lexeme",
    lexemeId,
    emphasis,
    durationMs,
  };
}

export function fingerspellToken(
  text: string,
  emphasis: EmphasisLevel = "normal",
  durationMs = Math.max(420, text.trim().length * 120),
): FingerspellToken {
  return {
    type: "fingerspell",
    text,
    emphasis,
    durationMs,
  };
}

export function numberToken(
  value: string,
  emphasis: EmphasisLevel = "normal",
  durationMs = Math.max(420, value.length * 110),
): NumberToken {
  return {
    type: "number",
    value,
    emphasis,
    durationMs,
  };
}

export function pointingToken(
  target: PointingTarget,
  emphasis: EmphasisLevel = "normal",
  durationMs = 360,
): PointingToken {
  return {
    type: "pointing",
    target,
    emphasis,
    durationMs,
  };
}

export function pauseToken(durationMs = 220): PauseToken {
  return {
    type: "pause",
    durationMs,
  };
}

export const FIXED_PHRASE_LIBRARY: FixedPhraseDefinition[] = [
  {
    id: "hello-help",
    label: "Hello / Help",
    intent: "greeting",
    domain: "support",
    benchmarkTag: "held-out-phrases",
    patterns: [/^\s*hello help\s*$/i],
    tokens: [lexemeToken("HELLO"), pauseToken(), lexemeToken("HELP")],
  },
  {
    id: "thank-you",
    label: "Thank you",
    intent: "statement",
    domain: "general",
    benchmarkTag: "held-out-phrases",
    patterns: [/^\s*thank you\s*$/i, /^\s*thanks\s*$/i],
    tokens: [lexemeToken("THANK_YOU")],
  },
  {
    id: "need-help",
    label: "I need help",
    intent: "request-help",
    domain: "support",
    benchmarkTag: "held-out-phrases",
    patterns: [/^\s*i need help\s*$/i, /^\s*help me\s*$/i],
    tokens: [pointingToken("self"), lexemeToken("NEED"), lexemeToken("HELP", "high")],
  },
  {
    id: "where-bathroom",
    label: "Where is the bathroom",
    intent: "locate",
    domain: "support",
    benchmarkTag: "held-out-phrases",
    patterns: [
      /^\s*where(?: is|'s)?(?: the)? bathroom\s*\??\s*$/i,
      /^\s*where(?: is|'s)?(?: the)? restroom\s*\??\s*$/i,
    ],
    tokens: [lexemeToken("WHERE"), lexemeToken("BATHROOM")],
  },
  {
    id: "water-please",
    label: "Water please",
    intent: "statement",
    domain: "healthcare",
    benchmarkTag: "held-out-phrases",
    patterns: [/^\s*water please\s*$/i, /^\s*please water\s*$/i],
    tokens: [lexemeToken("WATER"), lexemeToken("PLEASE")],
  },
  {
    id: "need-medicine",
    label: "I need medicine",
    intent: "medical",
    domain: "healthcare",
    benchmarkTag: "held-out-phrases",
    patterns: [/^\s*i need medicine\s*$/i, /^\s*i need meds\s*$/i],
    tokens: [pointingToken("self"), lexemeToken("NEED"), lexemeToken("MEDICINE")],
  },
  {
    id: "need-interpreter",
    label: "I need an interpreter",
    intent: "request-help",
    domain: "support",
    benchmarkTag: "held-out-phrases",
    patterns: [/^\s*i need (an )?interpreter\s*$/i],
    tokens: [pointingToken("self"), lexemeToken("NEED"), lexemeToken("INTERPRETER")],
  },
  {
    id: "my-name",
    label: "My name is ...",
    intent: "introduction",
    domain: "general",
    benchmarkTag: "held-out-phrases",
    patterns: [/^\s*my name is [a-zA-Z-]+\s*\.?\s*$/i],
    tokens: [pointingToken("self"), lexemeToken("NAME")],
  },
];

export function buildPhraseUnits(tokens: SignToken[]): string[] {
  const units: string[] = [];

  for (const token of tokens) {
    if (token.type === "pause") {
      units.push("/");
      continue;
    }

    if (token.type === "lexeme") {
      units.push(token.lexemeId);
      continue;
    }

    if (token.type === "pointing") {
      units.push(token.target.toUpperCase());
      continue;
    }

    if (token.type === "fingerspell") {
      units.push(...token.text.toUpperCase().split(""));
      continue;
    }

    units.push(token.value);
  }

  return units;
}
