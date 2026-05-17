import { useMemo, useState, useEffect } from "react";
import type { SignPlan } from "@sensa/engine/types";
import { RendererDirector, type RendererState, type SignCanvas } from "@sensa/communication";
import { TtsControls } from "./tts-controls";
import { buildFrameQueue } from "./frame-queue";
import { SignDisplay } from "./sign-display";
import { PlaybackControls } from "./playback-controls";

export function SignPlayer({ plan }: { plan: SignPlan | null }) {
  const queue = useMemo(() => buildFrameQueue(plan), [plan]);

  // Current frame state managed by the director
  const [playbackState, setPlaybackState] = useState<RendererState | null>(null);
  const [speed, setSpeed] = useState(1);

  // The Canvas Adapter: maps Director calls to React state
  const canvas = useMemo<SignCanvas>(
    () => ({
      setHand: (_letter, _motion) => {
        // Find the frame in the queue to get full metadata, or just set raw values
        // For simplicity in this adapter, we just let the director drive the frame index
      },
      setOverlay: () => {},
      clear: () => {},
    }),
    [],
  );

  const director = useMemo(() => new RendererDirector(canvas), [canvas]);

  useEffect(() => {
    director.setQueue(queue);
    return director.subscribe(setPlaybackState);
  }, [director, queue]);

  useEffect(() => {
    director.setOptions({ speed });
  }, [director, speed]);

  if (!plan || queue.length === 0 || !playbackState) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full border border-border bg-muted">
            <span className="text-2xl text-muted-foreground">✋</span>
          </div>
          <p className="text-sm text-muted-foreground">No active sign sequence</p>
        </div>
      </div>
    );
  }

  const frame = queue[playbackState.frameIndex]!;
  const progress =
    queue.length > 1 ? playbackState.time / queue.reduce((acc, f) => acc + f.duration, 0) : 0;

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-150 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="flex aspect-video items-center justify-center p-8">
          <SignDisplay frame={frame} />
        </div>

        <div className="absolute bottom-3 right-4 font-mono text-[10px] font-bold tabular-nums text-muted-foreground">
          {playbackState.frameIndex + 1} / {queue.length}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PlaybackControls
          isPlaying={playbackState.isPlaying}
          togglePlayback={() => (playbackState.isPlaying ? director.pause() : director.play())}
          resetPlayback={() => director.reset()}
          stepBackward={() => director.seek(Math.max(0, playbackState.time - 500))}
          stepForward={() => director.seek(playbackState.time + 500)}
          speed={speed}
          setSpeed={setSpeed}
          canStepBackward={playbackState.time > 0}
          canStepForward={playbackState.frameIndex < queue.length - 1}
        />
        <TtsControls text={plan.normalizedText} />
      </div>
    </div>
  );
}
