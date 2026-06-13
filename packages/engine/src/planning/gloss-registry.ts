export type GlossRegistryEntry = {
  label: string;
  durationMs: number;
};

export const GLOSS_REGISTRY: Record<string, GlossRegistryEntry> = {
  AGAIN: { label: "Again", durationMs: 720 },
  BAD: { label: "Bad", durationMs: 700 },
  DOCTOR: { label: "Doctor", durationMs: 540 },
  FAMILY: { label: "Family", durationMs: 860 },
  GO: { label: "Go", durationMs: 720 },
  GOOD: { label: "Good", durationMs: 700 },
  HELLO: { label: "Hello", durationMs: 1800 },
  HELP: { label: "Help", durationMs: 860 },
  HOW: { label: "How", durationMs: 800 },
  INTERPRETER: { label: "Interpreter", durationMs: 980 },
  LOVE: { label: "Love", durationMs: 460 },
  MEDICINE: { label: "Medicine", durationMs: 920 },
  PLEASE: { label: "Please", durationMs: 760 },
  SEE: { label: "See", durationMs: 700 },
  SIGN: { label: "Sign", durationMs: 840 },
  "THANK-YOU": { label: "Thank you", durationMs: 840 },
  WHEN: { label: "When", durationMs: 800 },
  WHO: { label: "Who", durationMs: 800 },
};

export const GLOSS_REGISTRY_KEYS = Object.keys(GLOSS_REGISTRY);

export function isKnownGloss(token: string): boolean {
  return Object.hasOwn(GLOSS_REGISTRY, token.toUpperCase());
}

export function getGlossDurationMs(token: string): number {
  return GLOSS_REGISTRY[token.toUpperCase()]?.durationMs ?? 500;
}
