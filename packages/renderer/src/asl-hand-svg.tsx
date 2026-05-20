import { useMemo } from "react";
import { CornerRightDown } from "lucide-react";

/**
 * Anatomically-informed ASL fingerspelling hand.
 *
 * Each letter is defined as a full SVG `<path>` silhouette instead of
 * articulated rectangles. The paths are designed to read as clear,
 * recognizable hand shapes at sizes from 40px to 300px.
 *
 * Design decisions:
 *   - Single-color silhouette (works in dark/light themes via currentColor)
 *   - Palm-forward orientation for most letters (viewer perspective)
 *   - Clean curves, no outlines — feels premium at any scale
 *   - Smooth CSS transitions when switching between letters
 */

// Each path is drawn in a 100×120 viewBox. Palm base sits around y=90-115,
// fingertips reach y=5-30. Thumb extends left.

const HAND_PATHS: Record<string, string> = {
  // A — Fist with thumb up alongside
  A: "M38,112 C32,112 26,108 26,98 L26,72 C26,65 30,58 36,56 L36,38 C36,30 42,26 46,26 C50,26 54,30 54,38 L54,56 C54,56 58,58 58,65 L58,68 C58,68 62,66 62,68 L62,98 C62,108 56,112 50,112 Z M30,56 C24,54 18,48 18,40 L18,34 C18,26 24,22 28,26 L30,30 Z",

  // B — Four fingers up, thumb across palm
  B: "M28,112 C24,112 20,108 20,100 L20,70 L22,18 C22,12 26,8 30,8 C34,8 36,12 36,18 L36,55 L40,14 C40,8 44,5 48,5 C52,5 55,8 55,14 L53,55 L56,16 C56,10 60,7 64,7 C68,7 71,10 71,16 L68,58 L70,22 C70,16 74,13 78,13 C82,13 84,16 84,22 L80,70 L80,100 C80,108 76,112 72,112 Z M20,70 L16,65 C10,60 8,52 12,48 L20,55 Z",

  // C — Curved hand, all fingers partially bent
  C: "M30,108 C24,106 20,100 22,92 L26,70 C28,58 34,42 40,32 C44,26 50,22 56,22 C62,22 68,26 72,34 C76,42 78,56 78,70 L80,92 C82,100 78,106 72,108 Z",

  // D — Index up, others curled with thumb
  D: "M34,112 C28,112 24,108 24,98 L24,72 L26,62 C26,58 30,56 34,56 L34,48 C34,48 38,46 38,48 L38,56 C42,56 46,58 46,62 L48,72 L48,98 C48,108 44,112 38,112 Z M32,56 L34,12 C34,6 38,4 42,4 C46,4 48,6 48,12 L46,56 Z M24,68 L18,62 C14,58 12,50 16,46 L24,56 Z",

  // E — All fingers curled down, tips visible
  E: "M26,112 C22,112 18,108 18,98 L18,68 C18,58 22,48 28,44 L30,42 C30,38 34,36 38,38 L40,42 C44,40 48,40 52,42 L54,38 C56,36 60,38 60,42 L62,44 C68,48 72,58 72,68 L72,98 C72,108 68,112 64,112 Z M18,64 L14,58 C10,52 10,44 16,42 L20,48 Z",

  // F — Index+thumb circle, three fingers up
  F: "M44,112 C38,112 34,108 34,100 L34,72 L36,56 C36,56 38,54 40,54 L40,52 C40,52 44,50 44,54 L44,56 L46,14 C46,8 50,5 54,5 C58,5 60,8 60,14 L58,56 L62,18 C62,12 66,9 70,9 C74,9 76,12 76,18 L72,58 L74,24 C74,18 78,15 82,15 C86,15 88,18 88,24 L84,70 L84,100 C84,108 80,112 76,112 Z M34,72 C30,68 26,62 26,56 C26,50 30,48 34,50 Z",

  // G — Index pointing right, thumb up, palm sideways
  G: "M18,100 C14,100 10,96 10,88 L10,68 L12,58 C14,52 18,48 24,48 L24,42 C24,36 28,34 32,38 L32,48 L34,48 C38,48 42,52 44,58 L44,68 L44,88 C44,96 40,100 36,100 Z M24,48 L70,42 C78,42 84,46 84,52 C84,58 78,62 70,62 L24,58 Z M10,62 L6,56 C4,50 6,44 10,44 L12,48 Z",

  // H — Index+middle pointing right, palm sideways
  H: "M18,100 C14,100 10,96 10,88 L10,68 C10,58 14,52 20,48 L20,42 C20,36 24,34 28,38 L28,48 C32,48 36,52 38,58 L38,68 L38,88 C38,96 34,100 30,100 Z M20,48 L72,36 C80,34 86,38 86,44 C86,50 80,54 72,56 L70,56 L74,42 C74,42 80,40 80,46 L80,52 L72,54 L20,58 Z M20,42 L72,28 C80,26 86,30 86,36 C86,42 80,46 72,48 L20,54 Z",

  // I — Pinky up, rest curled
  I: "M30,112 C24,112 20,108 20,98 L20,72 C20,62 24,56 30,54 L30,52 C30,52 34,50 34,54 L34,56 C36,56 40,56 44,58 L44,62 C48,60 52,60 54,62 L54,72 L54,98 C54,108 50,112 46,112 Z M54,62 L58,16 C58,10 62,8 66,8 C70,8 72,10 72,16 L68,62 Z M20,66 L14,60 C10,54 10,46 16,44 L22,52 Z",

  // J — Like I but with motion curve indicator
  J: "M30,112 C24,112 20,108 20,98 L20,72 C20,62 24,56 30,54 L34,56 C36,56 40,56 44,58 L44,62 C48,60 52,60 54,62 L54,72 L54,98 C54,108 50,112 46,112 Z M54,62 L58,16 C58,10 62,8 66,8 C70,8 72,10 72,16 L68,62 Z M20,66 L14,60 C10,54 10,46 16,44 L22,52 Z M72,20 C76,22 80,28 82,36 C84,44 82,52 78,56",

  // K — Index+middle up spread, thumb between
  K: "M30,112 C24,112 20,108 20,98 L20,72 C20,62 24,56 30,54 L30,52 C30,52 34,50 34,54 L34,56 C40,56 46,58 48,64 L48,72 L48,98 C48,108 44,112 40,112 Z M26,54 L20,10 C20,4 24,2 28,2 C32,2 34,4 34,10 L36,40 Z M36,48 L46,8 C46,2 50,0 54,0 C58,0 60,2 60,8 L52,48 Z M20,60 L16,50 C14,44 18,40 22,42 L26,52 Z",

  // L — Thumb out, index up, L shape
  L: "M36,112 C30,112 26,108 26,98 L26,72 C26,62 30,56 36,54 L36,52 C36,52 40,50 40,54 L40,56 C44,56 48,58 50,62 L50,68 C54,66 58,66 60,68 L60,72 L60,98 C60,108 56,112 52,112 Z M32,54 L34,10 C34,4 38,2 42,2 C46,2 48,4 48,10 L46,54 Z M26,68 L4,56 C-2,52 -4,44 2,40 C6,38 12,40 16,46 L26,58 Z",

  // M — Thumb under three fingers, fist shape
  M: "M24,112 C18,112 14,108 14,98 L14,62 C14,52 20,44 28,42 L32,40 C32,36 36,34 40,36 L42,40 C46,38 50,38 54,40 L56,36 C58,34 62,36 62,40 L64,42 C72,44 78,52 78,62 L78,98 C78,108 74,112 68,112 Z M14,58 L8,50 C4,44 6,38 12,38 L16,44 Z",

  // N — Thumb under two fingers, fist shape
  N: "M26,112 C20,112 16,108 16,98 L16,62 C16,52 22,44 30,42 L34,40 C34,36 38,34 42,36 L44,40 C48,38 52,38 56,40 L58,42 C66,44 72,52 72,62 L72,98 C72,108 68,112 62,112 Z M16,58 L10,50 C6,44 8,38 14,38 L18,44 Z",

  // O — Fingertips meet thumb, round shape
  O: "M30,108 C22,104 18,96 20,86 L24,66 C26,52 34,38 44,32 C48,30 52,30 56,32 C66,38 74,52 76,66 L80,86 C82,96 78,104 70,108 Z",

  // P — Like K but palm down
  P: "M20,106 C16,106 12,102 12,94 L12,78 C12,68 16,62 22,60 L22,58 C22,54 26,52 28,56 L28,60 C34,60 40,62 42,68 L42,78 L42,94 C42,102 38,106 34,106 Z M18,60 L12,20 C12,14 16,10 20,10 C24,10 26,14 26,20 L28,46 Z M28,54 L38,14 C38,8 42,6 46,6 C50,6 52,8 52,14 L44,54 Z M12,72 L6,64 C2,58 4,52 10,52 L14,60 Z",

  // Q — Thumb+index down
  Q: "M24,20 C20,20 16,24 16,32 L16,52 C16,62 20,68 26,70 L26,72 C26,76 30,78 32,74 L32,70 C36,70 40,68 42,64 L42,58 L42,32 C42,24 38,20 34,20 Z M22,72 L20,100 C20,106 24,110 28,110 C32,110 34,106 34,100 L32,72 Z M16,56 L10,62 C6,66 4,74 8,78 L16,68 Z",

  // R — Index+middle crossed
  R: "M30,112 C24,112 20,108 20,98 L20,72 C20,62 24,56 30,54 L30,52 C30,48 34,46 36,50 L36,54 C40,54 44,56 46,60 L46,66 C50,64 54,64 56,66 L56,72 L56,98 C56,108 52,112 48,112 Z M28,54 L22,10 C22,4 26,2 30,2 C34,2 36,4 36,10 L38,30 L42,8 C42,2 46,0 50,0 C54,0 56,2 56,8 L46,48 Z M20,66 L14,58 C10,52 12,46 18,46 L22,54 Z",

  // S — Fist, thumb across fingers
  S: "M26,112 C20,112 16,108 16,98 L16,62 C16,52 22,44 30,42 C36,40 42,40 48,42 C56,44 64,52 64,62 L64,98 C64,108 60,112 54,112 Z M16,56 L10,48 C6,42 8,36 14,36 L18,44 Z M30,42 L24,38 C20,34 22,28 28,30 L34,36 Z",

  // T — Thumb between index+middle, fist
  T: "M28,112 C22,112 18,108 18,98 L18,62 C18,52 24,44 32,42 L36,40 C36,36 40,34 42,38 L42,42 C50,44 56,52 56,62 L56,98 C56,108 52,112 46,112 Z M18,58 L12,50 C8,44 10,38 16,38 L20,46 Z M32,40 L28,34 C26,28 30,24 34,28 L36,36 Z",

  // U — Index+middle up together
  U: "M30,112 C24,112 20,108 20,98 L20,72 C20,62 24,56 30,54 L30,52 C30,48 34,46 36,50 L36,54 C40,54 44,56 46,60 L46,66 C50,64 54,64 56,66 L56,72 L56,98 C56,108 52,112 48,112 Z M28,54 L26,10 C26,4 30,2 34,2 C38,2 40,4 40,10 L40,44 L42,10 C42,4 46,2 50,2 C54,2 56,4 56,10 L54,54 Z M20,66 L14,58 C10,52 12,46 18,46 L22,54 Z",

  // V — Index+middle up spread (peace sign)
  V: "M30,112 C24,112 20,108 20,98 L20,72 C20,62 24,56 30,54 L30,52 C30,48 34,46 36,50 L36,54 C40,54 44,56 46,60 L46,66 C50,64 54,64 56,66 L56,72 L56,98 C56,108 52,112 48,112 Z M24,54 L16,10 C14,4 18,0 22,0 C26,0 30,4 30,10 L34,40 L42,10 C44,4 48,0 52,0 C56,0 58,4 58,10 L50,54 Z M20,66 L14,58 C10,52 12,46 18,46 L22,54 Z",

  // W — Three fingers up spread
  W: "M26,112 C20,112 16,108 16,98 L16,72 C16,62 20,56 26,54 L26,52 C26,48 30,46 32,50 L32,54 C36,54 40,56 42,58 L42,64 C46,62 50,62 52,64 L52,72 L52,98 C52,108 48,112 44,112 Z M20,54 L12,10 C10,4 14,0 18,0 C22,0 24,4 26,10 L30,38 L34,8 C34,2 38,0 42,0 C46,0 48,2 48,8 L46,38 L52,10 C54,4 58,0 62,0 C66,0 68,4 66,10 L58,54 Z M16,66 L10,58 C6,52 8,46 14,46 L18,54 Z",

  // X — Index hooked, rest curled
  X: "M30,112 C24,112 20,108 20,98 L20,72 C20,62 24,56 30,54 L30,52 C30,48 34,46 36,50 L36,54 C40,54 44,56 46,60 L46,66 C50,64 54,64 56,66 L56,72 L56,98 C56,108 52,112 48,112 Z M30,54 L28,30 C28,24 32,20 36,20 C40,20 42,24 42,30 L40,42 C44,36 48,38 46,44 L38,54 Z M20,66 L14,58 C10,52 12,46 18,46 L22,54 Z",

  // Y — Thumb+pinky out, rest curled
  Y: "M34,112 C28,112 24,108 24,98 L24,72 C24,62 28,56 34,54 L34,52 C34,48 38,46 40,50 L40,54 C44,54 48,56 50,60 L50,72 L50,98 C50,108 46,112 42,112 Z M50,60 L56,16 C56,10 60,8 64,8 C68,8 70,10 70,16 L66,60 Z M24,68 L4,52 C-2,48 -4,40 2,36 C6,34 12,38 16,44 L24,56 Z",

  // Z — Index pointing, motion trace
  Z: "M30,112 C24,112 20,108 20,98 L20,72 C20,62 24,56 30,54 L30,52 C30,48 34,46 36,50 L36,54 C40,54 44,56 46,60 L46,66 C50,64 54,64 56,66 L56,72 L56,98 C56,108 52,112 48,112 Z M30,54 L32,10 C32,4 36,2 40,2 C44,2 46,4 46,10 L44,54 Z M20,66 L14,58 C10,52 12,46 18,46 L22,54 Z",
};

// Motion-required letters get a subtle indicator
const MOTION_LETTERS = new Set(["J", "Z"]);

export function AslHandSvg({
  letter,
  motion = "none",
  className = "",
  size = 120,
  showLabel = true,
  animate = true,
}: {
  letter: string;
  motion?: "none" | "shake" | "arc" | "tap" | "circle";
  className?: string;
  size?: number;
  showLabel?: boolean;
  animate?: boolean;
}) {
  const normalizedLetter = letter.toUpperCase().charAt(0);

  const path = useMemo(() => HAND_PATHS[normalizedLetter] || HAND_PATHS.A, [normalizedLetter]);

  const hasMotion = MOTION_LETTERS.has(normalizedLetter);

  return (
    <div
      className={`relative inline-flex items-center justify-center transition-transform duration-300 ${
        animate ? "hover:scale-105" : ""
      } ${motion !== "none" ? `motion-${motion}` : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 120"
        className="h-full w-full"
        role="img"
        aria-label={`ASL letter ${normalizedLetter}`}
      >
        {/* Main hand silhouette - solid theme color */}
        <path
          d={path}
          fill="currentColor"
          className="text-foreground transition-all duration-300 ease-out"
          style={{
            transition: animate ? "d 0.25s ease-in-out" : undefined,
          }}
        />

        {/* Motion indicator arc for J/Z */}
        {hasMotion && (
          <g>
            <path
              d={
                normalizedLetter === "J" ? "M68,20 C74,28 78,40 76,52" : "M52,8 L72,8 L56,24 L76,24"
              }
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4 4"
              className="text-primary"
              style={{
                animation: animate ? "motionPulse 2s ease-in-out infinite" : undefined,
              }}
            />
            {/* Arrow tip */}
            <circle
              cx={normalizedLetter === "J" ? 76 : 76}
              cy={normalizedLetter === "J" ? 52 : 24}
              r="3"
              fill="currentColor"
              className="text-primary"
            />
          </g>
        )}
      </svg>

      {/* Letter label */}
      {showLabel && (
        <div className="absolute -bottom-1 flex w-full justify-center">
          <span
            className="rounded-full bg-muted border border-border px-2 py-0.5 text-[9px] font-bold tracking-widest text-muted-foreground shadow-sm"
            style={{ fontSize: Math.max(8, size * 0.08) }}
          >
            {normalizedLetter}
            {hasMotion && (
              <CornerRightDown
                className="ml-0.5 text-primary inline-block align-middle"
                size={Math.max(8, size * 0.08)}
              />
            )}
          </span>
        </div>
      )}

      <style>{`
        @keyframes motionPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
