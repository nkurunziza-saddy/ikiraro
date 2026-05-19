import type { SttModel } from "@ikiraro/engine/types";
import { AudioVisualizer, Button } from "@ikiraro/components";
import type { CaptureStatus } from "@ikiraro/communication";

const STT_OPTIONS: SttModel[] = ["whisper-large-v3", "whisper-large-v3-turbo"];

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
    <div className="flex flex-col gap-8">
      {/* Model + controls row */}
      <div className="border-rule-soft flex items-center justify-between pb-4 border-b">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-stone text-[10px] tracking-[0.3px]">Model</span>
          <select
            value={sttModel}
            onChange={(e) => setSttModel(e.target.value as SttModel)}
            className="text-ink bg-transparent text-[13px] font-medium outline-none tracking-[-0.2px]"
          >
            {STT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
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
              className="border-rule text-ink rounded-[2px] h-auto bg-transparent px-5 py-2 text-[13px] font-medium"
            >
              Record
            </Button>
          ) : (
            <>
              <Button
                onClick={onStop}
                disabled={isWorking}
                className="bg-primary text-on-primary rounded-[2px] h-auto px-5 py-2 text-[13px] font-medium"
              >
                Commit
              </Button>
              <Button
                onClick={onCancel}
                variant="ghost"
                className="text-steel h-auto px-4 py-2 text-[12px] hover:bg-transparent hover:text-ink"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Capture visualizer */}
      {isCapturing && (
        <div className="flex flex-col gap-4 py-4">
          <AudioVisualizer level={captureLevel} count={32} />
          <p className="text-primary font-mono text-center text-[11px] tracking-[0.5px]">
            Listening…
          </p>
        </div>
      )}

      {/* Vocabulary hints */}
      <div className="flex flex-col gap-3">
        <span className="font-mono text-stone text-[10px] tracking-[0.3px]">Vocabulary hints</span>
        <textarea
          value={speechPrompt}
          onChange={(e) => setSpeechPrompt(e.target.value)}
          placeholder="Add specific names or terms…"
          className="text-ink border-rule-soft w-full min-h-[80px] resize-none border-b pb-4 text-[14px] leading-relaxed outline-none bg-transparent"
        />
      </div>
    </div>
  );
}
