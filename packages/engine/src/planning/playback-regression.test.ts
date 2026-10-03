import { describe, expect, it, vi } from "vite-plus/test";
import { FrameBuilder, buildPlanFromUnits, computeMotionDelta, resolveHandshape } from "./index";
import { RendererDirector } from "./renderer-director";
import type { SignCanvas } from "./renderer-types";

function canvas(): SignCanvas {
  return {
    setPose: vi.fn(),
    setLeftPose: vi.fn(),
    setOverlay: vi.fn(),
    setMotion: vi.fn(),
    clear: vi.fn(),
  };
}

describe("signing playback regressions", () => {
  it("uses each clause's expression and preserves explicit transition hints", () => {
    const plan = buildPlanFromUnits(["A"]);
    plan.clauses = [
      {
        intent: "question",
        tokens: [
          {
            type: "fingerspell",
            text: "A",
            durationMs: 100,
            emphasis: "normal",
            coarticulationHint: "none",
          },
        ],
      },
      {
        intent: "statement",
        tokens: [{ type: "fingerspell", text: "B", durationMs: 100, emphasis: "normal" }],
      },
    ];
    const frames = new FrameBuilder().build(plan);
    expect(frames.map((f) => f.facialExpression)).toEqual(["inquisitive", "neutral"]);
    expect(frames[0]?.coarticulation).toBe("none");
  });

  it("holds the last handshape through pauses without blending toward an unknown pose", () => {
    const output = canvas();
    const director = new RendererDirector(output, null);
    director.setQueue([
      { type: "fingerspell", value: "A", label: "A", duration: 100 },
      { type: "pause", value: "/", label: "Pause", duration: 100 },
    ]);
    director.seek(95);
    expect(output.setPose).toHaveBeenLastCalledWith(resolveHandshape("A"));
    director.seek(150);
    expect(output.setPose).toHaveBeenLastCalledWith(resolveHandshape("A"));
    expect(output.clear).not.toHaveBeenCalled();
  });

  it("runs under an external render loop without browser animation APIs", () => {
    const director = new RendererDirector(canvas(), null);
    director.setQueue([{ type: "fingerspell", value: "A", label: "A", duration: 100 }]);
    director.setOptions({ speed: 2 });
    director.play();
    director.advance(25);
    expect(director.getState().progress).toBe(0.5);
    director.advance(25);
    expect(director.getState().isPlaying).toBe(false);
    expect(director.getState().progress).toBe(1);
  });

  it("rejects invalid speed, clamps seeking, and protects internal state", () => {
    const director = new RendererDirector(canvas(), null);
    director.setQueue([{ type: "fingerspell", value: "A", label: "A", duration: 100 }]);
    expect(() => director.setOptions({ speed: NaN })).toThrow(RangeError);
    director.seek(-20);
    expect(director.getState().time).toBe(0);
    director.getState().time = 999;
    expect(director.getState().time).toBe(0);
  });

  it("preserves both handshapes from planning to the output adapter", () => {
    const frames = new FrameBuilder().build(buildPlanFromUnits(["FAMILY"]));
    const output = canvas();
    new RendererDirector(output, null).setQueue(frames);
    expect(output.setLeftPose).toHaveBeenCalledWith(resolveHandshape("F"));
  });

  it("does not pin cyclic gestures at their zero-displacement endpoint", () => {
    const twist = computeMotionDelta("wrist-twist", 0.35);
    const pat = computeMotionDelta("chest-pat", 0.5);
    expect(Math.abs(twist.rHandYDelta ?? 0)).toBeGreaterThan(0.1);
    expect(Math.abs(pat.rArmZDelta)).toBeGreaterThan(0.1);
  });
});
