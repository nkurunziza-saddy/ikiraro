import type { SttModel } from "@ikiraro/engine/types";
import { AudioVisualizer } from "@ikiraro/components";
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
      <div
        className="flex items-center justify-between pb-4"
        style={{ borderBottom: "1px solid var(--rule-soft)" }}
      >
        <div className="flex flex-col gap-1">
          <span
            className="text-[10px]"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--stone)",
              letterSpacing: "0.3px",
            }}
          >
            Model
          </span>
          <select
            value={sttModel}
            onChange={(e) => setSttModel(e.target.value as SttModel)}
            className="text-[13px] font-medium outline-none"
            style={{
              background: "transparent",
              color: "var(--ink)",
              letterSpacing: "-0.2px",
            }}
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
            <button
              onClick={onStart}
              disabled={isWorking}
              className="px-5 py-2 text-[13px] font-medium transition-all disabled:opacity-40"
              style={{
                background: "transparent",
                color: "var(--ink)",
                borderRadius: "2px",
                border: "1px solid var(--rule)",
              }}
            >
              Record
            </button>
          ) : (
            <>
              <button
                onClick={onStop}
                disabled={isWorking}
                className="px-5 py-2 text-[13px] font-medium transition-all disabled:opacity-40"
                style={{
                  background: "var(--primary)",
                  color: "var(--on-primary)",
                  borderRadius: "2px",
                }}
              >
                Commit
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 text-[12px] transition-colors"
                style={{ color: "var(--steel)" }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Capture visualizer */}
      {isCapturing && (
        <div className="flex flex-col gap-4 py-4">
          <AudioVisualizer level={captureLevel} count={32} />
          <p
            className="text-[11px] text-center"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--primary)",
              letterSpacing: "0.5px",
            }}
          >
            Listening…
          </p>
        </div>
      )}

      {/* Vocabulary hints */}
      <div className="flex flex-col gap-3">
        <span
          className="text-[10px]"
          style={{ fontFamily: "var(--font-mono)", color: "var(--stone)", letterSpacing: "0.3px" }}
        >
          Vocabulary hints
        </span>
        <textarea
          value={speechPrompt}
          onChange={(e) => setSpeechPrompt(e.target.value)}
          placeholder="Add specific names or terms…"
          className="w-full text-[14px] leading-relaxed outline-none resize-none pb-4"
          style={{
            background: "transparent",
            color: "var(--ink)",
            borderBottom: "1px solid var(--rule-soft)",
            minHeight: "80px",
          }}
        />
      </div>
    </div>
  );
}
