# Sensa Vision Pipeline: High-Grade Implementation Guide

## Architecture Overview

The vision pipeline is designed according to the "Pipeline Decoupling" principle, ensuring each stage is specialized, testable, and replaceable.

### 1. Extraction Layer (`IFeatureExtractor`)

- **Responsibility**: Normalizes raw landmarks (metric 3D) into high-leverage features.
- **Key Features**: Finger curls, palm orientation, and **3D Spatial Depth** (e.g., `thumbVsFingerDepth`).
- **Implementation**: `SensaFeatureExtractor`.

### 2. Matching Layer (`ISignMatcher`)

- **Responsibility**: Scores a feature vector against the sign vocabulary.
- **Implementations**:
  - `SensaSurgicalMatcher`: Heuristic-based, high-precision rules.
  - _HybridMLMatcher (Planned)_: A small classifier (e.g., MLP) trained on landmark data.

### 3. Temporal Layer (`ITemporalSmoother`)

- **Responsibility**: Stabilizes raw scores over a sliding window.
- **Logic**: Uses Consensus (majority vote) and Hysteresis (lock/unlock thresholds) to prevent flickering.

### 4. Articulation Layer (`WordBuffer`)

- **Responsibility**: Assembles stable signs into words.
- **Advanced Features**:
  - **Transition Filtering**: Ignores noise during rapid hand movements.
  - **Gesture-Based Doubles**: Detects "slide" or "bounce" gestures for double letters instead of relying purely on slow timers.

---

## Roadmap for Hybrid ML Model

Now that the pipeline is decoupled, transitioning to a Hybrid ML model is "by the book":

1. **Data Collection**:
   - Use the `SensaSurgicalClassifier` in debug mode to record `FeatureVector` snapshots during successful signs.
   - Annotate these snapshots with the target sign.

2. **Model Training**:
   - Train a small MLP (Multi-Layer Perceptron) or Random Forest using the `FeatureVector` properties as inputs.
   - Target a model size < 1MB for fast loading in the Web Worker.

3. **Implementation**:
   - Create `HybridMLMatcher` implementing `ISignMatcher`.
   - Load the model (TensorFlow.js or ONNX) in the `load()` method.

4. **Deployment**:
   - Swap the `matcher` instance in `SensaSurgicalClassifier` with the new `HybridMLMatcher`.

---

## Verification

Run the test suite to ensure architectural integrity:

```bash
npm test -w @sensa/engine
```
