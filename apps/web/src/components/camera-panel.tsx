import { Button } from "./ui/button";
import HandOverlay from "./hand-overlay";

export function CameraPanel({
  camera,
  commitCameraSentence,
}: {
  camera: any;
  commitCameraSentence: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void camera.start()} disabled={camera.isActive}>
          Start Camera
        </Button>
        <Button variant="outline" onClick={camera.stop} disabled={!camera.isActive}>
          Stop Camera
        </Button>
        <Button variant="ghost" onClick={camera.clear}>
          Reset Buffer
        </Button>
        <span className="text-xs text-stone-300">
          {camera.delegate ? `${camera.delegate} delegate` : "Vision booting"} · {camera.fps} fps
        </span>
      </div>

      <p className="text-xs leading-5 text-stone-400">
        Accuracy is best when one signing hand stays centered, fully visible, and clearly separated
        from the face.
      </p>

      <div className="relative aspect-video overflow-hidden rounded-[1.5rem] border border-stone-800 bg-black">
        <div className="absolute inset-0 scale-x-[-1]">
          <video
            ref={camera.videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
          <HandOverlay tracking={camera.tracking} />
        </div>

        {camera.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6 text-center text-sm text-rose-300">
            {camera.error}
          </div>
        )}
      </div>

      <div className="rounded-[1.4rem] border border-stone-800 bg-stone-900 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-stone-400">
          Camera sentence
        </p>
        <p className="mt-3 min-h-10 text-base text-white">
          {camera.tracking.sentenceText ||
            camera.tracking.currentWord ||
            "No committed fingerspelling yet."}
        </p>
        <div className="mt-2 flex items-center justify-between text-xs text-stone-300">
          <span>
            Current sign:{" "}
            <span className="font-bold text-white">
              {camera.tracking.classification?.sign ?? "none"}
            </span>
          </span>
          <span>
            Confidence:{" "}
            <span className="font-bold text-white">
              {Math.round((camera.tracking.classification?.confidence ?? 0) * 100)}%
            </span>
          </span>
        </div>
      </div>

      <Button onClick={commitCameraSentence} className="w-full">
        Commit Camera Sentence
      </Button>
    </div>
  );
}
