import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HandLandmarks, SignToken } from "../types";
import { SignDetectionPipeline } from "./pipeline";
import type {
  ClassificationResult,
  ILinguisticStrategy,
  SignRecognizer,
  WordBufferContext,
} from "./types";

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

class FakeRecognizer implements SignRecognizer {
  mockResult: ClassificationResult = {
    sign: null,
    confidence: 0,
    velocity: { x: 0, y: 0, z: 0 },
    isMoving: false,
    candidates: [],
  };

  process(_world: HandLandmarks, _image?: HandLandmarks): ClassificationResult {
    return this.mockResult;
  }

  reset = vi.fn();
}

describe("SignDetectionPipeline", () => {
  let time = 0;

  beforeEach(() => {
    time = 10000;
    vi.spyOn(performance, "now").mockImplementation(() => time);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("processes stable sign into committed token", () => {
    const strategy = makeStrategy();
    const recognizer = new FakeRecognizer();
    const pipeline = new SignDetectionPipeline(recognizer, { strategies: [strategy] });

    recognizer.mockResult = {
      sign: "X",
      confidence: 0.9,
      velocity: { x: 0, y: 0, z: 0 },
      isMoving: false,
      candidates: [{ name: "X", score: 0.9 }],
    };

    const landmarks: HandLandmarks = [];

    // Frame 1
    let result = pipeline.process(landmarks);
    expect(result).toBeNull();
    expect(pipeline.lastClassification).toEqual(recognizer.mockResult);

    // Frame 2 (after plateau stability MS)
    time += 200;
    result = pipeline.process(landmarks);

    expect(result).toEqual({ type: "fingerspell", text: "X", durationMs: 100, emphasis: "normal" });
    expect(pipeline.lastClassification).toEqual(recognizer.mockResult);
  });

  it("tick() triggers timeout commits with no hand", () => {
    const strategy = makeStrategy();
    const recognizer = new FakeRecognizer();
    const pipeline = new SignDetectionPipeline(recognizer, {
      strategies: [strategy],
      pauseThresholdMs: 1000,
    });

    recognizer.mockResult = {
      sign: "Y",
      confidence: 0.9,
      velocity: { x: 0, y: 0, z: 0 },
      isMoving: false,
      candidates: [],
    };

    pipeline.process([]); // Pending 'Y'

    time += 1500;
    const result = pipeline.tick(); // Triggers timeout commit

    expect(result).toEqual({ type: "fingerspell", text: "Y", durationMs: 100, emphasis: "normal" });
    expect(pipeline.lastClassification).toBeNull();
  });

  it("reset() clears recognizer and buffer state", () => {
    const strategy = makeStrategy();
    const recognizer = new FakeRecognizer();
    const pipeline = new SignDetectionPipeline(recognizer, { strategies: [strategy] });

    recognizer.mockResult = {
      sign: "Z",
      confidence: 0.9,
      velocity: { x: 0, y: 0, z: 0 },
      isMoving: false,
      candidates: [],
    };

    pipeline.process([]); // Pending 'Z'
    expect(pipeline.lastClassification).not.toBeNull();
    expect(pipeline.getBufferState().currentWord).toBe("Z");

    pipeline.reset();

    expect(recognizer.reset).toHaveBeenCalled();
    expect(pipeline.lastClassification).toBeNull();
    expect(pipeline.getBufferState().currentWord).toBe("");
  });
});
