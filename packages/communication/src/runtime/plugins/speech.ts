import type { SensaPlugin, PluginContext, SensaEvent } from "../types";
import { SpeechCaptureAdapter } from "../../capture/speech-capture";
import type { CaptureStatus } from "../../capture/types";

export interface SpeechState {
  status: CaptureStatus;
  level: number;
}

/**
 * Orchestrates speech capture and emits translation requests upon completion.
 */
export class SpeechPlugin implements SensaPlugin<SpeechState> {
  name = "speech";
  initialState: SpeechState = { status: "idle", level: 0 };
  private adapter = new SpeechCaptureAdapter();

  setup(ctx: PluginContext<SpeechState>) {
    this.adapter.onStatus((status) => {
      ctx.emit({
        type: "speech:status-change",
        payload: status,
        timestamp: Date.now(),
        source: this.name,
      });
    });

    this.adapter.onLevel((level) => {
      ctx.emit({
        type: "speech:level-update",
        payload: level,
        timestamp: Date.now(),
        source: this.name,
      });
    });

    ctx.subscribe("speech:cmd:start", async () => {
      try {
        await this.adapter.start();
      } catch (err) {
        ctx.emit({
          type: "translation:error",
          payload: err instanceof Error ? err.message : "Failed to start speech capture",
          timestamp: Date.now(),
          source: this.name,
        });
      }
    });

    ctx.subscribe("speech:cmd:stop", async (event) => {
      try {
        const audio = await this.adapter.stop();
        ctx.emit({
          type: "translation:cmd:request",
          payload: {
            mode: "speech",
            audio,
            sttModel: event.payload?.sttModel,
            context: event.payload?.context,
          },
          timestamp: Date.now(),
          source: this.name,
        });
      } catch (err) {
        ctx.emit({
          type: "translation:error",
          payload: err instanceof Error ? err.message : "Failed to stop speech capture",
          timestamp: Date.now(),
          source: this.name,
        });
      }
    });

    ctx.subscribe("speech:cmd:cancel", () => {
      this.adapter.reset();
    });
  }

  reducer(state: SpeechState, event: SensaEvent): SpeechState {
    switch (event.type) {
      case "speech:status-change":
        return { ...state, status: event.payload };
      case "speech:level-update":
        return { ...state, level: event.payload };
      default:
        return state;
    }
  }

  teardown() {
    this.adapter.reset();
  }
}
