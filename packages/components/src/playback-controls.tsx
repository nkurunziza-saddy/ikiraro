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
    <div className="flex items-center gap-2 rounded-xl border bg-muted/30 p-2 shadow-sm">
      <Button size="sm" onClick={togglePlayback} className="h-9 min-w-[5.5rem] font-bold">
        {isPlaying ? "Pause" : "Play"}
      </Button>
      <Button variant="ghost" size="sm" onClick={resetPlayback} className="font-bold">
        Reset
      </Button>

      {/* Step controls */}
      <div className="flex gap-1 border-l ml-1 pl-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={stepBackward}
          disabled={isPlaying || !canStepBackward}
          className="text-lg"
        >
          ‹
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={stepForward}
          disabled={isPlaying || !canStepForward}
          className="text-lg"
        >
          ›
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-1.5 px-1">
        {[0.5, 1, 1.5, 2].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`h-7 px-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${
              speed === s
                ? "bg-primary text-primary-foreground shadow-sm scale-105"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
