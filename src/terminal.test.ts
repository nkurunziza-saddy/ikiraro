import { describe, expect, it } from "vite-plus/test";
import { cast, follow, grid, paint } from "./pixels.ts";
import type { View } from "./pixels.ts";
import type { Capsule } from "./signing/body.ts";
import { figure, REST } from "./signing/body.ts";
import { spell } from "./signing/spell.ts";
import { blocks, frames, SHOW } from "./terminal.ts";
import worker from "./worker.ts";

const ball = (z: number, skin: boolean): Capsule => ({
  a: [0, 0, z],
  b: [0, 0, z],
  radius: 0.2,
  skin,
});
const view = { centre: [0, 0] as const, height: 1 };
const draw = (capsules: Capsule[], width: number, height: number, looking: View = view) =>
  paint(cast(capsules, looking, grid(width, height)));
const alpha = (pixels: Uint8ClampedArray, x: number, y: number, width: number) =>
  pixels[(y * width + x) * 4 + 3];

describe("paint", () => {
  it("fills a capsule's outline and nothing else", () => {
    const pixels = draw([ball(0, true)], 20, 20);
    expect(alpha(pixels, 10, 10, 20)).toBe(255);
    expect(alpha(pixels, 0, 0, 20)).toBe(0);
    // A ball of radius 0.2 in a 1 m view is 8 of 20 pixels across.
    const row = Array.from({ length: 20 }, (_, x) => alpha(pixels, x, 10, 20)! > 0);
    expect(row.filter(Boolean)).toHaveLength(8);
  });

  it("shows whichever capsule is nearer the viewer", () => {
    const red = (capsules: Capsule[]) => draw(capsules, 20, 20)[(10 * 20 + 10) * 4]!;
    const skinInFront = red([ball(0, false), ball(0.5, true)]);
    const inkInFront = red([ball(0.5, false), ball(0, true)]);
    expect(skinInFront).toBeGreaterThan(inkInFront);
    expect(red([ball(0.5, true), ball(0, false)])).toBe(skinInFront);
  });

  it("draws a slanted capsule as one unbroken shape", () => {
    const bone: Capsule = { a: [-0.3, -0.3, 0.2], b: [0.3, 0.3, -0.2], radius: 0.05, skin: true };
    const pixels = draw([bone], 40, 40);
    for (let i = 9; i <= 30; i++) expect(alpha(pixels, i, 39 - i, 40)).toBe(255);
  });

  it("lets a flattened capsule come less far forwards", () => {
    const red = (capsules: Capsule[]) => draw(capsules, 20, 20)[(10 * 20 + 10) * 4]!;
    const round = red([ball(0, false), ball(-0.05, true)]);
    const flat = red([{ ...ball(0, false), press: [0, 0, 0.5] }, ball(-0.05, true)]);
    expect(flat).toBeGreaterThan(round);
  });

  it("finds the figure from far off and close to", () => {
    for (const looking of [{ centre: [-0.08, -0.07] as const, height: 0.94 }, follow(REST)]) {
      const pixels = draw(figure(REST), 80, 44, looking);
      expect(pixels.some((value, i) => i % 4 === 3 && value > 0)).toBe(true);
    }
  });
});

describe("terminal", () => {
  it("packs two pixels into each half block", () => {
    // One column, two rows of cells: skin over nothing, then nothing over skin.
    const pixels = new Uint8ClampedArray([1, 2, 3, 255, 0, 0, 0, 0, 0, 0, 0, 0, 4, 5, 6, 255]);
    const [first, second] = blocks(pixels, 1, 4).split("\n");
    expect(first).toContain("38;2;1;2;3m▀");
    expect(second).toContain("38;2;4;5;6m▄");
    expect(blocks(new Uint8ClampedArray(8), 1, 2)).toContain(" ");
  });

  it("plays a frame for every tick, each the size of the terminal", () => {
    const all = [...frames("hi", 60, 20, 10)];
    expect(all).toHaveLength(Math.ceil(spell("hi").duration * 10) + 1);
    for (const frame of all) {
      expect(frame.startsWith("\x1b[H")).toBe(true);
      // 17 rows of picture, a blank line and the caption.
      expect(frame.split("\n")).toHaveLength(19);
    }
    expect(all.some((frame) => frame.includes("1;38;2;240;228;208mH"))).toBe(true);
  });
});

describe("worker", () => {
  const env = { ASSETS: { fetch: () => Promise.resolve(new Response("the app")) } };
  const ask = (agent: string, path = "/hi") =>
    worker.fetch(
      new Request(`https://ikiraro.test${path}`, { headers: { "user-agent": agent } }),
      env,
    );

  it("sends browsers the app", async () => {
    expect(await (await ask("Mozilla/5.0")).text()).toBe("the app");
  });

  it("streams the animation to curl", async () => {
    const response = await ask("curl/8.5.0", "/hi?w=40&h=12");
    expect(response.headers.get("content-type")).toContain("text/plain");
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const opening = decoder.decode((await reader.read()).value);
    const frame = decoder.decode((await reader.read()).value);
    await reader.cancel();
    expect(opening).toBe(SHOW.start);
    expect(frame.split("\n")).toHaveLength(11);
  });
});
