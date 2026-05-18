import { describe, it, expect, vi } from "vitest";
import { RendererDirector } from "./renderer-director";
import { buildFrameQueue } from "./frame-queue";
import type { SignCanvas } from "./renderer-types";
import { resolveHandshape } from "./pose-library";

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

    const queue = buildFrameQueue(plan);
    director.setQueue(queue);

    // Initial state after reset (time 0)
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

    const queue = buildFrameQueue(plan); // 2 frames, 200ms each
    director.setQueue(queue);

    // Clear initial reset calls
    (mockCanvas.setPose as any).mockClear();

    // Seek to 180ms (90% through frame A)
    // Default blend window for "blend" is 0.2 (last 20% of frame)
    // At 180ms into a 200ms frame, progress is 0.9.
    // 0.9 > (1 - 0.2) = 0.8, so it should be blending.

    director.seek(180);

    // blendFactor = (0.9 - 0.8) / 0.2 = 0.1 / 0.2 = 0.5
    // It should call setPose with a 50/50 mix of A and B
    const poseA = resolveHandshape("A");
    const poseB = resolveHandshape("B");

    // We can't easily check the exact mixed object without reproducing mix logic
    // but we can verify it was called and it's NOT just poseA
    expect(mockCanvas.setPose).not.toHaveBeenCalledWith(poseA);
    expect(mockCanvas.setPose).not.toHaveBeenCalledWith(poseB);

    // Check specific value if we want to be thorough
    const lastCall = (mockCanvas.setPose as any).mock.calls.at(-1)![0];
    expect(lastCall.thumb.splay).toBeCloseTo(0.15); // (A: -0.25, B: 0.55) -> 0.15 at 0.5 factor
  });
});
