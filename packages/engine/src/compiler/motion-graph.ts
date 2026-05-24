import type { MotionType, Transition } from "../types";

export class MotionGraph {
  public currentMotion: MotionType = "none";
  public nextMotion: MotionType | null = null;

  public isTransitioning = false;
  public transitionProgress = 0; // 0 to 1
  public activeTransition: Transition | null = null;

  public update(deltaMs: number) {
    if (this.isTransitioning && this.activeTransition) {
      this.transitionProgress += deltaMs / this.activeTransition.durationMs;

      if (this.transitionProgress >= 1) {
        this.currentMotion = this.nextMotion ?? "none";
        this.nextMotion = null;
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.activeTransition = null;
      }
    }
  }

  public triggerTransition(transition: Transition) {
    this.nextMotion = transition.to;
    this.activeTransition = transition;
    this.isTransitioning = true;
    this.transitionProgress = 0;
  }
}
