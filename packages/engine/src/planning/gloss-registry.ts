export type GlossRegistryEntry = {
  label: string;
  durationMs: number;
};

export const GLOSS_REGISTRY: Record<string, GlossRegistryEntry> = {
  AGAIN: { label: "Again", durationMs: 420 },
  BATHROOM: { label: "Bathroom", durationMs: 560 },
  DOCTOR: { label: "Doctor", durationMs: 540 },
  DRINK: { label: "Drink", durationMs: 480 },
  EMERGENCY: { label: "Emergency", durationMs: 640 },
  FAMILY: { label: "Family", durationMs: 520 },
  FIND: { label: "Find", durationMs: 500 },
  FOOD: { label: "Food", durationMs: 500 },
  GO: { label: "Go", durationMs: 420 },
  HELLO: { label: "Hello", durationMs: 520 },
  HELP: { label: "Help", durationMs: 560 },
  INTERPRETER: { label: "Interpreter", durationMs: 640 },
  LEARN: { label: "Learn", durationMs: 520 },
  MEDICINE: { label: "Medicine", durationMs: 580 },
  NAME: { label: "Name", durationMs: 460 },
  NEED: { label: "Need", durationMs: 480 },
  NO: { label: "No", durationMs: 340 },
  NURSE: { label: "Nurse", durationMs: 540 },
  PAIN: { label: "Pain", durationMs: 520 },
  PLEASE: { label: "Please", durationMs: 420 },
  SCHOOL: { label: "School", durationMs: 540 },
  STOP: { label: "Stop", durationMs: 420 },
  "THANK-YOU": { label: "Thank you", durationMs: 540 },
  UNDERSTAND: { label: "Understand", durationMs: 520 },
  WAIT: { label: "Wait", durationMs: 420 },
  WATER: { label: "Water", durationMs: 500 },
  WHAT: { label: "What", durationMs: 460 },
  WHEN: { label: "When", durationMs: 460 },
  WHERE: { label: "Where", durationMs: 480 },
  WHO: { label: "Who", durationMs: 460 },
  YES: { label: "Yes", durationMs: 340 },
};

export const GLOSS_REGISTRY_KEYS = Object.keys(GLOSS_REGISTRY);

export function isKnownGloss(token: string): boolean {
  return Object.prototype.hasOwnProperty.call(GLOSS_REGISTRY, token.toUpperCase());
}

export function getGlossDurationMs(token: string): number {
  return GLOSS_REGISTRY[token.toUpperCase()]?.durationMs ?? 500;
}

export const SYSTEM_PROMPT_HINT = GLOSS_REGISTRY_KEYS.join(", ");
