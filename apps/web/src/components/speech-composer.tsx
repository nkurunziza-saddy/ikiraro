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
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          STT Model
        </span>
        <select
          value={sttModel}
          onChange={(event) => setSttModel(event.target.value as SttModel)}
          className="rounded-xl border bg-muted px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
        >
          {STT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border bg-muted p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {!isCapturing ? (
              <Button onClick={onStart} disabled={isWorking} size="lg" className="min-w-40">
                Start Recording
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={onStop}
                disabled={isWorking}
                size="lg"
                className="min-w-40"
              >
                Stop & Commit
              </Button>
            )}
            {isCapturing && (
              <Button variant="ghost" onClick={onCancel} size="lg">
                Cancel
              </Button>
            )}
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            {isCapturing ? "Listening..." : "Accuracy-first intake using Whisper."}
          </div>
        </div>

        {isCapturing && (
          <div className="mt-6">
            <AudioVisualizer level={captureLevel} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          STT Spelling Hints
        </span>
        <textarea
          value={speechPrompt}
          onChange={(event) => setSpeechPrompt(event.target.value)}
          placeholder="Add proper nouns, medication names, or unusual spellings to help the STT engine."
          className="min-h-28 rounded-2xl border bg-muted px-4 py-4 text-sm leading-relaxed outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
      </div>
    </div>
  );
}
