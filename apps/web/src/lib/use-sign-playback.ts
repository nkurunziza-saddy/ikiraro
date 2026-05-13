import type { PointingTarget, SignPlan } from "@sensa/communication";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PROGRESS_UPDATE_INTERVAL_MS = 50;
const PROGRESS_UPDATE_MIN_DELTA = 0.01;

export type PlaybackFrame =
  | {
      type: "lexeme";
      lexemeId: string;
      durationMs: number;
    }
  | {
      type: "fingerspell";
      letter: string;
      text: string;
      position: number;
      total: number;
      durationMs: number;
    }
  | {
      type: "number";
      digit: string;
      value: string;
      position: number;
      total: number;
      durationMs: number;
    }
  | {
      type: "pointing";
      target: PointingTarget;
      durationMs: number;
    }
  | {
      type: "pause";
      durationMs: number;
    };

export type PlaybackState = {
  isPlaying: boolean;
  currentIndex: number;
  progress: number;
  currentFrame: PlaybackFrame | null;
  speed: number;
};

function splitFingerspellFrames(text: string, durationMs: number): PlaybackFrame[] {
  const letters = text
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .split("");
  const total = Math.max(letters.length, 1);
  const stepDuration = Math.max(180, Math.round(durationMs / total));

  if (letters.length === 0) {
    return [
      {
        type: "fingerspell",
        letter: "?",
        text: text.toUpperCase(),
        position: 1,
        total: 1,
        durationMs: Math.max(durationMs, 180),
      },
    ];
  }

  return letters.map((letter, index) => ({
    type: "fingerspell",
    letter,
    text: text.toUpperCase(),
    position: index + 1,
    total: letters.length,
    durationMs: stepDuration,
  }));
}

function splitNumberFrames(value: string, durationMs: number): PlaybackFrame[] {
  const digits = value.split("").filter(Boolean);
  const total = Math.max(digits.length, 1);
  const stepDuration = Math.max(180, Math.round(durationMs / total));

  if (digits.length === 0) {
    return [
      {
        type: "number",
        digit: "0",
        value,
        position: 1,
        total: 1,
        durationMs: Math.max(durationMs, 180),
      },
    ];
  }

  return digits.map((digit, index) => ({
    type: "number",
    digit,
    value,
    position: index + 1,
    total: digits.length,
    durationMs: stepDuration,
  }));
}

function buildPlaybackFrames(plan: SignPlan | null): PlaybackFrame[] {
  const tokens = plan?.clauses.flatMap((clause) => clause.tokens) ?? [];

  return tokens.flatMap((token) => {
    switch (token.type) {
      case "lexeme":
        return [
          {
            type: "lexeme",
            lexemeId: token.lexemeId,
            durationMs: token.durationMs,
          },
        ];
      case "fingerspell":
        return splitFingerspellFrames(token.text, token.durationMs);
      case "number":
        return splitNumberFrames(token.value, token.durationMs);
      case "pointing":
        return [
          {
            type: "pointing",
            target: token.target,
            durationMs: token.durationMs,
          },
        ];
      case "pause":
        return [
          {
            type: "pause",
            durationMs: token.durationMs,
          },
        ];
      default:
        return [];
    }
  });
}

export function useSignPlayback(plan: SignPlan | null) {
  const steps = useMemo(() => buildPlaybackFrames(plan), [plan]);
  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    currentIndex: steps.length > 0 ? 0 : -1,
    progress: 0,
    currentFrame: steps[0] ?? null,
    speed: 1,
  });

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const lastUiUpdateRef = useRef<number>(0);

  const play = useCallback(() => {
    if (steps.length === 0) return;

    setState((current) => {
      if (current.isPlaying) return current;

      const nextIndex =
        current.currentIndex === -1 || current.currentIndex >= steps.length
          ? 0
          : current.currentIndex;
      const now = performance.now();

      if (pauseTimeRef.current > 0) {
        startTimeRef.current += now - pauseTimeRef.current;
      } else {
        startTimeRef.current = now;
      }

      pauseTimeRef.current = 0;

      return {
        ...current,
        isPlaying: true,
        currentIndex: nextIndex,
        currentFrame: steps[nextIndex] ?? null,
      };
    });
  }, [steps]);

  const pause = useCallback(() => {
    setState((current) => {
      if (!current.isPlaying) return current;
      pauseTimeRef.current = performance.now();
      return { ...current, isPlaying: false };
    });

    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const restart = useCallback(() => {
    pauseTimeRef.current = 0;
    startTimeRef.current = performance.now();
    lastUiUpdateRef.current = 0;
    setState((current) => ({
      ...current,
      isPlaying: steps.length > 0,
      currentIndex: steps.length > 0 ? 0 : -1,
      progress: 0,
      currentFrame: steps[0] ?? null,
    }));
  }, [steps]);

  const setSpeed = useCallback((speed: number) => {
    setState((current) => {
      if (current.isPlaying && current.speed !== speed) {
        const now = performance.now();
        const elapsed = now - startTimeRef.current;
        startTimeRef.current = now - (elapsed * current.speed) / speed;
      }

      return { ...current, speed };
    });
  }, []);

  useEffect(() => {
    if (!state.isPlaying || steps.length === 0) return;

    const tick = (now: number) => {
      setState((current) => {
        let nextIndex = current.currentIndex;
        if (nextIndex < 0) {
          nextIndex = 0;
        }

        let frame = steps[nextIndex];
        if (!frame) {
          return {
            ...current,
            isPlaying: false,
            progress: 1,
            currentIndex: steps.length,
            currentFrame: steps.at(-1) ?? null,
          };
        }

        let elapsed = now - startTimeRef.current;
        let duration = frame.durationMs / current.speed;

        while (elapsed >= duration) {
          elapsed -= duration;
          nextIndex += 1;

          if (nextIndex >= steps.length) {
            return {
              ...current,
              isPlaying: false,
              progress: 1,
              currentIndex: steps.length,
              currentFrame: steps.at(-1) ?? null,
            };
          }

          frame = steps[nextIndex]!;
          duration = frame.durationMs / current.speed;
          startTimeRef.current = now - elapsed;
        }

        const nextProgress = (nextIndex + Math.min(elapsed / duration, 1)) / steps.length;
        const shouldUpdateFrame = nextIndex !== current.currentIndex;
        const shouldUpdateProgress =
          now - lastUiUpdateRef.current >= PROGRESS_UPDATE_INTERVAL_MS ||
          Math.abs(nextProgress - current.progress) >= PROGRESS_UPDATE_MIN_DELTA;

        if (!shouldUpdateFrame && !shouldUpdateProgress) {
          return current;
        }

        lastUiUpdateRef.current = now;
        return {
          ...current,
          currentIndex: nextIndex,
          currentFrame: frame,
          progress: nextProgress,
        };
      });

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [state.isPlaying, steps]);

  useEffect(() => {
    setState({
      isPlaying: false,
      currentIndex: steps.length > 0 ? 0 : -1,
      progress: 0,
      currentFrame: steps[0] ?? null,
      speed: 1,
    });
    pauseTimeRef.current = 0;
    lastUiUpdateRef.current = 0;
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [steps]);

  return {
    ...state,
    steps,
    play,
    pause,
    restart,
    setSpeed,
  };
}
