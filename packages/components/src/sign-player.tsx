import { useMemo, useState, useEffect } from "react";
import type { SignPlan } from "@sensa/engine/types";
import { TtsControls } from "./tts-controls";
import { SignDisplay } from "./sign-display";
import { PlaybackControls } from "./playback-controls";
import {
  buildFrameQueue,
  RendererDirector,
  type RendererState,
  type SignCanvas,
} from "@sensa/engine/planning";

export function SignPlayer({ plan }: { plan: SignPlan | null }) {
  const queue = useMemo(() => buildFrameQueue(plan), [plan]);

  // Current frame state managed by the director
  const [playbackState, setPlaybackState] = useState<RendererState | null>(null);
  const [speed, setSpeed] = useState(1);

  // The Canvas Adapter: maps Director calls to React state
  const canvas = useMemo<SignCanvas>(
    () => ({
      setHand: (_letter: string, _motion?: string) => {
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
      <div className="flex aspect-video items-center justify-center rounded-xl border bg-muted/20">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border bg-background text-2xl shadow-sm">
            ✋
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            No Active Sequence
          </p>
        </div>
      </div>
    );
  }

  const frame = queue[playbackState.frameIndex]!;
  const progress =
    queue.length > 1 ? playbackState.time / queue.reduce((acc, f) => acc + f.duration, 0) : 0;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-xl border bg-muted/5 group">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted/20">
          <div
            className="h-full bg-primary/60 transition-all duration-150 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="flex aspect-video items-center justify-center p-12">
          <SignDisplay frame={frame} />
        </div>

        <div className="absolute bottom-4 right-4 text-[9px] font-bold tabular-nums text-muted-foreground/40 uppercase tracking-widest">
          {playbackState.frameIndex + 1} of {queue.length}
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
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
