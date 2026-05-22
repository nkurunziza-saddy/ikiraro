import type {
  EmphasisLevel,
  FingerspellToken,
  LexemeToken,
  NumberToken,
  PauseToken,
  PointingToken,
} from "../types";
import { getGlossDurationMs } from "./gloss-registry";
export const DEFAULT_LEXEME_DURATION_MS = 500;
export const FINGERSPELL_PER_CHAR_MS = 120;
export const NUMBER_PER_DIGIT_MS = 110;
export const POINTING_DURATION_MS = 360;
export const DEFAULT_PAUSE_MS = 220;
export const INTER_WORD_PAUSE_MS = 100;
export const INTER_UNIT_PAUSE_MS = 300;
export function lexemeToken(
  lexemeId: string,
  emphasis: EmphasisLevel = "normal",
  durationMs?: number,
): LexemeToken {
  return {
    type: "lexeme",
    lexemeId,
    emphasis,
    durationMs: durationMs ?? getGlossDurationMs(lexemeId),
    coarticulationHint: "blend",
  };
}
export function fingerspellToken(
  text: string,
  emphasis: EmphasisLevel = "normal",
  durationMs?: number,
): FingerspellToken {
  return {
    type: "fingerspell",
    text,
    emphasis,
    durationMs: durationMs ?? Math.max(420, text.trim().length * FINGERSPELL_PER_CHAR_MS),
    coarticulationHint: "blend",
  };
}
export function numberToken(
  value: string,
  emphasis: EmphasisLevel = "normal",
  durationMs?: number,
): NumberToken {
  return {
    type: "number",
    value,
    emphasis,
    durationMs: durationMs ?? Math.max(420, value.length * NUMBER_PER_DIGIT_MS),
    coarticulationHint: "blend",
  };
}
export function pointingToken(
  target: string,
  emphasis: EmphasisLevel = "normal",
  durationMs: number = POINTING_DURATION_MS,
): PointingToken {
  return { type: "pointing", target, emphasis, durationMs, coarticulationHint: "snap" };
}
export function pauseToken(durationMs: number = DEFAULT_PAUSE_MS): PauseToken {
  return { type: "pause", durationMs };
}
