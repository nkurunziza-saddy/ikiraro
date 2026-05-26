import type { ArmTarget } from "../../types";
import { springStep } from "../../math/smoothing";
import type { MotionDelta } from "../trajectories/types";
import type { IKinematicController, KinematicPose } from "./types";

type SpringState = {
  value: number;
  velocity: number;
};

type JointStateRecord = Record<
  | "rArmX"
  | "rArmY"
  | "rArmZ"
  | "rForeX"
  | "rForeY"
  | "rForeZ"
  | "rHandX"
  | "rHandY"
  | "rHandZ"
  | "lArmX"
  | "lArmY"
  | "lArmZ"
  | "lForeX"
  | "lForeY"
  | "lForeZ"
  | "lHandX"
  | "lHandY"
  | "lHandZ",
  SpringState
>;

// Signing rest position — average neutral arm pose used to warm-start springs
// and as fallback when an ArmTarget leaves a joint unspecified.
// Note: rHandY/Z and lHandY/Z are not in ArmTarget; their motion comes from MotionDelta.
const SIGNING_REST = {
  rArmX: 0.76,
  rArmY: 0,
  rArmZ: -0.52,
  rForeX: 0,
  rForeY: 0.48,
  rForeZ: -1.5,
  rHandX: 0,
  lArmX: 0.82,
  lArmY: -0.28,
  lArmZ: 0.34,
  lForeX: 0,
  lForeY: -0.34,
  lForeZ: 1.42,
  lHandX: -0.18,
} as const;

/**
 * Stateful kinematic engine that manages physical continuity for the avatar.
 * It uses dual-layer spring tracking:
 * 1. Base Layer: Smoothly approaches high-level targets (forehead, chest, etc.)
 * 2. Motion Layer: High-frequency smoothing for trajectory deltas (arcs, shakes)
 *
 * This restores the "mass" and "flow" that were lost when deltas were applied raw.
 */
export class KinematicController implements IKinematicController {
  // State for high-level targets (the "skeleton")
  private baseState: JointStateRecord = {} as JointStateRecord;
  // State for dynamic motion deltas (the "gesture")
  private motionState: JointStateRecord = {} as JointStateRecord;

  private currentTarget: ArmTarget = {};
  private activeDelta: MotionDelta | null = null;

  // Configuration - tuned for natural sign language cadence
  private baseStiffness = 110;
  private baseDamping = 24;
  private motionStiffness = 240;
  private motionDamping = 34;

  constructor() {
    this.initializeStates();
  }

  private initializeStates() {
    const keys: Array<keyof JointStateRecord> = [
      "rArmX",
      "rArmY",
      "rArmZ",
      "rForeX",
      "rForeY",
      "rForeZ",
      "rHandX",
      "rHandY",
      "rHandZ",
      "lArmX",
      "lArmY",
      "lArmZ",
      "lForeX",
      "lForeY",
      "lForeZ",
      "lHandX",
      "lHandY",
      "lHandZ",
    ];
    for (const key of keys) {
      const rest = (SIGNING_REST as Record<string, number>)[key] ?? 0;
      this.baseState[key] = { value: rest, velocity: 0 };
      this.motionState[key] = { value: 0, velocity: 0 };
    }
  }

  setTarget(target: ArmTarget) {
    this.currentTarget = target;
  }

  setMotionDelta(delta: MotionDelta) {
    this.activeDelta = delta;
  }

  snapToTarget(target: ArmTarget) {
    this.currentTarget = target;
    const t = target;

    // Snap base state
    this.baseState.rArmX.value = t.rArmX ?? SIGNING_REST.rArmX;
    this.baseState.rArmY.value = t.rArmY ?? SIGNING_REST.rArmY;
    this.baseState.rArmZ.value = t.rArmZ ?? SIGNING_REST.rArmZ;
    this.baseState.rForeX.value = t.rForeX ?? SIGNING_REST.rForeX;
    this.baseState.rForeY.value = t.rForeY ?? SIGNING_REST.rForeY;
    this.baseState.rForeZ.value = t.rForeZ ?? SIGNING_REST.rForeZ;
    this.baseState.rHandX.value = t.rHandX ?? SIGNING_REST.rHandX;

    this.baseState.lArmX.value = t.lArmX ?? SIGNING_REST.lArmX;
    this.baseState.lArmY.value = t.lArmY ?? SIGNING_REST.lArmY;
    this.baseState.lArmZ.value = t.lArmZ ?? SIGNING_REST.lArmZ;
    this.baseState.lForeX.value = t.lForeX ?? SIGNING_REST.lForeX;
    this.baseState.lForeY.value = t.lForeY ?? SIGNING_REST.lForeY;
    this.baseState.lForeZ.value = t.lForeZ ?? SIGNING_REST.lForeZ;
    this.baseState.lHandX.value = t.lHandX ?? SIGNING_REST.lHandX;

    // Reset all velocities
    for (const key in this.baseState) {
      this.baseState[key as keyof JointStateRecord].velocity = 0;
      this.motionState[key as keyof JointStateRecord].velocity = 0;
    }
  }

  solve(dtMs: number): KinematicPose {
    // Cap dt to prevent numerical instability during large jumps (e.g. tab backgrounding)
    const dt = Math.min(dtMs, 100) / 1000;

    if (dt <= 0) return this.synthesize();

    // ─── 1. Update Base Pose Layer ──────────────────────────────────────────
    // Smoothly follows the high-level intent; falls back to signing rest when unspecified.
    const t = this.currentTarget;
    this.updateSpring(
      this.baseState,
      "rArmX",
      t.rArmX ?? SIGNING_REST.rArmX,
      dt,
      this.baseStiffness,
      this.baseDamping,
    );
    this.updateSpring(
      this.baseState,
      "rArmY",
      t.rArmY ?? SIGNING_REST.rArmY,
      dt,
      this.baseStiffness,
      this.baseDamping,
    );
    this.updateSpring(
      this.baseState,
      "rArmZ",
      t.rArmZ ?? SIGNING_REST.rArmZ,
      dt,
      this.baseStiffness,
      this.baseDamping,
    );
    this.updateSpring(
      this.baseState,
      "rForeX",
      t.rForeX ?? SIGNING_REST.rForeX,
      dt,
      this.baseStiffness,
      this.baseDamping,
    );
    this.updateSpring(
      this.baseState,
      "rForeY",
      t.rForeY ?? SIGNING_REST.rForeY,
      dt,
      this.baseStiffness,
      this.baseDamping,
    );
    this.updateSpring(
      this.baseState,
      "rForeZ",
      t.rForeZ ?? SIGNING_REST.rForeZ,
      dt,
      this.baseStiffness,
      this.baseDamping,
    );
    this.updateSpring(
      this.baseState,
      "rHandX",
      t.rHandX ?? SIGNING_REST.rHandX,
      dt,
      this.baseStiffness,
      this.baseDamping,
    );

    this.updateSpring(
      this.baseState,
      "lArmX",
      t.lArmX ?? SIGNING_REST.lArmX,
      dt,
      this.baseStiffness,
      this.baseDamping,
    );
    this.updateSpring(
      this.baseState,
      "lArmY",
      t.lArmY ?? SIGNING_REST.lArmY,
      dt,
      this.baseStiffness,
      this.baseDamping,
    );
    this.updateSpring(
      this.baseState,
      "lArmZ",
      t.lArmZ ?? SIGNING_REST.lArmZ,
      dt,
      this.baseStiffness,
      this.baseDamping,
    );
    this.updateSpring(
      this.baseState,
      "lForeX",
      t.lForeX ?? SIGNING_REST.lForeX,
      dt,
      this.baseStiffness,
      this.baseDamping,
    );
    this.updateSpring(
      this.baseState,
      "lForeY",
      t.lForeY ?? SIGNING_REST.lForeY,
      dt,
      this.baseStiffness,
      this.baseDamping,
    );
    this.updateSpring(
      this.baseState,
      "lForeZ",
      t.lForeZ ?? SIGNING_REST.lForeZ,
      dt,
      this.baseStiffness,
      this.baseDamping,
    );
    this.updateSpring(
      this.baseState,
      "lHandX",
      t.lHandX ?? SIGNING_REST.lHandX,
      dt,
      this.baseStiffness,
      this.baseDamping,
    );

    // ─── 2. Update Motion Delta Layer ───────────────────────────────────────
    // Smooths the high-frequency trajectory.
    const d = this.activeDelta;
    this.updateSpring(
      this.motionState,
      "rArmX",
      d?.rArmXDelta ?? 0,
      dt,
      this.motionStiffness,
      this.motionDamping,
    );
    this.updateSpring(
      this.motionState,
      "rArmY",
      d?.rArmYDelta ?? 0,
      dt,
      this.motionStiffness,
      this.motionDamping,
    );
    this.updateSpring(
      this.motionState,
      "rArmZ",
      d?.rArmZDelta ?? 0,
      dt,
      this.motionStiffness,
      this.motionDamping,
    );
    this.updateSpring(
      this.motionState,
      "rForeY",
      d?.rForeYDelta ?? 0,
      dt,
      this.motionStiffness,
      this.motionDamping,
    );
    this.updateSpring(
      this.motionState,
      "rForeZ",
      d?.rForeZDelta ?? 0,
      dt,
      this.motionStiffness,
      this.motionDamping,
    );
    this.updateSpring(
      this.motionState,
      "rHandX",
      d?.rHandXDelta ?? 0,
      dt,
      this.motionStiffness,
      this.motionDamping,
    );
    this.updateSpring(
      this.motionState,
      "rHandY",
      d?.rHandYDelta ?? 0,
      dt,
      this.motionStiffness,
      this.motionDamping,
    );
    this.updateSpring(
      this.motionState,
      "rHandZ",
      d?.rHandZDelta ?? 0,
      dt,
      this.motionStiffness,
      this.motionDamping,
    );

    this.updateSpring(
      this.motionState,
      "lArmX",
      d?.lArmXDelta ?? 0,
      dt,
      this.motionStiffness,
      this.motionDamping,
    );
    this.updateSpring(
      this.motionState,
      "lArmY",
      d?.lArmYDelta ?? 0,
      dt,
      this.motionStiffness,
      this.motionDamping,
    );
    this.updateSpring(
      this.motionState,
      "lArmZ",
      d?.lArmZDelta ?? 0,
      dt,
      this.motionStiffness,
      this.motionDamping,
    );
    this.updateSpring(
      this.motionState,
      "lForeY",
      d?.lForeYDelta ?? 0,
      dt,
      this.motionStiffness,
      this.motionDamping,
    );
    this.updateSpring(
      this.motionState,
      "lForeZ",
      d?.lForeZDelta ?? 0,
      dt,
      this.motionStiffness,
      this.motionDamping,
    );
    this.updateSpring(
      this.motionState,
      "lHandX",
      d?.lHandXDelta ?? 0,
      dt,
      this.motionStiffness,
      this.motionDamping,
    );
    this.updateSpring(
      this.motionState,
      "lHandY",
      d?.lHandYDelta ?? 0,
      dt,
      this.motionStiffness,
      this.motionDamping,
    );
    this.updateSpring(
      this.motionState,
      "lHandZ",
      d?.lHandZDelta ?? 0,
      dt,
      this.motionStiffness,
      this.motionDamping,
    );

    return this.synthesize();
  }

  private synthesize(): KinematicPose {
    const b = this.baseState;
    const m = this.motionState;
    // Layer synthesis: Base rotation + Motion delta
    return {
      rArm: {
        x: b.rArmX.value + m.rArmX.value,
        y: b.rArmY.value + m.rArmY.value,
        z: b.rArmZ.value + m.rArmZ.value,
      },
      rFore: {
        x: b.rForeX.value + m.rForeX.value,
        y: b.rForeY.value + m.rForeY.value,
        z: b.rForeZ.value + m.rForeZ.value,
      },
      rHand: {
        x: b.rHandX.value + m.rHandX.value,
        y: b.rHandY.value + m.rHandY.value,
        z: b.rHandZ.value + m.rHandZ.value,
      },
      lArm: {
        x: b.lArmX.value + m.lArmX.value,
        y: b.lArmY.value + m.lArmY.value,
        z: b.lArmZ.value + m.lArmZ.value,
      },
      lFore: {
        x: b.lForeX.value + m.lForeX.value,
        y: b.lForeY.value + m.lForeY.value,
        z: b.lForeZ.value + m.lForeZ.value,
      },
      lHand: {
        x: b.lHandX.value + m.lHandX.value,
        y: b.lHandY.value + m.lHandY.value,
        z: b.lHandZ.value + m.lHandZ.value,
      },
    };
  }

  private updateSpring(
    state: JointStateRecord,
    key: keyof JointStateRecord,
    target: number,
    dt: number,
    stiffness: number,
    damping: number,
  ) {
    const s = state[key];
    const [nextVal, nextVel] = springStep(s.value, s.velocity, target, dt, stiffness, damping);
    s.value = nextVal;
    s.velocity = nextVel;
  }

  reset() {
    this.initializeStates();
  }
}
