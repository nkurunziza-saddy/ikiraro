import { readFileSync } from "node:fs";
import * as THREE from "three";
import { describe, expect, it } from "vite-plus/test";
import { applySigningPose, SIGNING_REFERENCE } from "./rig-motion";

const data = readFileSync(
  new URL("../../../apps/web/public/models/avatar-aj.glb", import.meta.url),
);
const gltf = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString()) as {
  nodes: { name?: string; rotation?: number[]; extras?: { signingNeutral?: number[] } }[];
};

const signerData = readFileSync(
  new URL("../../../apps/web/public/models/avatar-aj-signer-v6.glb", import.meta.url),
);
const signerGltf = JSON.parse(
  signerData.subarray(20, 20 + signerData.readUInt32LE(12)).toString(),
) as {
  animations?: { name?: string }[];
  nodes: {
    name?: string;
    extras?: {
      hand_scale?: number;
      ikiraro_avatar?: string;
      ikiraro_visual_revision?: string;
    };
  }[];
};

describe("AJ exported rig calibration", () => {
  it("preserves bind frames at rest and reaches each authored neutral without twisting", () => {
    for (const [key, reference] of Object.entries(SIGNING_REFERENCE)) {
      const node = gltf.nodes.find((n) => n.name === key)!;
      expect(node?.extras?.signingNeutral).toHaveLength(4);
      const bind = new THREE.Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]).normalize();
      const calibration = new THREE.Quaternion()
        .fromArray(node.extras!.signingNeutral!)
        .normalize();
      const output = new THREE.Quaternion();
      for (const weight of [0, 0.25, 0.5, 0.75, 1]) {
        applySigningPose(
          output,
          bind,
          calibration,
          [0, 0, 0],
          reference,
          reference,
          weight,
          new THREE.Quaternion(),
          new THREE.Euler(),
        );
        expect(output.length()).toBeCloseTo(1, 6);
        if (weight === 0) expect(output.angleTo(bind)).toBeLessThan(1e-6);
        if (weight === 1)
          expect(output.angleTo(bind.clone().multiply(calibration))).toBeLessThan(1e-6);
      }
    }
  });
  it("retains wrist trajectory changes after calibration", () => {
    const node = gltf.nodes.find((n) => n.name === "RightHand")!;
    const bind = new THREE.Quaternion().fromArray(node.rotation!).normalize();
    const q = new THREE.Quaternion().fromArray(node.extras!.signingNeutral!).normalize();
    const output = new THREE.Quaternion();
    applySigningPose(
      output,
      bind,
      q,
      [0, 0, 0],
      [0, 0, 0.2],
      [0, 0, 0],
      1,
      new THREE.Quaternion(),
      new THREE.Euler(),
    );
    expect(output.angleTo(bind.clone().multiply(q))).toBeCloseTo(0.2, 5);
  });
});

describe("enhanced AJ signer export", () => {
  it("contains the runtime twist bones and authored idle action", () => {
    const names = new Set(signerGltf.nodes.map((node) => node.name));
    expect(names.has("LeftForeArm_Twist")).toBe(true);
    expect(names.has("RightForeArm_Twist")).toBe(true);
    expect(
      signerGltf.animations?.some((animation) => animation.name === "Signer_Living_Idle"),
    ).toBe(true);
  });

  it("identifies the enhanced signer and its hand scale", () => {
    const armature = signerGltf.nodes.find((node) => node.name === "Aj_Armature");
    expect(armature?.extras?.ikiraro_avatar).toBe("aj-signer-enhanced-v6");
    expect(armature?.extras?.hand_scale).toBeCloseTo(1.12, 6);
  });

  it("contains the visibly revised short-sleeve polo shell", () => {
    const names = new Set(signerGltf.nodes.map((node) => node.name));
    expect(names.has("Aj_Polo_Collar_Left")).toBe(true);
    expect(names.has("Aj_Polo_Collar_Right")).toBe(true);
    expect(names.has("Aj_Polo_Buttons")).toBe(true);
    const body = signerGltf.nodes.find((node) => node.name === "Aj_Body");
    expect(body?.extras?.ikiraro_visual_revision).toBe("v6-short-sleeve-polo");
  });
});
