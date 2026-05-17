import type { SttModel } from "@sensa/engine/types";
import { AudioVisualizer, Button } from "@sensa/components";
import type { CaptureStatus } from "@sensa/communication";

const STT_OPTIONS: SttModel[] = ["whisper-large-v3", "whisper-large-v3-turbo"];

/**
 * SpeechComposer is a pure view component that displays speech capture status.
 * All logic for MediaRecorder and context is handled by the hook and bridge.
 */
export function SpeechComposer({
  sttModel,
  setSttModel,
  speechPrompt,
  setSpeechPrompt,
  isWorking,
  captureStatus,
  captureLevel,
  onStart,
  onStop,
  onCancel,
}: {
  sttModel: SttModel;
  setSttModel: (model: SttModel) => void;
  speechPrompt: string;
  setSpeechPrompt: (prompt: string) => void;
  isWorking: boolean;
  captureStatus: CaptureStatus;
  captureLevel: number;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
}) {
  const isCapturing = captureStatus === "capturing";

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between border-b border-border/30 pb-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
            Model
          </span>
          <select
            value={sttModel}
            onChange={(event) => setSttModel(event.target.value as SttModel)}
            className="bg-transparent text-sm font-bold uppercase tracking-widest outline-none focus:text-primary"
          >
            {STT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.split("-")[1] || option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          {!isCapturing ? (
            <Button
              onClick={onStart}
              disabled={isWorking}
              variant="outline"
              size="sm"
              className="px-6 font-bold uppercase tracking-widest"
            >
              Record
            </Button>
          ) : (
            <>
              <Button
                variant="destructive"
                onClick={onStop}
                disabled={isWorking}
                size="sm"
                className="px-6 font-bold uppercase tracking-widest"
              >
                Commit
              </Button>
              <Button
                variant="ghost"
                onClick={onCancel}
                size="sm"
                className="px-4 font-bold uppercase tracking-widest"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {isCapturing && (
        <div className="flex flex-col gap-4 py-4">
          <AudioVisualizer level={captureLevel} count={32} />
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-center text-primary/60 animate-pulse">
            Listening
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
            Vocabulary Hints
          </span>
        </div>
        <textarea
          value={speechPrompt}
          onChange={(event) => setSpeechPrompt(event.target.value)}
          placeholder="Add specific names or terms..."
          className="min-h-24 w-full bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/30 focus:border-primary border-b border-border/30 pb-4"
        />
      </div>
    </div>
  );
}
