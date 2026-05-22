import type { IkiraroPlugin, PluginContext, IkiraroEvent } from "../types";
import type {
  TranslationEnvelope,
  CommunicationMode,
  SttModel,
  TranslationContext,
} from "@ikiraro/engine/types";
export type SessionStatus = "idle" | "recording" | "translating" | "finished" | "error";
export interface SessionState {
  status: SessionStatus;
  mode?: CommunicationMode;
  lastEnvelope?: TranslationEnvelope;
  error?: string;
  sttModel: SttModel;
  translationContext?: TranslationContext;
  prompt?: string;
}
/**
 * The SessionPlugin orchestrates the high-level communication lifecycle.
 * It coordinates between Speech, Translation, and Composition plugins.
 */
export class SessionPlugin implements IkiraroPlugin<SessionState> {
  name = "session";
  initialState: SessionState = {
    status: "idle",
    sttModel: "whisper-large-v3",
  };
  setup(ctx: PluginContext<SessionState>) {
    ctx.subscribe("session:cmd:start", (event) => {
      const { mode, text, units, sttModel, prompt, context } = event.payload;
      this.handleStart(ctx, mode, { text, units, sttModel, prompt, context });
    });
    ctx.subscribe("session:cmd:stop", () => {
      this.handleStop(ctx);
    });
    ctx.subscribe("session:cmd:cancel", () => {
      this.handleCancel(ctx);
    });

    ctx.subscribe("translation:started", () => {
      ctx.emit({
        type: "session:status-change",
        payload: "translating",
        timestamp: Date.now(),
        source: this.name,
      });
    });
    ctx.subscribe("translation:finished", () => {
      ctx.emit({
        type: "session:status-change",
        payload: "finished",
        timestamp: Date.now(),
        source: this.name,
      });
    });
    ctx.subscribe("translation:error", () => {
      ctx.emit({
        type: "session:status-change",
        payload: "error",
        timestamp: Date.now(),
        source: this.name,
      });
    });
    ctx.subscribe("speech:status-change", (event) => {
      if (event.payload === "capturing") {
        ctx.emit({
          type: "session:status-change",
          payload: "recording",
          timestamp: Date.now(),
          source: this.name,
        });
      }
    });
  }
  reducer(state: SessionState, event: IkiraroEvent): SessionState {
    switch (event.type) {
      case "session:status-change":
        return { ...state, status: event.payload };
      case "session:cmd:start":
        return {
          ...state,
          mode: event.payload.mode,
          sttModel: event.payload.sttModel ?? state.sttModel,
          prompt: event.payload.prompt,
          translationContext: event.payload.context,
          error: undefined,
        };
      case "translation:finished":
        return { ...state, lastEnvelope: event.payload };
      case "translation:error":
        return { ...state, error: event.payload };
      case "session:cmd:cancel":
        return { ...state, status: "idle", error: undefined };
      default:
        return state;
    }
  }
  private handleStart(
    ctx: PluginContext<SessionState>,
    mode: CommunicationMode,
    options: {
      text?: string;
      units?: string[];
      sttModel?: SttModel;
      prompt?: string;
      context?: TranslationContext;
    },
  ) {
    if (mode === "speech") {
      ctx.emit({
        type: "speech:cmd:start",
        payload: undefined,
        timestamp: Date.now(),
        source: this.name,
      });
    } else if (mode === "text" && options.text) {
      ctx.emit({
        type: "translation:cmd:request",
        payload: { mode: "text", text: options.text, context: options.context },
        timestamp: Date.now(),
        source: this.name,
      });
    } else if (mode === "sign-keys" && options.units) {
      ctx.emit({
        type: "translation:cmd:request",
        payload: { mode: "sign-keys", units: options.units, context: options.context },
        timestamp: Date.now(),
        source: this.name,
      });
    }
  }
  private handleStop(ctx: PluginContext<SessionState>) {
    const state = ctx.getPluginState();
    if (state.status === "recording" && state.mode === "speech") {
      ctx.emit({
        type: "speech:cmd:stop",
        payload: {
          sttModel: state.sttModel,
          prompt: state.prompt,
          context: state.translationContext,
        },
        timestamp: Date.now(),
        source: this.name,
      });
    }
  }
  private handleCancel(ctx: PluginContext<SessionState>) {
    const state = ctx.getPluginState();
    if (state.status === "recording") {
      ctx.emit({
        type: "speech:cmd:cancel",
        payload: undefined,
        timestamp: Date.now(),
        source: this.name,
      });
    }
  }
}
