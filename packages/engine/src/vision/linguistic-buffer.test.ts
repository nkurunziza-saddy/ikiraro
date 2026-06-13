import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SignToken } from "../types";
import { LinguisticBuffer } from "./linguistic-buffer";
import type { ILinguisticStrategy, WordBufferContext } from "./types";

const makeStrategy = (): ILinguisticStrategy & { pending: string | null } => {
  const strategy = {
    name: "fake-strategy",
    pending: null as string | null,
    update: vi.fn((sign: string, ctx: WordBufferContext): SignToken | null => {
      if (ctx.isPlateauReached) {
        return { type: "fingerspell", text: sign, durationMs: 100, emphasis: "normal" };
      }
      strategy.pending = sign;
      return null;
    }),
    commit: vi.fn((): SignToken | null => {
      if (strategy.pending) {
        const token: SignToken = {
          type: "fingerspell",
          text: strategy.pending,
          durationMs: 100,
          emphasis: "normal",
        };
        strategy.pending = null;
        return token;
      }
      return null;
    }),
    getInProgress: vi.fn(() => strategy.pending ?? ""),
    overrideLast: vi.fn(),
    reset: vi.fn(() => {
      strategy.pending = null;
    }),
  };
  return strategy;
};

describe("LinguisticBuffer", () => {
  let time = 0;

  beforeEach(() => {
    time = 10000;
    vi.spyOn(performance, "now").mockImplementation(() => time);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("ignores input when isTransitioning is true", () => {
    const strategy = makeStrategy();
    const buffer = new LinguisticBuffer({ strategies: [strategy] });

    const result = buffer.update("A", { isTransitioning: true });

    expect(result).toBeNull();
    expect(strategy.update).not.toHaveBeenCalled();
  });

  it("commits on plateau (stationary and held for >150ms)", () => {
    const strategy = makeStrategy();
    const buffer = new LinguisticBuffer({ strategies: [strategy] });

    // Frame 1
    buffer.update("B", { velocity: { x: 0, y: 0, z: 0 } });
    expect(strategy.update).toHaveBeenCalledWith(
      "B",
      expect.objectContaining({ isPlateauReached: false }),
    );

    // Frame 2: 151ms later, still B and stationary
    time += 151;
    const result = buffer.update("B", { velocity: { x: 0, y: 0, z: 0 } });

    expect(strategy.update).toHaveBeenCalledWith(
      "B",
      expect.objectContaining({ isPlateauReached: true }),
    );
    expect(result).toEqual({ type: "fingerspell", text: "B", durationMs: 100, emphasis: "normal" });
  });

  it("does not reach plateau while moving (velocity > 0.05)", () => {
    const strategy = makeStrategy();
    const buffer = new LinguisticBuffer({ strategies: [strategy] });

    buffer.update("C", { velocity: { x: 0.1, y: 0, z: 0 } });

    time += 200;
    const result = buffer.update("C", { velocity: { x: 0.1, y: 0, z: 0 } });

    expect(strategy.update).toHaveBeenCalledWith(
      "C",
      expect.objectContaining({ isPlateauReached: false }),
    );
    expect(result).toBeNull();
  });

  it("timeout commits after pauseThresholdMs of silence", () => {
    const strategy = makeStrategy();
    const buffer = new LinguisticBuffer({ strategies: [strategy], pauseThresholdMs: 1000 });

    buffer.update("D", { velocity: { x: 0, y: 0, z: 0 } });

    time += 500;
    let result = buffer.update(null); // Less than threshold
    expect(result).toBeNull();
    expect(strategy.commit).not.toHaveBeenCalled();

    time += 600; // 1100ms total
    result = buffer.update(null);
    expect(strategy.commit).toHaveBeenCalled();
    expect(result).toEqual({ type: "fingerspell", text: "D", durationMs: 100, emphasis: "normal" });
  });

  it("getState reflects committed tokens and in-progress word", () => {
    const strategy = makeStrategy();
    const buffer = new LinguisticBuffer({ strategies: [strategy] });

    buffer.update("H", { velocity: { x: 0, y: 0, z: 0 } });
    time += 151;
    buffer.update("H", { velocity: { x: 0, y: 0, z: 0 } }); // Commits 'H'

    buffer.update("E", { velocity: { x: 0, y: 0, z: 0 } }); // Pending 'E'

    const state = buffer.getState();
    expect(state.currentWord).toBe("E");
    expect(state.sentence).toEqual(["H"]);
    expect(state.sentenceText).toBe("H");
  });

  it("clear resets tokens and strategies", () => {
    const strategy = makeStrategy();
    const buffer = new LinguisticBuffer({ strategies: [strategy] });

    buffer.update("F", { velocity: { x: 0, y: 0, z: 0 } });
    time += 151;
    buffer.update("F", { velocity: { x: 0, y: 0, z: 0 } }); // Commits

    buffer.clear();

    expect(strategy.reset).toHaveBeenCalled();
    const state = buffer.getState();
    expect(state.sentence).toEqual([]);
    expect(state.sentenceText).toBe("");
  });
});
