"use client";
import * as React from "react";
import { useEffect, useImperativeHandle, useState, useRef } from "react";
export interface ScrambleTextHandle {
  start: () => void;
  reset: () => void;
}
export interface ScrambleTextProps {
  text: string;
  scrambledClassName?: string;
  scrambleSpeed?: number;
  className?: string;
}
const SCRAMBLE_CHARS = "01!@#$%&*?+-=<>[]X_█░▒▓";
export const ScrambleText = React.forwardRef<ScrambleTextHandle, ScrambleTextProps>(
  ({ text, scrambledClassName, scrambleSpeed = 30, className }, ref) => {
    const [displayText, setDisplayText] = useState<string>("");
    const [scrambledIndices, setScrambledIndices] = useState<Set<number>>(new Set());
    const frameRef = useRef<number | null>(null);
    const iterationRef = useRef<number>(0);
    const targetTextRef = useRef<string>(text);
    targetTextRef.current = text;
    const startScramble = React.useCallback(() => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      iterationRef.current = 0;
      const targetText = targetTextRef.current;
      const len = targetText.length;
      let lastTime = 0;
      const tick = (time: number) => {
        if (!lastTime) lastTime = time;
        const elapsed = time - lastTime;
        if (elapsed >= scrambleSpeed) {
          lastTime = time;
          iterationRef.current += 1;

          const revealedCount = Math.floor(iterationRef.current / 1.5);
          if (revealedCount >= len) {
            setDisplayText(targetText);
            setScrambledIndices(new Set());
            return;
          }

          let result = "";
          const newScrambled = new Set<number>();
          for (let i = 0; i < len; i++) {
            if (i < revealedCount) {
              result += targetText[i];
            } else {
              if (targetText[i] === " ") {
                result += " ";
              } else {
                const randomChar =
                  SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
                result += randomChar;
                newScrambled.add(i);
              }
            }
          }
          setDisplayText(result);
          setScrambledIndices(newScrambled);
        }
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    }, [scrambleSpeed]);
    useEffect(() => {
      startScramble();
      return () => {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }, [text, startScramble]);
    useImperativeHandle(ref, () => ({
      start: () => {
        startScramble();
      },
      reset: () => {
        setDisplayText("");
        setScrambledIndices(new Set());
      },
    }));
    return (
      <span className={className}>
        {displayText.split("").map((char, index) => {
          const isScrambled = scrambledIndices.has(index);
          return (
            <span key={index} className={isScrambled ? scrambledClassName : undefined}>
              {char}
            </span>
          );
        })}
      </span>
    );
  },
);
ScrambleText.displayName = "ScrambleText";
