import type { IkiraroToken } from "@ikiraro/engine/types";
import { TimeWindowTokenFusionPolicy, type TokenFusionPolicy } from "../token-fusion-policy";
import type { IkiraroEvent, IkiraroPlugin, PluginContext } from "../types";
export interface CompositionState {
  tokens: IkiraroToken[];
  text: string;
  isDrafting: boolean;
}
/**
 * The CompositionPlugin fuses multiple independent input streams into a
 * single synchronized timeline via a debounced token fusion policy.
 */
export class CompositionPlugin implements IkiraroPlugin<CompositionState> {
  name = "composition";
  initialState: CompositionState = { tokens: [], text: "", isDrafting: false };
  private eventBuffer: IkiraroEvent<"input:token">[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  constructor(
    private readonly fusionPolicy: TokenFusionPolicy = new TimeWindowTokenFusionPolicy(),
    private readonly flushDebounceMs = 400,
  ) {}
  setup(ctx: PluginContext<CompositionState>) {
    ctx.subscribe("input:token", (event) => this.queueInput(event, ctx));
    ctx.subscribe("composition:cmd:clear", () => {
      ctx.emit({
        type: "composition:cleared",
        payload: undefined,
        timestamp: Date.now(),
        source: this.name,
      });
    });
    return () => {
      if (this.timer) clearTimeout(this.timer);
      this.eventBuffer = [];
      this.timer = null;
    };
  }
  reducer(state: CompositionState, event: IkiraroEvent): CompositionState {
    switch (event.type) {
      case "composition:update": {
        const newTokens = [...state.tokens, ...(event.payload.newTokens ?? [])];
        return {
          ...state,
          tokens: newTokens,
          text: newTokens.map((t) => t.value).join(" "),
          isDrafting: true,
        };
      }
      case "composition:cleared":
        return { ...this.initialState };
      default:
        return state;
    }
  }
  private queueInput(event: IkiraroEvent<"input:token">, ctx: PluginContext<CompositionState>) {
    this.eventBuffer.push(event);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.fuseAndFlush(ctx), this.flushDebounceMs);
  }
  private fuseAndFlush(ctx: PluginContext<CompositionState>) {
    if (this.eventBuffer.length === 0) return;
    const result = this.fusionPolicy.fuse(this.eventBuffer);
    ctx.emit({
      type: "composition:update",
      payload: {
        newTokens: result.newTokens,
        allEvents: result.allEvents,
      },
      timestamp: Date.now(),
      source: this.name,
    });
    this.eventBuffer = [];
    this.timer = null;
  }
}
