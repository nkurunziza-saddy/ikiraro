import { describe, it, expect } from "vitest";
import { SignAllRecognizer } from "./sign-all-recognizer";

const hand = (n = 21) => Array.from({ length: n }, (_, i) => ({ x: i * 0.01, y: i * 0.02, z: 0 }));

// Synthetic normalized datasets
// "FLAT": points on a line
const flatHand = Array.from({ length: 21 }, (_, i) => ({ x: 0, y: i * 0.1, z: 0 }));
// "FIST": all points clustered
const fistHand = Array.from({ length: 21 }, (_, i) => ({ x: i * 0.001, y: i * 0.001, z: 0 }));

describe("SignAllRecognizer", () => {
  it("returns no-match shape for empty array", () => {
    const recognizer = new SignAllRecognizer();
    const result = recognizer.process([]);
    expect(result).toEqual({
      sign: null,
      confidence: 0,
      velocity: { x: 0, y: 0, z: 0 },
      isMoving: false,
      candidates: [],
    });
  });

  it("returns no-match shape and does not throw for array length < 21", () => {
    const recognizer = new SignAllRecognizer();
    const result = recognizer.process(hand(5));
    expect(result.sign).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it("returns finite confidence for valid hand", () => {
    const recognizer = new SignAllRecognizer();
    const result = recognizer.process(hand(21));
    expect(Number.isFinite(result.confidence)).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });

  it("guards against invalid motionLandmarkIndex", () => {
    const recognizer = new SignAllRecognizer([
      {
        name: "BAD",
        landmarks: hand(21),
        motionSignature: [
          { x: 0, y: 0, z: 0 },
          { x: 0.1, y: 0, z: 0 },
          { x: 0.2, y: 0, z: 0 },
        ],
        motionLandmarkIndex: 99,
      },
    ]);
    recognizer.process(hand(21));
    recognizer.process(hand(21));
    const result = recognizer.process(hand(21));
    expect(Number.isFinite(result.confidence)).toBe(true);
  });

  it("clears history on reset", () => {
    const recognizer = new SignAllRecognizer();
    recognizer.process(hand(21));
    recognizer.process(hand(21));
    recognizer.process(hand(21));
    recognizer.reset();
    const result = recognizer.process(hand(21));
    expect(result.isMoving).toBe(false);
  });

  // --- Characterization ---

  it("characterization: exact dataset match returns high confidence", () => {
    const tempRecognizer = new SignAllRecognizer([]);
    const normFlat = (tempRecognizer as any).normalizeAndAlign(flatHand);
    const normFist = (tempRecognizer as any).normalizeAndAlign(fistHand);

    const dataset = [
      { name: "FLAT", landmarks: normFlat },
      { name: "FIST", landmarks: normFist },
    ];
    const recognizer = new SignAllRecognizer(dataset);

    const result = recognizer.process(flatHand);

    expect(result.sign).toBe("FLAT");
    expect(result.confidence).toBeGreaterThanOrEqual(0.84);
  });

  it("characterization: scale/translate invariance", () => {
    const tempRecognizer = new SignAllRecognizer([]);
    const normFlat = (tempRecognizer as any).normalizeAndAlign(flatHand);
    const normFist = (tempRecognizer as any).normalizeAndAlign(fistHand);

    const dataset = [
      { name: "FLAT", landmarks: normFlat },
      { name: "FIST", landmarks: normFist },
    ];
    const recognizer = new SignAllRecognizer(dataset);

    // Translated and scaled
    const input = flatHand.map((p) => ({ x: p.x * 0.5 + 10, y: p.y * 0.5 - 20, z: p.z * 0.5 }));
    const result = recognizer.process(input);

    expect(result.sign).toBe("FLAT");
    expect(result.confidence).toBeGreaterThanOrEqual(0.84);
  });

  it("characterization: noise far from dataset yields null", () => {
    const tempRecognizer = new SignAllRecognizer([]);
    const normFlat = (tempRecognizer as any).normalizeAndAlign(flatHand);
    const normFist = (tempRecognizer as any).normalizeAndAlign(fistHand);

    const dataset = [
      { name: "FLAT", landmarks: normFlat },
      { name: "FIST", landmarks: normFist },
    ];
    const recognizer = new SignAllRecognizer(dataset);

    // completely different shape (e.g. zig zag)
    const noise = Array.from({ length: 21 }, (_, i) => ({
      x: i % 2 === 0 ? 10 : -10,
      y: i % 3 === 0 ? 10 : -10,
      z: 0,
    }));
    const result = recognizer.process(noise);

    expect(result.sign).toBeNull();
  });

  it("characterization: displacement over 0.08 normalized units isMoving === true (looks wrong - see note)", () => {
    const recognizer = new SignAllRecognizer([]);

    // Frame 1
    recognizer.process(flatHand);

    // Frame 2: translated wildly (by 100 units).
    const displaced = flatHand.map((p) => ({ x: p.x + 100, y: p.y + 100, z: p.z }));
    const result = recognizer.process(displaced);

    // BUG: normalization sets wrist to (0,0,0) in all frames, so velocity is always 0.
    // Pinned to current behavior.
    expect(result.isMoving).toBe(false);
  });
});
