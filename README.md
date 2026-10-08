# Ikiraro

_Ikiraro_ is Kinyarwanda for _bridge_. Type something and a figure signs it in American Sign Language, signing the words it knows and fingerspelling the rest: drawn with WebGPU in the browser, or as half blocks in a terminal.

```bash
vp install
vp dev                      # the browser
node src/cli.ts hello       # the terminal
```

<!-- TODO: add a demo GIF here, browser and terminal side by side, e.g.
![Ikiraro signing "hello" in the browser and in a terminal](docs/demo.gif) -->

## How it works

There is no model file, no rig and no animation clips. Six ideas replace them.

**A hand is twenty directions.** A hand has 21 joints and so 20 bones. A handshape is one unit vector per bone, each expressed relative to the bone before it ([`hand.ts`](src/signing/hand.ts)). Bone lengths are fixed, so no blend of two shapes can stretch a finger, and because every joint bends by well under a half turn, blending never has to guess which way round a finger should travel.

**Letters are measured, not drawn.** Twenty letters come from the median of real hands in the [ASLNow fingerspelling dataset](https://huggingface.co/datasets/sid220/asl-now-fingerspelling) (MIT). The dataset's depth is unreliable, so [`build-letters.ts`](scripts/build-letters.ts) recovers it from foreshortening: a bone that looks shorter than it is must be pointing at the camera. The other six letters are signed edge-on to a camera (G, H, P, Q) or are movements (J, Z), and are composed from measured fingers in [`alphabet.ts`](src/signing/alphabet.ts): G is A's fist with L's index finger.

**Animation is a pure function of time.** [`spell.ts`](src/signing/spell.ts) turns a text into a timeline, and `poseAt(spelling, t)` returns the hand at any instant. Nothing holds state, so playback can be paused, scrubbed or linked to: `/?t=1.5#hello` opens on that exact frame. Transitions follow a minimum-jerk curve, fingers lead and lag one another, a larger turn of the hand takes longer, the hand dips between letters so each one lands as a beat, it comes up a little past its mark and settles, and a doubled letter slides sideways instead of being formed twice. The keyed motion is then averaged over a short window either side of now, which gives the hand inertia: it never starts or stops dead, and each letter begins before the last has quite finished.

**Some words are signs.** HELLO is not five letters but a flat hand leaving the temple; ME is an index finger on the chest. [`signs.ts`](src/signing/signs.ts) holds a small lexicon (hello, me, you, yes, please, sorry, my, thank you), each a short run of stations: a handshape, which way it faces, and where on the body it goes. The timeline signs any word or phrase it finds there and spells everything else, and a longer reach or a bigger turn takes longer and swings out in front of the body on the way.

**The figure is capsules.** [`body.ts`](src/signing/body.ts) places the arm with two-bone inverse kinematics, keeping the elbow near the body so the wrist does the pointing, and returns a list of capsules. A capsule may taper, as a forearm or a finger does, and may be pressed flat, as a trunk or a palm is. The body is dark and the hands are light for the reason interpreters wear black.

**The whole body signs.** A figure that moved one hand would look like a machine, so the rest answers it, all derived from where the hand is: the trunk leans and turns its shoulder into the spelling, the head tilts, the eyes go to the hand as it rises and falls, and the head rides the beat of the letters. Breathing, a slow shift of weight and blinking run on the wall clock, so the figure is alive even when paused.

## Two screens, one figure

Because the figure is only a list of capsules, drawing it is a small problem that can be solved more than once.

- **The browser.** [`stage.ts`](src/stage.ts) builds the capsules as one mesh, placed again every frame, and draws it with three.js's `WebGPURenderer`, falling back to WebGL where WebGPU is missing. It is lit as a studio would light it: one soft key that casts shadows, so a finger in front of the palm shows as one, and a light from behind on each side to draw the figure's edge against the dark.
- **The terminal.** [`pixels.ts`](src/pixels.ts) is a ray-caster of about a hundred lines with no dependencies that looks at the capsules through a small grid of cells, and [`terminal.ts`](src/terminal.ts) prints that grid as coloured half blocks, two pixels to a character, with a view that follows the hand so it fills the screen.

```bash
node src/cli.ts hello world
```

Deployed, the same animation is served to `curl`: [`worker.ts`](src/worker.ts) streams it to command-line clients and hands browsers the app.

<!-- TODO: replace ikiraro.example with the deployed address once `pnpm run deploy` has run. -->

```bash
curl "https://ikiraro.example/hello?w=$COLUMNS&h=$LINES"
```

## Layout

```
src/signing/     math, hand, letters (generated), alphabet, signs, spell, body
src/stage.ts     the WebGPU renderer
src/pixels.ts    the software renderer the terminal uses
src/terminal.ts  pixels to half blocks; cli.ts and worker.ts play them
src/main.ts      the page
scripts/         build-letters.ts, which regenerates src/signing/letters.ts
```

To rebuild the letter data:

```bash
git clone --depth 1 https://huggingface.co/datasets/sid220/asl-now-fingerspelling train_landmarks/aslnow
vp run letters
```

## Checks

```bash
vp check   # format, lint, types
vp test    # hand, alphabet, signs, timeline, body, pixels and terminal
vp build
```

## Known limits

- A to Z, and eight signs (twelve words with their aliases: hi, I, mine, thanks). It signs with the right hand only. Everything else is spelled, there are no digits and no facial grammar, and word order is whatever was typed, so this is not ASL translation.
- Nothing here has been reviewed by a fluent signer. The six composed letters, the paths of J and Z, and every sign in the lexicon are written from published descriptions rather than measured or recorded, and the signs use one hand only.
- Recovered depth is approximate. The figure reads best from the front, which is how it is framed.
- In an 80 by 24 terminal a finger is about three pixels wide: open letters such as L, V and Y read well, fists less so. A larger terminal helps.
