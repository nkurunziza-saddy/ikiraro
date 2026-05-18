/**
 * Smoothing utilities for animations and signal processing.
 */

/**
 * Critically-damped smoothing — frame-rate independent.
 *
 * @param current Current value
 * @param target Target value
 * @param dt Delta time in seconds
 * @param rate Convergence rate (higher is faster)
 * @returns The next value
 */
export function smoothApproach(current: number, target: number, dt: number, rate = 14): number {
  const t = 1 - Math.exp(-rate * dt);
  return current + (target - current) * t;
}

/**
 * A simple spring-damper integration step.
 * Higher stiffness = more snap. Lower damping = more bounce.
 */
export function springStep(
  current: number,
  velocity: number,
  target: number,
  dt: number,
  stiffness = 240,
  damping = 18,
): [number, number] {
  const force = stiffness * (target - current);
  const acceleration = force - damping * velocity;
  const nextVelocity = velocity + acceleration * dt;
  const nextValue = current + nextVelocity * dt;
  return [nextValue, nextVelocity];
}
