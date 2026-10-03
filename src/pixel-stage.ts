import { paint, WHOLE } from "./pixels.ts";
import type { Capsule } from "./signing/body.ts";

/** One painted pixel covers this many CSS pixels each way. */
const CELL = 4;
/** The least width of figure, in metres, that a narrow screen must still show. */
const WIDTH = 0.72;

/** The software renderer on a canvas: a small grid, scaled up with hard edges. */
export function createPixelStage(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d")!;
  let image = context.createImageData(1, 1);

  return {
    backend: "pixels",
    resize() {
      canvas.width = Math.max(1, Math.ceil(canvas.clientWidth / CELL));
      canvas.height = Math.max(1, Math.ceil(canvas.clientHeight / CELL));
      image = context.createImageData(canvas.width, canvas.height);
    },
    lean() {},
    draw(capsules: readonly Capsule[]) {
      const { width, height } = canvas;
      const view = { ...WHOLE, height: Math.max(WHOLE.height, (WIDTH * height) / width) };
      paint(capsules, width, height, view, image.data);
      context.putImageData(image, 0, 0);
    },
  };
}
