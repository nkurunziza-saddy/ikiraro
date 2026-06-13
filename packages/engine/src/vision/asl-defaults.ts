/**
 * Domain constants for ASL hand geometry and timing.
 * These are research-calibrated values, not tuning knobs.
 */
export const ASL_DEFAULTS = {
  /** Hand velocity magnitude above which a sign is considered "in motion". */
  motionVelocityThreshold: 0.15,
  /** Silence duration (ms) after which the linguistic buffer flushes the current word. */
  pauseThresholdMs: 1000,
  /** Hold duration (ms) on the same letter to trigger a double-letter commit.
   * ~5× the median real letter period (183ms) — long enough to be deliberate,
   * short enough not to stall spelling. */
  doubleLetterHoldMs: 900,
  /** Minimum hold duration (ms) before a new letter is accepted into the buffer.
   * Real signers hold a letter for only ~116ms at fluent pace (Google ASL
   * Fingerspelling data: 183ms/letter median minus 67ms transition), so values
   * much above that drop letters from fast signers. */
  minLetterHoldMs: 120,
} as const;
