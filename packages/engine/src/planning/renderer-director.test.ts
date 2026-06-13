import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock requestAnimationFrame for node test environment
const origRaf = globalThis.requestAnimationFrame;
const origCaf = globalThis.cancelAnimationFrame;
beforeEach(() => {
  globalThis.requestAnimationFrame = vi.fn().mockReturnValue(1);
  globalThis.cancelAnimationFrame = vi.fn();
});
afterEach(() => {
  globalThis.requestAnimationFrame = origRaf;
  globalThis.cancelAnimationFrame = origCaf;
});

import "./index"; // Initialize LanguageRegistry
import { FrameBuilder } from "./frame-builder";
import { resolveHandshape } from "./pose-library";
import { RendererDirector } from "./renderer-director";
import type { SignCanvas } from "./renderer-types";

const builder = new FrameBuilder();
describe("RendererDirector", () => {
  const mockCanvas: SignCanvas = {
    setPose: vi.fn(),
    setOverlay: vi.fn(),
    setExpression: vi.fn(),
    clear: vi.fn(),
  };
  it("should drive the canvas with resolved poses", () => {
    const director = new RendererDirector(mockCanvas);
    const plan = {
      clauses: [
        {
          tokens: [{ type: "fingerspell", text: "A", durationMs: 100 }],
        },
      ],
    } as any;
    const queue = builder.build(plan);
    director.setQueue(queue);

    director.reset();
    expect(mockCanvas.setPose).toHaveBeenCalledWith(resolveHandshape("A"));
  });
  it("should blend between poses during transitions", () => {
    const director = new RendererDirector(mockCanvas);
    const plan = {
      clauses: [
        {
          tokens: [
            { type: "fingerspell", text: "AB", durationMs: 400, coarticulationHint: "blend" },
          ],
        },
      ],
    } as any;
    const queue = builder.build(plan);
    director.setQueue(queue);

    (mockCanvas.setPose as any).mockClear();

    director.seek(queue[0]?.duration * 0.9);

    const poseA = resolveHandshape("A");
    const poseB = resolveHandshape("B");

    expect(mockCanvas.setPose).not.toHaveBeenCalledWith(poseA);
    expect(mockCanvas.setPose).not.toHaveBeenCalledWith(poseB);

    const lastCall = (mockCanvas.setPose as any).mock.calls.at(-1)?.[0];
    expect(lastCall.thumb.splay).toBeCloseTo(0.15);
  });
  it("should handle pipeline interruptions cleanly", () => {
    const director = new RendererDirector(mockCanvas);
    const plan1 = {
      clauses: [{ tokens: [{ type: "fingerspell", text: "A", durationMs: 1000 }] }],
    } as any;
    const plan2 = {
      clauses: [{ tokens: [{ type: "fingerspell", text: "B", durationMs: 1000 }] }],
    } as any;

    const queue1 = builder.build(plan1);
    const queue2 = builder.build(plan2);

    let isPlaying = false;
    director.subscribe((state) => {
      isPlaying = state.isPlaying;
    });

    director.setQueue(queue1);
    director.play();
    expect(isPlaying).toBe(true);

    // Simulate partial progress
    director.seek(500);

    // Interrupt with new queue
    director.setQueue(queue2);
    expect(director.getState().time).toBe(0);
    director.play();
    director.reset();

    expect(mockCanvas.setPose).toHaveBeenCalledWith(resolveHandshape("B"));
  });
  it("should guard against NaN recursion with zero-duration frames in loop mode", () => {
    const director = new RendererDirector(mockCanvas);
    director.setOptions({ loop: true });
    director.setQueue([{ duration: 0, type: "fingerspell", value: "A" } as any]);
    director.seek(100);

    const state = director.getState();
    expect(Number.isFinite(state.time)).toBe(true);
    expect(state.isPlaying).toBe(false);
  });
});
