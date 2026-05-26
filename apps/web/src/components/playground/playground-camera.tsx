import { ArrowRight } from "lucide-react";
import { HandOverlay } from "@ikiraro/renderer";
import { usePlaygroundStore } from "../../store/playground";

interface PlaygroundCameraProps {
  camera: any;
  commitText: (text: string) => void;
}

export function PlaygroundCamera({ camera, commitText }: PlaygroundCameraProps) {
  const { visionEnabled } = usePlaygroundStore();

  if (!visionEnabled) return null;

  return (
    <div className="absolute top-6 left-6 z-10 w-64 rounded-xl border border-border bg-card overflow-hidden shadow-2xl">
      <div className="aspect-video relative">
        <video
          ref={camera.videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-70"
        />
        <HandOverlay tracking={camera.tracking} />
      </div>
      {(camera.tracking.sentenceText || camera.tracking.currentWord) && (
        <div className="p-3 bg-secondary border-t border-border flex justify-between items-center text-secondary-foreground">
          <span className="text-sm font-semibold uppercase tracking-wide truncate pr-2">
            {camera.tracking.sentenceText || camera.tracking.currentWord}
          </span>
          <button
            onClick={() => {
              const text = camera.tracking.sentenceText || camera.tracking.currentWord;
              if (text) {
                commitText(text);
                camera.clear();
              }
            }}
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1 flex-shrink-0"
          >
            Sign <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
