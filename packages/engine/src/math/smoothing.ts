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

/**
 * springStep with internal substepping. Semi-implicit Euler rings visibly once
 * ω·dt ≈ √stiffness·dt exceeds ~1 (e.g. stiff finger springs on a 30fps frame),
 * even though it only diverges past 2. This variant splits dt so each substep
 * keeps ω·h ≤ 0.4, making stiff springs frame-rate independent.
 */
export function springStepStable(
  current: number,
  velocity: number,
  target: number,
  dt: number,
  stiffness = 240,
  damping = 18,
): [number, number] {
  const maxH = 0.4 / Math.sqrt(stiffness);
  const steps = Math.max(1, Math.ceil(dt / maxH));
  const h = dt / steps;
  let value = current;
  let vel = velocity;
  for (let i = 0; i < steps; i++) {
    [value, vel] = springStep(value, vel, target, h, stiffness, damping);
  }
  return [value, vel];
}
