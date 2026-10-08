import { cast, follow, grid, paint } from "./pixels.ts";
import { figure } from "./signing/body.ts";
import { characters, poseAt, spell } from "./signing/spell.ts";

/**
 * The figure in a terminal. Each character cell is two pixels, one above the
 * other, drawn as a half block with its own foreground and background colour.
 */

const ESC = "\x1b[";
export const SHOW = { start: `${ESC}?25l${ESC}2J`, end: `${ESC}0m${ESC}?25h\n` };

/** RGBA pixels as rows of half blocks. `height` must be even. */
export function blocks(pixels: Uint8ClampedArray, width: number, height: number): string {
  const colour = (i: number) => `${pixels[i]};${pixels[i + 1]};${pixels[i + 2]}`;
  let out = "";
  for (let y = 0; y < height; y += 2) {
    let last = "";
    for (let x = 0; x < width; x++) {
      const top = (y * width + x) * 4;
      const bottom = top + width * 4;
      const [upper, lower] = [pixels[top + 3]! > 0, pixels[bottom + 3]! > 0];
      // Where there is no figure the terminal's own background shows through.
      const style =
        !upper && !lower
          ? `${ESC}0m`
          : upper && lower
            ? `${ESC}38;2;${colour(top)};48;2;${colour(bottom)}m`
            : `${ESC}0;38;2;${colour(upper ? top : bottom)}m`;
      if (style !== last) out += style;
      last = style;
      out += upper ? "▀" : lower ? "▄" : " ";
    }
    out += `${ESC}0m${ESC}K\n`;
  }
  return out;
}

/** The text, centred, with the letter on the hand picked out. */
function caption(text: string, now: number, span: number, columns: number): string {
  const letters = characters(text.toUpperCase());
  const pad = " ".repeat(Math.max(0, Math.floor((columns - letters.length * 2) / 2)));
  const line = letters
    .map((letter, i) =>
      i >= now && i < now + span ? `${ESC}0;1;38;2;240;228;208m${letter}` : `${ESC}0;2m${letter}`,
    )
    .join(" ");
  return `${pad}${line}${ESC}0m${ESC}K`;
}

/**
 * Every frame of `text` being fingerspelled, as strings ready to write to a
 * terminal of `columns` by `rows`. Each frame redraws from the top left.
 */
export function* frames(
  text: string,
  columns = 80,
  rows = 24,
  fps = 20,
  speed = 1,
): Generator<string> {
  const width = Math.max(20, Math.min(columns, 200));
  const height = Math.max(8, Math.min(rows - 3, 80)) * 2;
  const spelling = spell(text);
  const cells = grid(width, height);
  const pixels = new Uint8ClampedArray(width * height * 4);
  const count = Math.ceil((spelling.duration * fps) / speed);
  for (let i = 0; i <= count; i++) {
    const moment = poseAt(spelling, (i / fps) * speed);
    paint(cast(figure(moment, i / fps), follow(moment), cells), pixels);
    yield `${ESC}H${blocks(pixels, width, height)}\n${caption(text, moment.char, moment.span, width)}`;
  }
}
