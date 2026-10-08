import "./style.css";
import { figure } from "./signing/body.ts";
import { characters, poseAt, spell } from "./signing/spell.ts";
import { createStage } from "./stage.ts";

const $ = <T extends HTMLElement>(selector: string): T => document.querySelector<T>(selector)!;
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

const stage = await createStage($<HTMLCanvasElement>("#stage"), figure(poseAt(spelling, 0)).length);
note.textContent = stage.backend === "webgpu" ? "WebGPU" : "WebGL fallback";
new ResizeObserver(() => stage.resize()).observe(document.body);
window.addEventListener("pointermove", (event) => {
  stage.lean((event.clientX / innerWidth) * 2 - 1, (event.clientY / innerHeight) * 2 - 1);
});

let shown = "";
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
  // The body's own life runs on the wall clock, so the figure is alive even when paused.
  stage.draw(figure(moment, now / 1000));

  // A letter lights one character of the caption; a sign lights its whole word.
  const showing = `${moment.char}+${moment.span}`;
  if (showing !== shown) {
    letters.forEach((letter, i) =>
      letter.classList.toggle("now", i >= moment.char && i < moment.char + moment.span),
    );
    shown = showing;
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
