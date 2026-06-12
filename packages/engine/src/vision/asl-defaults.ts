/**
 * Domain constants for ASL hand geometry and timing.
 * These are research-calibrated values, not tuning knobs.
 */
export const ASL_DEFAULTS = {
  /** Hand velocity magnitude above which a sign is considered "in motion". */
  motionVelocityThreshold: 0.15,
  /** Silence duration (ms) after which the linguistic buffer flushes the current word. */
  pauseThresholdMs: 1000,
  /** Hold duration (ms) on the same letter to trigger a double-letter commit. */
  doubleLetterHoldMs: 1500,
  /** Minimum hold duration (ms) before a new letter is accepted into the buffer. */
  minLetterHoldMs: 250,
} as const;
