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
    const queue = buildFrameQueue(plan);
    director.setQueue(queue);

    (mockCanvas.setPose as any).mockClear();

    director.seek(queue[0]!.duration * 0.9);

    const poseA = resolveHandshape("A");
    const poseB = resolveHandshape("B");

    expect(mockCanvas.setPose).not.toHaveBeenCalledWith(poseA);
    expect(mockCanvas.setPose).not.toHaveBeenCalledWith(poseB);

    const lastCall = (mockCanvas.setPose as any).mock.calls.at(-1)![0];
    expect(lastCall.thumb.splay).toBeCloseTo(0.15);
  });
});
