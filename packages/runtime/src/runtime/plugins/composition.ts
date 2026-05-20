import type { IkiraroToken } from "@ikiraro/engine/types";
import type { IkiraroPlugin, PluginContext, IkiraroEvent } from "../types";
import { TimeWindowTokenFusionPolicy, type TokenFusionPolicy } from "../token-fusion-policy";

export interface CompositionState {
  tokens: IkiraroToken[];
  text: string;
  isDrafting: boolean;
}

/**
 * The CompositionPlugin implements the "Time-Indexed Merging village".
 * It fuses multiple independent input streams into a single synchronized timeline.
 */
export class CompositionPlugin implements IkiraroPlugin<CompositionState> {
  name = "composition";
  initialState: CompositionState = { tokens: [], text: "", isDrafting: false };

  private eventBuffer: IkiraroEvent<"input:token">[] = [];
  private readonly FLUSH_DEBOUNCE_MS = 400; // Delay before committing to the composition
  private timer: any = null;

  constructor(private fusionPolicy: TokenFusionPolicy = new TimeWindowTokenFusionPolicy()) {}

  setup(ctx: PluginContext<CompositionState>) {
    ctx.subscribe("input:token", (event) => this.queueInput(event, ctx));

    // Command to clear the composition
    ctx.subscribe("composition:cmd:clear", () => {
      ctx.emit({
        type: "composition:cleared",
        payload: undefined,
        timestamp: Date.now(),
        source: this.name,
      });
    });
  }

  reducer(state: CompositionState, event: IkiraroEvent): CompositionState {
    switch (event.type) {
      case "composition:update":
        const newTokens = [...state.tokens, ...(event.payload.newTokens ?? [])];
        return {
          ...state,
          tokens: newTokens,
          text: newTokens.map((t) => t.value).join(" "),
          isDrafting: true,
        };
      case "composition:cleared":
        return { ...this.initialState };
      default:
        return state;
    }
  }

  private queueInput(event: IkiraroEvent<"input:token">, ctx: PluginContext<CompositionState>) {
    this.eventBuffer.push(event);

    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.fuseAndFlush(ctx), this.FLUSH_DEBOUNCE_MS);
  }

  /**
   * Performs the fusion: sorts by time and deduplicates overlapping intents.
   */
  private fuseAndFlush(ctx: PluginContext<CompositionState>) {
    if (this.eventBuffer.length === 0) return;

    const result = this.fusionPolicy.fuse(this.eventBuffer);

    // 3. Emit the high-leverage composition update
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

  teardown() {
    if (this.timer) clearTimeout(this.timer);
    this.eventBuffer = [];
    this.timer = null;
  }
}
