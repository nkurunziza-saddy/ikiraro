import { Button } from "./ui/button";

export function PlaybackControls({
  isPlaying,
  togglePlayback,
  resetPlayback,
  stepBackward,
  stepForward,
  speed,
  setSpeed,
  canStepBackward,
  canStepForward,
}: {
  isPlaying: boolean;
  togglePlayback: () => void;
  resetPlayback: () => void;
  stepBackward: () => void;
  stepForward: () => void;
  speed: number;
  setSpeed: (s: number) => void;
  canStepBackward: boolean;
  canStepForward: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted p-2">
      <Button size="sm" onClick={togglePlayback} className="h-9 min-w-[5rem]">
        {isPlaying ? "Pause" : "Play"}
      </Button>
      <Button variant="ghost" size="sm" onClick={resetPlayback}>
        Reset
      </Button>

      {/* Step controls */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={stepBackward}
          disabled={isPlaying || !canStepBackward}
        >
          ‹
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={stepForward}
          disabled={isPlaying || !canStepForward}
        >
          ›
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-1.5 px-2">
        {[0.5, 1, 1.5, 2].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`text-[10px] font-bold transition-colors ${
              speed === s ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
