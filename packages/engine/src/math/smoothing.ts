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
