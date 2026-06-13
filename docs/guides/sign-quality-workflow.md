# Sign Quality & Calibration Workflow

This guide covers the empirical calibration of the engine's planning and vision systems using real-world sign language datasets.

## Reference Datasets

| Dataset                                                                                                  | Content                                                                                              | Purpose                                                                                                                                                               | Local Path                                                                                       |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [Kaggle ASL Fingerspelling](https://www.kaggle.com/competitions/asl-fingerspelling)                      | Continuous fingerspelling of phrases (MediaPipe holistic landmarks, ~30fps), 68 parquet files ≈ 75GB | Timing, rhythm, micro-motion. **No per-letter labels** — cannot give per-letter handshapes without alignment | `train.csv` (repo root) + `train_landmarks/5414471.parquet` (gitignored, 1 of 68 files — enough) |
| [sid220/asl-now-fingerspelling](https://huggingface.co/datasets/sid220/asl-now-fingerspelling) (HF, MIT) | ~2.1k isolated palm-forward letter captures, 21 hand landmarks each, labeled A–Z                     | Per-letter handshape angles                                                                                                                                          | `train_landmarks/aslnow/` (gitignored, 3MB git clone)                                            |

To fetch more Kaggle files: `kaggle competitions download -c asl-fingerspelling -f train_landmarks/<file_id>.parquet`

## Calibration scripts (scripts/ and train_landmarks/)

| Script                                                    | Input        | Calibrates                                                                                                                                                          |
| --------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `train_landmarks/analyze-rhythm.py <parquet> <train.csv>` | Kaggle       | `FINGERSPELL_PER_CHAR_MS`, `NUMBER_PER_DIGIT_MS` in `planning/tokens.ts`                                                                                            |
| `train_landmarks/analyze-motion.py <parquet> <train.csv>` | Kaggle       | fs-pulse amplitude/period (`trajectories/implementations.ts`), finger spring k/c (`renderer/sign-model-gltf.tsx`), motion-layer spring (`kinematics/controller.ts`) |
| `train_landmarks/extract-handshapes.py <aslnow-dir> --write` | HF           | flexion channels of A–Z in `planning/handshapes/asl.json`                                                                                                           |
| `scripts/retarget-handshapes.ts`                          | (diagnostic) | shows why averaged centroids can't drive handshapes — kept as a cautionary tool                                                                                     |
| `scripts/build-letter-templates.ts <aslnow-dir> --write`  | HF           | recognition templates in `vision/letter-templates.ts` (2-means clusters, chirality-canonicalized, per-cluster medians)                                              |
| `scripts/eval-recognition.ts <aslnow-dir> [--baseline]`   | HF           | held-out accuracy + confusion + score distributions; calibrates recognizer `similarityScale`/`threshold`/`margin`                                                   |

## Applied calibrations (June 2026, 613–952 sequences)

- **Pace**: 200 ms/letter (measured 183–315), 240 ms/digit (measured 226–351). Real signers spell digits _slower_ than letters.
- **Handshapes**: flexion angles for 20 letters are per-sample medians from real hands, two-anchor calibrated (A=fist, B=flat) into renderer conventions. Excluded: G/H/P/Q (rotated orientation) and J/Z (motion letters) — the palm-forward dataset's depth collapses for them; they keep curated values. Splay channels stay curated (sign-ambiguous under webcam mirroring).
- **Phonology**: N-grams (1,2,3) from the Kaggle dataset drive the `CompositionPlugin` debounce window; rare transitions are allowed more "settle" time.

## Evaluation Protocol

### 1. Recognition Accuracy

The primary metric is held-out letter accuracy. We split the isolated letter dataset (sid220) deterministically: even-numbered files for templates, odd-numbered for evaluation.

```bash
# Evaluate shipped recognizer
bun scripts/eval-recognition.ts train_landmarks/aslnow --baseline

# Rebuild templates + evaluate
bun scripts/build-letter-templates.ts train_landmarks/aslnow --write
bun scripts/eval-recognition.ts train_landmarks/aslnow
```

Target: >85% top-1 accuracy on held-out palm-forward samples.

### 2. Kinematic Naturalness

Measured by jitter in the 3D renderer and response to step-inputs (sign changes).

- **Spring Constants**: Calibrated using `analyze-motion.py`. If the avatar feels "floaty," increase `k` (stiffness). If it oscillates, increase `c` (damping).
- **Procrustes Normalization**: Ensures that different hand sizes/distances don't affect recognition scores. Verified by `test/vision/normalize.test.ts`.

## Update Workflow

When a new dataset is available:

1. **Extraction**: Run `train_landmarks/extract-handshapes.py --write` to update the canonical handshapes.
2. **Template Building**: Run `scripts/build-letter-templates.ts --write`.
3. **Validation**: Run `scripts/eval-recognition.ts` and `bun run test`.
4. **Manual Polish**: If specific letters are degraded (e.g. "K" vs "V" confusion), adjust the `margin` parameter in `SignAllRecognizer`.

> [!TIP]
> Landmark data is sensitive to coordinate space (MediaPipe uses 0-1, we use centered Euclidean). Always use `normalizeAndAlign` before comparison.
