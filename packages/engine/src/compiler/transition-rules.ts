import type { MotionType, Transition } from "../types";

export function getDefaultTransition(from: MotionType, to: MotionType): Transition {
  // If moving to/from 'none', use a slightly longer crossfade for smooth start/stop
  if (from === "none" || to === "none") {
    return { from, to, type: "crossfade", durationMs: 300 };
  }

  return {
    from,
    to,
    type: "blend",
    durationMs: 150,
  };
}

const transitionMap: Record<string, Transition> = {
  "arc|tap": { from: "arc", to: "tap", type: "blend", durationMs: 120 },
  "salute|circle": { from: "salute", to: "circle", type: "crossfade", durationMs: 300 },
  "forward-push|pull-back": {
    from: "forward-push",
    to: "pull-back",
    type: "inertial",
    durationMs: 250,
  },
  // Extend via JSON/Config in the future
};

export function getTransitionRule(from: MotionType, to: MotionType): Transition {
  const key = `${from}|${to}`;
  return transitionMap[key] || getDefaultTransition(from, to);
}
