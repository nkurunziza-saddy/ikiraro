/**
 * Domain constants for ASL hand geometry and timing.
 * These are research-calibrated values, not tuning knobs.
 */
export const ASL_DEFAULTS = {
  /** Minimum PIP joint angle (degrees) for a finger to be counted as extended. */
  pipExtensionAngle: 155,
  /** Minimum DIP joint angle (degrees) for a finger to be counted as extended. */
  dipExtensionAngle: 150,
  /** Minimum IP joint angle (degrees) for the thumb to be counted as extended. */
  thumbExtensionAngle: 140,
  /** Hand velocity magnitude above which a sign is considered "in motion". */
  motionVelocityThreshold: 0.15,
  /** Silence duration (ms) after which the linguistic buffer flushes the current word. */
  pauseThresholdMs: 1000,
  /** Hold duration (ms) on the same letter to trigger a double-letter commit. */
  doubleLetterHoldMs: 1500,
  /** Minimum hold duration (ms) before a new letter is accepted into the buffer. */
  minLetterHoldMs: 250,
} as const;
