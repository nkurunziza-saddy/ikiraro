import type { IkiraroToken } from "@ikiraro/engine/types";
import type { IkiraroEvent } from "./types";

export interface TokenFusionResult {
  newTokens: IkiraroToken[];
  allEvents: IkiraroEvent<"input:token">[];
}

export interface TokenFusionPolicy {
  fuse(events: readonly IkiraroEvent<"input:token">[]): TokenFusionResult;
}

export class TimeWindowTokenFusionPolicy implements TokenFusionPolicy {
  constructor(private readonly fusionWindowMs = 150) {}

  fuse(events: readonly IkiraroEvent<"input:token">[]): TokenFusionResult {
    const allEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
    const newTokens: IkiraroToken[] = [];

    for (const event of allEvents) {
      const token = event.payload;
      const previous = newTokens.at(-1);
      const isDuplicate =
        previous !== undefined &&
        previous.value === token.value &&
        previous.type === token.type &&
        token.timestamp - previous.timestamp < this.fusionWindowMs;

      if (!isDuplicate) {
        newTokens.push(token);
      }
    }

    return { newTokens, allEvents };
  }
}
