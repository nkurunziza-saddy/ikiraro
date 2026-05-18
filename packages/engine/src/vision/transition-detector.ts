import type { Point3D, ITransitionDetector } from "./types";

/**
 * Detects if the hand is currently in a transition state between signs.
 * Transitions are characterized by high velocity and unstable handshapes.
 */
export class IkiraroTransitionDetector implements ITransitionDetector {
  private readonly velocityThreshold = 0.25;
  private transitionFrames = 0;
  private readonly debounceFrames = 3;

  isTransitioning(velocity: Point3D, confidence: number): boolean {
    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);

    // If moving fast OR confidence is low, we might be transitioning.
    const moving = speed > this.velocityThreshold;
    const unstable = confidence < 0.4;

    if (moving || unstable) {
      this.transitionFrames++;
    } else {
      this.transitionFrames = 0;
    }

    return this.transitionFrames >= this.debounceFrames;
  }

  reset(): void {
    this.transitionFrames = 0;
  }
}
