import type { SensaToken } from "@sensa/engine/types";
import type { SensaPlugin, PluginContext, SensaEvent } from "../types";

export interface CompositionState {
  tokens: SensaToken[];
  text: string;
  isDrafting: boolean;
}

/**
 * The CompositionPlugin implements the "Time-Indexed Merging village".
 * It fuses multiple independent input streams into a single synchronized timeline.
 */
export class CompositionPlugin implements SensaPlugin<CompositionState> {
  name = "composition";
  initialState: CompositionState = { tokens: [], text: "", isDrafting: false };

  private eventBuffer: SensaEvent<"input:token">[] = [];
  private readonly FUSION_WINDOW_MS = 150; // Window for deduplicating identical intents
  private readonly FLUSH_DEBOUNCE_MS = 400; // Delay before committing to the composition
  private timer: any = null;

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

  reducer(state: CompositionState, event: SensaEvent): CompositionState {
    switch (event.type) {
      case "composition:update":
        const newTokens = [...state.tokens, ...event.payload.newTokens];
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

  private queueInput(event: SensaEvent<"input:token">, ctx: PluginContext<CompositionState>) {
    this.eventBuffer.push(event);

    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.fuseAndFlush(ctx), this.FLUSH_DEBOUNCE_MS);
  }

  /**
   * Performs the fusion: sorts by time and deduplicates overlapping intents.
   */
  private fuseAndFlush(ctx: PluginContext<CompositionState>) {
    if (this.eventBuffer.length === 0) return;

    // 1. Sort chronologically
    this.eventBuffer.sort((a, b) => a.timestamp - b.timestamp);

    const fusedTokens: SensaToken[] = [];
    const processedEvents: SensaEvent<"input:token">[] = [];

    // 2. Fusion Logic: Deduplicate identical units within the window
    for (let i = 0; i < this.eventBuffer.length; i++) {
      const currentEvent = this.eventBuffer[i]!;
      const currentToken = currentEvent.payload;

      // Check if we already have this unit within the fusion window
      const isDuplicate =
        fusedTokens.length > 0 &&
        fusedTokens[fusedTokens.length - 1]!.value === currentToken.value &&
        currentToken.timestamp - fusedTokens[fusedTokens.length - 1]!.timestamp <
          this.FUSION_WINDOW_MS;

      if (!isDuplicate) {
        fusedTokens.push(currentToken);
      }
      processedEvents.push(currentEvent);
    }

    // 3. Emit the high-leverage composition update
    ctx.emit({
      type: "composition:update",
      payload: {
        newTokens: fusedTokens,
        allEvents: processedEvents,
      },
      timestamp: Date.now(),
      source: this.name,
    });

    this.eventBuffer = [];
    this.timer = null;
  }
}
