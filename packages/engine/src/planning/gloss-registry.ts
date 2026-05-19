export type GlossRegistryEntry = {
  label: string;
  durationMs: number;
};

export const GLOSS_REGISTRY: Record<string, GlossRegistryEntry> = {
  // ─── Core vocabulary ─────────────────────────────────────────────────────
  AGAIN: { label: "Again", durationMs: 720 }, // arc
  BAD: { label: "Bad", durationMs: 700 }, // arc
  BATHROOM: { label: "Bathroom", durationMs: 900 }, // shake
  COME: { label: "Come", durationMs: 760 }, // arc
  DOCTOR: { label: "Doctor", durationMs: 540 }, // none
  DRINK: { label: "Drink", durationMs: 780 }, // arc
  EMERGENCY: { label: "Emergency", durationMs: 980 }, // shake
  FAMILY: { label: "Family", durationMs: 860 }, // circle
  FIND: { label: "Find", durationMs: 800 }, // arc
  FOOD: { label: "Food", durationMs: 800 }, // tap
  GO: { label: "Go", durationMs: 720 }, // arc
  GOOD: { label: "Good", durationMs: 700 }, // arc
  HAVE: { label: "Have", durationMs: 740 }, // arc
  HELLO: { label: "Hello", durationMs: 820 }, // arc
  HELP: { label: "Help", durationMs: 860 }, // arc
  HOW: { label: "How", durationMs: 800 }, // circle
  INTERPRETER: { label: "Interpreter", durationMs: 980 }, // circle
  KNOW: { label: "Know", durationMs: 740 }, // tap
  LEARN: { label: "Learn", durationMs: 820 }, // arc
  LIKE: { label: "Like", durationMs: 760 }, // arc
  LOVE: { label: "Love", durationMs: 460 }, // none
  MEDICINE: { label: "Medicine", durationMs: 920 }, // circle
  MORE: { label: "More", durationMs: 680 }, // tap
  MUSIC: { label: "Music", durationMs: 820 }, // arc
  MY: { label: "My", durationMs: 320 }, // none
  NAME: { label: "Name", durationMs: 760 }, // tap
  NEED: { label: "Need", durationMs: 780 }, // tap
  NO: { label: "No", durationMs: 640 }, // tap
  NURSE: { label: "Nurse", durationMs: 840 }, // tap
  PAIN: { label: "Pain", durationMs: 820 }, // tap
  PLAY: { label: "Play", durationMs: 800 }, // shake
  PLEASE: { label: "Please", durationMs: 760 }, // circle
  SCHOOL: { label: "School", durationMs: 840 }, // tap
  SEE: { label: "See", durationMs: 700 }, // arc
  SIGN: { label: "Sign", durationMs: 840 }, // circle
  STOP: { label: "Stop", durationMs: 420 }, // none
  "THANK-YOU": { label: "Thank you", durationMs: 840 }, // arc
  UNDERSTAND: { label: "Understand", durationMs: 820 }, // arc
  WAIT: { label: "Wait", durationMs: 760 }, // shake
  WANT: { label: "Want", durationMs: 740 }, // arc
  WATER: { label: "Water", durationMs: 800 }, // tap
  WHAT: { label: "What", durationMs: 800 }, // shake
  WHEN: { label: "When", durationMs: 800 }, // circle
  WHERE: { label: "Where", durationMs: 820 }, // shake
  WHO: { label: "Who", durationMs: 800 }, // circle
  WORK: { label: "Work", durationMs: 760 }, // tap
  YES: { label: "Yes", durationMs: 640 }, // tap
};

export const GLOSS_REGISTRY_KEYS = Object.keys(GLOSS_REGISTRY);

export function isKnownGloss(token: string): boolean {
  return Object.prototype.hasOwnProperty.call(GLOSS_REGISTRY, token.toUpperCase());
}

export function getGlossDurationMs(token: string): number {
  return GLOSS_REGISTRY[token.toUpperCase()]?.durationMs ?? 500;
}
