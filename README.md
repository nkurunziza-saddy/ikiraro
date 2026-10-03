# Ikiraro

_Ikiraro_ is Kinyarwanda for _bridge_. Type a word and a figure fingerspells it in American Sign Language, in the browser, drawn with WebGPU.

```bash
vp install
vp dev
```

## How it works

There is no model file, no rig and no animation clips. Four ideas replace them.

**A hand is twenty directions.** A hand has 21 joints and so 20 bones. A handshape is one unit vector per bone, each expressed relative to the bone before it ([`hand.ts`](src/signing/hand.ts)). Bone lengths are fixed, so no blend of two shapes can stretch a finger, and because every joint bends by well under a half turn, blending never has to guess which way round a finger should travel.

**Letters are measured, not drawn.** Twenty letters come from the median of real hands in the [ASLNow fingerspelling dataset](https://huggingface.co/datasets/sid220/asl-now-fingerspelling) (MIT). The dataset's depth is unreliable, so [`build-letters.ts`](scripts/build-letters.ts) recovers it from foreshortening: a bone that looks shorter than it is must be pointing at the camera. The other six letters are signed edge-on to a camera (G, H, P, Q) or are movements (J, Z), and are composed from measured fingers in [`alphabet.ts`](src/signing/alphabet.ts): G is A's fist with L's index finger.

**Animation is a pure function of time.** [`spell.ts`](src/signing/spell.ts) turns a text into a timeline, and `poseAt(spelling, t)` returns the hand at any instant. Nothing holds state, so playback can be paused, scrubbed or linked to: `/?t=1.5#hello` opens on that exact frame. Transitions follow a minimum-jerk curve, fingers lead and lag one another, a larger turn of the hand takes longer, and a doubled letter slides sideways instead of being formed twice.

**The figure is capsules.** [`body.ts`](src/signing/body.ts) places the arm with two-bone inverse kinematics and returns a list of capsules; [`stage.ts`](src/stage.ts) draws them as two instanced meshes with three.js's `WebGPURenderer`, falling back to WebGL where WebGPU is missing. The body is dark and the hands are light for the reason interpreters wear black.

## Layout

```
src/signing/   math, hand, letters (generated), alphabet, spell, body
src/stage.ts   the renderer
src/main.ts    the page
scripts/       build-letters.ts, which regenerates src/signing/letters.ts
```

To rebuild the letter data:

```bash
git clone --depth 1 https://huggingface.co/datasets/sid220/asl-now-fingerspelling train_landmarks/aslnow
vp run letters
```

## Checks

```bash
vp check   # format, lint, types
vp test    # hand, alphabet, timeline and body
vp build
```

## Limits

- Fingerspelling only: A to Z. There are no signs for whole words, no digits and no facial grammar, so this is not ASL translation.
- The handshapes have not been reviewed by a fluent signer. The six composed letters, and the paths of J and Z, are an interpretation of reference material rather than measurements.
- Recovered depth is approximate. The figure reads best from the front, which is how it is framed.
