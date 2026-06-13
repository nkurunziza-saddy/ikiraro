import { describe, expect, it } from "vitest";
import { KinematicController } from "./controller";

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
};

describe("KinematicController", () => {
  it("initial pose returns rest values with motion at 0", () => {
    const controller = new KinematicController();
    const pose = controller.solve(0);
    expect(pose.rArm.x).toBeCloseTo(SIGNING_REST.rArmX);
    expect(pose.rArm.z).toBeCloseTo(SIGNING_REST.rArmZ);
    expect(pose.rHand.y).toBe(0); // Motion-only joint at rest
  });

  it("converges toward target over time", () => {
    const controller = new KinematicController();
    controller.setTarget({ rArmX: 1.5 });
    for (let i = 0; i < 600; i++) {
      controller.solve(16);
    }
    const pose = controller.solve(16);
    expect(pose.rArm.x).toBeCloseTo(1.5, 2);
    // Unspecified joints converge to SIGNING_REST
    expect(pose.rArm.z).toBeCloseTo(SIGNING_REST.rArmZ, 2);
  });

  it("caps dt to prevent explosion", () => {
    const c1 = new KinematicController();
    const c2 = new KinematicController();
    c1.setTarget({ rArmX: 1.5 });
    c2.setTarget({ rArmX: 1.5 });

    const p1 = c1.solve(100);
    const p2 = c2.solve(10_000);

    expect(p1.rArm.x).toBe(p2.rArm.x);
    expect(Number.isFinite(p1.rArm.x)).toBe(true);
  });

  it("snapToTarget immediately changes pose and zeroes velocity", () => {
    const controller = new KinematicController();
    controller.snapToTarget({ rArmX: 2 });

    // Immediate solve
    let pose = controller.solve(0);
    expect(pose.rArm.x).toBe(2);

    // Subsequent solve shouldn't overshoot wildly
    pose = controller.solve(16);
    expect(Math.abs(pose.rArm.x - 2)).toBeLessThan(0.05);
  });

  it("synthesizes base state and motion layer", () => {
    const controller = new KinematicController();
    controller.snapToTarget({}); // Sets base at rest, velocity zero

    controller.setMotionDelta({
      rArmXDelta: 0,
      rArmZDelta: 0,
      rForeYDelta: 0,
      rForeZDelta: 0,
      rHandYDelta: 0.4,
    });
    for (let i = 0; i < 600; i++) {
      controller.solve(16);
    }
    const pose = controller.solve(16);
    expect(pose.rHand.y).toBeCloseTo(0.4, 2);
    expect(pose.rHand.x).toBeCloseTo(SIGNING_REST.rHandX, 2);
  });

  it("characterization: motion layer does not drive rForeX/lForeX", () => {
    const controller = new KinematicController();
    controller.snapToTarget({});

    // Attempt to drive rForeX via motion delta
    controller.setMotionDelta({
      rArmXDelta: 0,
      rArmZDelta: 0,
      rForeYDelta: 0,
      rForeZDelta: 0,
      rForeXDelta: 9,
    } as any);

    for (let i = 0; i < 600; i++) {
      controller.solve(16);
    }
    const pose = controller.solve(16);
    // rFore.x remains at base layer
    expect(pose.rFore.x).toBeCloseTo(SIGNING_REST.rForeX, 2);
  });

  it("reset restores controller to initial state", () => {
    const controller = new KinematicController();
    controller.setTarget({ rArmX: 2 });
    for (let i = 0; i < 600; i++) {
      controller.solve(16);
    }

    controller.reset();
    const pose = controller.solve(0);
    expect(pose.rArm.x).toBeCloseTo(SIGNING_REST.rArmX);
  });
});
