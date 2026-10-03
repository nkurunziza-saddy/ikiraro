import "./style.css";
import { createPixelStage } from "./pixel-stage.ts";
import { figure } from "./signing/body.ts";
import type { Capsule } from "./signing/body.ts";
import { characters, poseAt, spell } from "./signing/spell.ts";

const $ = <T extends HTMLElement>(selector: string): T => document.querySelector<T>(selector)!;
const smooth = $<HTMLCanvasElement>("#stage");
const pixelated = $<HTMLCanvasElement>("#pixels");
const look = $<HTMLButtonElement>("#look");
const form = $<HTMLFormElement>("#say");
const input = $<HTMLInputElement>("#text");
const caption = $("#caption");
const scrub = $<HTMLInputElement>("#scrub");
const toggle = $<HTMLButtonElement>("#toggle");
const speed = $<HTMLSelectElement>("#speed");
const note = $("#note");

const DEFAULT_TEXT = "hello";
const fromHash = () => decodeURIComponent(location.hash.slice(1)).slice(0, 80) || DEFAULT_TEXT;

// The whole player: a spelling, a time, and whether time is moving.
let spelling = spell("");
let time = 0;
let playing = false;
let letters: HTMLElement[] = [];

function say(text: string) {
  spelling = spell(text);
  time = 0;
  playing = spelling.duration > 0;
  input.value = text;
  history.replaceState(null, "", `#${encodeURIComponent(text)}`);
  letters = characters(text).map((char) => {
    const span = document.createElement("span");
    span.textContent = char === " " ? "\u00a0" : char;
    return span;
  });
  caption.replaceChildren(...letters);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  say(input.value.trim());
});
toggle.addEventListener("click", () => {
  if (time >= spelling.duration) time = 0;
  playing = !playing;
});
scrub.addEventListener("input", () => {
  playing = false;
  time = scrub.valueAsNumber * spelling.duration;
});
window.addEventListener("hashchange", () => {
  if (fromHash() !== spelling.text) say(fromHash());
});

// Two ways to draw the same capsules. The GPU one is only downloaded if it is used.
type Stage = {
  backend: string;
  resize(): void;
  lean(x: number, y: number): void;
  draw(capsules: readonly Capsule[]): void;
};
const NAMES: Record<string, string> = {
  webgpu: "WebGPU",
  webgl: "WebGL fallback",
  pixels: "Pixels, no GPU",
};
const pixelStage: Stage = createPixelStage(pixelated);
let smoothStage: Stage | undefined;
let stage = pixelStage;

async function setLook(pixels: boolean) {
  if (!pixels && !smoothStage) {
    const { createStage } = await import("./stage.ts");
    smoothStage = await createStage(smooth, figure(poseAt(spelling, 0)).length);
  }
  stage = pixels ? pixelStage : smoothStage!;
  smooth.hidden = pixels;
  pixelated.hidden = !pixels;
  stage.resize();
  look.setAttribute("aria-pressed", String(pixels));
  note.textContent = NAMES[stage.backend] ?? stage.backend;
}

// Pixels unless asked otherwise: by the link, or by a choice made here before.
const LOOK = "ikiraro.look";
look.addEventListener("click", () => {
  const pixels = stage !== pixelStage;
  localStorage.setItem(LOOK, pixels ? "pixels" : "smooth");
  void setLook(pixels);
});
new ResizeObserver(() => stage.resize()).observe(document.body);
window.addEventListener("pointermove", (event) => {
  stage.lean((event.clientX / innerWidth) * 2 - 1, (event.clientY / innerHeight) * 2 - 1);
});
await setLook(
  (new URLSearchParams(location.search).get("look") ?? localStorage.getItem(LOOK)) !== "smooth",
);

let shown = -2;
let last = performance.now();
function frame(now: number) {
  const elapsed = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (playing) {
    time += elapsed * Number(speed.value);
    if (time >= spelling.duration) {
      time = spelling.duration;
      playing = false;
    }
  }

  const moment = poseAt(spelling, time);
  // Breathing runs on the wall clock, so the figure is alive even when paused.
  stage.draw(figure(moment, Math.sin(now / 640)));

  if (moment.char !== shown) {
    letters[shown]?.classList.remove("now");
    letters[moment.char]?.classList.add("now");
    shown = moment.char;
  }
  if (document.activeElement !== scrub) {
    scrub.value = String(spelling.duration ? time / spelling.duration : 0);
  }
  toggle.dataset.state = playing ? "playing" : "paused";
  toggle.setAttribute("aria-label", playing ? "Pause" : "Play");
  requestAnimationFrame(frame);
}

say(fromHash());
// `?t=1.5` opens on that exact moment, paused: every frame has an address.
const startAt = new URLSearchParams(location.search).get("t");
if (startAt !== null && Number.isFinite(Number(startAt))) {
  time = Number(startAt);
  playing = false;
}
requestAnimationFrame(frame);
