import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { LinguisticBuffer } from "./linguistic-buffer";
import { SignAllRecognizer } from "./sign-all-recognizer";

describe("fingerspelling stability", () => {
  let time = 10000;
  beforeEach(() => {
    time = 10000;
    vi.spyOn(performance, "now").mockImplementation(() => time);
  });
  afterEach(() => vi.restoreAllMocks());
  const hold = (buffer: LinguisticBuffer, sign: string, frames = 20) => {
    for (let i = 0; i < frames; i++) {
      buffer.update(sign);
      time += 50;
    }
  };

  it("does not invent a second letter during a sustained hold", () => {
    const buffer = new LinguisticBuffer();
    hold(buffer, "A", 100);
    expect(buffer.getState().currentWord).toBe("A");
  });
  it("allows repeated letters after explicit movement and a fresh stable hold", () => {
    const buffer = new LinguisticBuffer();
    hold(buffer, "L");
    buffer.update("L", { isTransitioning: true });
    time += 50;
    hold(buffer, "L");
    expect(buffer.getState().currentWord).toBe("LL");
  });
  it("does not combine isolated detections across missing frames into a stable letter", () => {
    const buffer = new LinguisticBuffer();
    for (let i = 0; i < 10; i++) {
      buffer.update("A");
      time += 100;
      buffer.update(null);
    }
    expect(buffer.getState().currentWord).toBe("");
  });
  it("uses image-space movement when world landmarks are wrist-relative", () => {
    const recognizer = new SignAllRecognizer([]);
    const hand = Array.from({ length: 21 }, (_, i) => ({ x: i * 0.01, y: i * 0.02, z: 0 }));
    recognizer.process(hand, hand);
    const result = recognizer.process(
      hand,
      hand.map((p) => ({ ...p, x: p.x + 0.1 })),
    );
    expect(result.velocity?.x).toBeCloseTo(0.1);
    expect(result.isMoving).toBe(true);
    recognizer.reset();
    expect(recognizer.process(hand, hand).isMoving).toBe(false);
  });
  it("rejects non-finite landmarks", () => {
    const hand = Array.from({ length: 21 }, () => ({ x: NaN, y: 0, z: 0 }));
    expect(new SignAllRecognizer().process(hand).sign).toBeNull();
  });
});
