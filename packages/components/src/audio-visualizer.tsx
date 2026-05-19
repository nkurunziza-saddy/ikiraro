import { useMemo, memo } from "react";

/**
 * High-leverage visualizer for sensory input levels.
 * Instead of raw streams, it takes a normalized level (0-1) from a CaptureAdapter.
 */
export const AudioVisualizer = memo(function AudioVisualizer({
  level,
  count = 24,
  className = "",
}: {
  level: number;
  count?: number;
  className?: string;
}) {
  const bars = useMemo(() => Array.from({ length: count }), [count]);

  return (
    <div className={`flex items-end gap-1.5 h-12 px-1 ${className}`}>
      {bars.map((_, i) => {
        // Add a bit of pseudo-randomness per bar for organic feel
        const randomFactor = 0.5 + (Math.sin(i * 0.5) * 0.2 + Math.cos(i * 0.3) * 0.3);
        const height = Math.max(12, level * 100 * randomFactor);

        return (
          <div
            key={i}
            className="flex-1 bg-primary rounded-t-full transition-all duration-100 ease-out"
            style={{
              height: `${height}%`,
              opacity: 0.15 + level * 0.85,
            }}
          />
        );
      })}
    </div>
  );
});
