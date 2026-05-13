import { useMemo } from "react";

export function AslHandSvg({ letter, className = "" }: { letter: string; className?: string }) {
  const normalizedLetter = letter.toUpperCase();

  // A simplified approach for the stylized silhouette:
  // We use a beautiful geometric representation of a hand, and
  // animate the fingers based on the letter. Since we don't have 26
  // full paths, we'll use a dynamic component with glowing typography
  // and abstract finger positions.

  const seed = normalizedLetter.charCodeAt(0) - 65;
  const isVowel = ["A", "E", "I", "O", "U"].includes(normalizedLetter);

  // Abstract finger states (1 = extended, 0 = curled) based loosely on ASL
  const fingerStates = useMemo(() => {
    switch (normalizedLetter) {
      case "A":
        return [1, 0, 0, 0, 0];
      case "B":
        return [0, 1, 1, 1, 1];
      case "C":
        return [0.5, 0.5, 0.5, 0.5, 0.5];
      case "D":
        return [0, 1, 0, 0, 0];
      case "E":
        return [0, 0.2, 0.2, 0.2, 0.2];
      case "F":
        return [0, 0, 1, 1, 1];
      case "G":
        return [1, 1, 0, 0, 0];
      case "H":
        return [1, 1, 1, 0, 0];
      case "I":
        return [0, 0, 0, 0, 1];
      case "L":
        return [1, 1, 0, 0, 0];
      case "O":
        return [0.3, 0.3, 0.3, 0.3, 0.3];
      case "V":
        return [0, 1, 1, 0, 0];
      case "W":
        return [0, 1, 1, 1, 0];
      case "Y":
        return [1, 0, 0, 0, 1];
      default:
        // Procedural fallback for other letters
        return [
          (seed % 2) * 0.8,
          ((seed + 1) % 3) * 0.4,
          ((seed + 2) % 2) * 0.9,
          ((seed + 3) % 4) * 0.25,
          ((seed + 4) % 2) * 0.7,
        ];
    }
  }, [normalizedLetter, seed]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 120" className="absolute inset-0 h-full w-full text-white/12">
        <path
          d="M 30,60 C 30,90 40,110 50,110 C 60,110 70,90 70,60 C 70,40 30,40 30,60 Z"
          fill="currentColor"
        />
        {[
          { x: 20, y: 70, h: 30, a: -45, w: 12 },
          { x: 35, y: 40, h: 45, a: -10, w: 10 },
          { x: 50, y: 35, h: 50, a: 0, w: 10 },
          { x: 65, y: 40, h: 45, a: 10, w: 10 },
          { x: 80, y: 50, h: 35, a: 25, w: 8 },
        ].map((finger, i) => (
          <rect
            key={i}
            x={finger.x - finger.w / 2}
            y={finger.y - finger.h}
            width={finger.w}
            height={finger.h}
            rx={finger.w / 2}
            fill="currentColor"
            style={{
              transformOrigin: `${finger.x}px ${finger.y}px`,
              transform: `rotate(${finger.a}deg) scaleY(${0.3 + fingerStates[i] * 0.7})`,
              transition: "transform 0.18s ease-out",
            }}
          />
        ))}
      </svg>

      <span
        className={`relative z-10 font-sans font-bold tracking-tighter ${
          isVowel ? "text-white" : "text-stone-100"
        }`}
        style={{
          fontSize: "clamp(2rem, 4cqw, 4rem)",
        }}
      >
        {normalizedLetter}
      </span>
    </div>
  );
}
