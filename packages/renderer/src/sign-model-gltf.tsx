import { type RefObject, useMemo, useRef } from "react";
import { useFrame, useGraph } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  REST_POSE,
  type Handshape,
  KinematicController,
  computeMotionDelta,
} from "@ikiraro/engine/planning";
import type { ArmTarget, MotionType } from "@ikiraro/engine/types";
import { springStep } from "@ikiraro/engine/math";

type SignFrameState = {
  motion: MotionType;
  progress: number;
  armTarget: ArmTarget | null;
};

interface SignModelGLTFProps {
  url: string;
  pose?: Handshape;
  active?: boolean;
  signFrameRef?: RefObject<SignFrameState | null>;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

// Mixamo arm-pose library
const IDLE = {
  rArmX: 1.32,
  rArmZ: -0.18,
  rArmY: 0.0,
  rForeX: 0.0,
  rForeZ: -0.04,
  rForeY: 0.0,
  rHandX: 0.0,
  rHandY: 0.0,
  rHandZ: 0.0,

  lArmX: 1.32,
  lArmZ: 0.18,
  lArmY: 0.0,
  lForeX: 0.0,
  lForeZ: 0.04,
  lForeY: 0.0,
  lHandX: 0.0,
  lHandY: 0.0,
  lHandZ: 0.0,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function SignModelGLTF({
  url,
  pose = REST_POSE,
  active = false,
  signFrameRef,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: SignModelGLTFProps) {
  const { scene: rawScene } = useGLTF(url);
  // Clone per-instance so useFrame mutations never corrupt the cached original.
  const scene = useMemo(() => SkeletonUtils.clone(rawScene) as THREE.Group, [rawScene]);
  const { nodes } = useGraph(scene);

  // [0-18: joint angles, 19-37: velocities, 38: signProgress, 39: signVelocity]
  const stateRef = useRef(new Float32Array(40));
  const initialized = useRef(false);

  if (!initialized.current) {
    const s = stateRef.current;
    const joints = [
      REST_POSE.index.mcp,
      REST_POSE.index.pip,
      REST_POSE.index.dip,
      REST_POSE.index.splay,
      REST_POSE.middle.mcp,
      REST_POSE.middle.pip,
      REST_POSE.middle.dip,
      REST_POSE.middle.splay,
      REST_POSE.ring.mcp,
      REST_POSE.ring.pip,
      REST_POSE.ring.dip,
      REST_POSE.ring.splay,
      REST_POSE.pinky.mcp,
      REST_POSE.pinky.pip,
      REST_POSE.pinky.dip,
      REST_POSE.pinky.splay,
      REST_POSE.thumb.splay,
      REST_POSE.thumb.flex,
      REST_POSE.thumb.curl,
    ];
    joints.forEach((val, i) => (s[i] = val));
    initialized.current = true;
  }

  const kinematicsRef = useRef(new KinematicController());

  const poseRef = useRef(pose);
  poseRef.current = pose;
  const activeRef = useRef(active);
  activeRef.current = active;

  // Resolve bones once per scene.
  const bonesRef = useRef<Record<string, THREE.Object3D | null> | null>(null);
  const bindQuatsRef = useRef<Record<string, THREE.Quaternion>>({});
  const lastSceneRef = useRef<THREE.Group | null>(null);

  if (lastSceneRef.current !== scene) {
    lastSceneRef.current = scene;
    bonesRef.current = null;
    bindQuatsRef.current = {};
  }

  if (!bonesRef.current) {
    const findBone = (baseName: string): THREE.Object3D | null => {
      const variants = [
        `mixamorig:${baseName}`,
        `mixamorig${baseName}`,
        baseName,
        baseName.charAt(0).toLowerCase() + baseName.slice(1),
      ];
      for (const v of variants) {
        const node = nodes[v];
        if (node instanceof THREE.Object3D) return node;
      }
      return null;
    };

    const bones: Record<string, THREE.Object3D | null> = {
      Hips: findBone("Hips"),
      Spine: findBone("Spine"),
      Spine1: findBone("Spine1"),
      Spine2: findBone("Spine2"),
      Neck: findBone("Neck"),
      Head: findBone("Head"),
      RightShoulder: findBone("RightShoulder"),
      LeftShoulder: findBone("LeftShoulder"),
      RightArm: findBone("RightArm"),
      LeftArm: findBone("LeftArm"),
      RightForeArm: findBone("RightForeArm"),
      LeftForeArm: findBone("LeftForeArm"),
      RightHand: findBone("RightHand"),
      LeftHand: findBone("LeftHand"),
      RightHandThumb1: findBone("RightHandThumb1"),
      RightHandThumb2: findBone("RightHandThumb2"),
      RightHandThumb3: findBone("RightHandThumb3"),
    };
    for (const key of ["Index", "Middle", "Ring", "Pinky"]) {
      bones[`Right${key}1`] = findBone(`RightHand${key}1`);
      bones[`Right${key}2`] = findBone(`RightHand${key}2`);
      bones[`Right${key}3`] = findBone(`RightHand${key}3`);
    }
    bonesRef.current = bones;

    // Capture every controlled bone's bind quaternion.
    for (const [k, v] of Object.entries(bones)) {
      if (v) bindQuatsRef.current[k] = v.quaternion.clone();
    }

    // Stash the Hips' rest Y position.
    if (bones.Hips) bones.Hips.userData.restY = bones.Hips.position.y;
  }

  // Reusable scratch objects.
  const tmpEuler = useMemo(() => new THREE.Euler(0, 0, 0, "XYZ"), []);
  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const p = poseRef.current;
    const s = stateRef.current;
    const b = bonesRef.current!;
    const t = state.clock.getElapsedTime();

    const setDelta = (key: string, x: number, y: number, z: number) => {
      const bone = b[key];
      const bind = bindQuatsRef.current[key];
      if (!bone || !bind) return;
      tmpEuler.set(x, y, z, "XYZ");
      tmpQuat.setFromEuler(tmpEuler);
      bone.quaternion.copy(bind).multiply(tmpQuat);
    };

    // ─── 1. Sign ⇄ Idle transition ─────────────────────────────────────────
    const [nextP, nextV] = springStep(s[38]!, s[39]!, activeRef.current ? 1 : 0, dt, 80, 18);
    s[38] = nextP;
    s[39] = nextV;
    const k = Math.max(0, Math.min(1, s[38]!));
    const ek = k * k * (3 - 2 * k);

    // Idle motion dampens while signing.
    const idleGain = 1 - ek * 0.7;

    // ─── 2. Breathing ───────────────────────────────────────────────────────
    const breathPhase = t * 1.45;
    const breath = Math.sin(breathPhase) * 0.55 + Math.sin(breathPhase * 2 + 0.4) * 0.12;

    // ─── 3. Postural sway ───────────────────────────────────────────────────
    const swayML = Math.sin(t * 0.18 + 0.7) * 0.65 + Math.sin(t * 0.41 + 2.3) * 0.18;
    const swayAP = Math.cos(t * 0.13) * 0.55 + Math.sin(t * 0.33 + 1.1) * 0.15;

    // ─── 4. Torso chain ─────────────────────────────────────────────────────
    setDelta("Hips", swayAP * 0.01 * idleGain, swayML * 0.02 * idleGain, swayML * 0.006 * idleGain);
    if (b.Hips) {
      b.Hips.position.y = (b.Hips.userData.restY as number) + breath * 0.045 * idleGain;
    }
    setDelta("Spine", breath * 0.02 + 0.012, 0, swayML * -0.005 * idleGain);
    setDelta("Spine1", breath * 0.014, 0, swayML * 0.006 * idleGain);
    setDelta("Spine2", breath * 0.006, 0, swayML * -0.012 * idleGain);
    setDelta("Neck", -breath * 0.005 - 0.04, 0, 0);
    setDelta("Head", 0.035, 0, -swayML * 0.006 * idleGain);

    // ─── 5. Arms: apply deep KinematicPose from engine ───────────────────────
    const armSway = 0.03 * idleGain;
    const swayR = Math.sin(t * 0.55) * armSway;
    const swayL = Math.sin(t * 0.55 + 0.3) * armSway;

    const frame = signFrameRef?.current;

    // Evaluate kinematics inside the render loop for frame-perfect smoothing
    const kinematics = kinematicsRef.current;
    if (frame) {
      kinematics.setTarget(frame.armTarget ?? {});
      kinematics.setMotionDelta(computeMotionDelta(frame.motion ?? "none", frame.progress ?? 0));
    }
    const kp = kinematics.solve(dt * 1000);

    setDelta("RightShoulder", 0, 0, ek * -0.12);
    setDelta("LeftShoulder", 0, 0, ek * 0.12);

    if (kp) {
      setDelta(
        "RightArm",
        lerp(IDLE.rArmX, kp.rArm.x, ek) + swayR * 0.6,
        lerp(IDLE.rArmY, kp.rArm.y, ek),
        lerp(IDLE.rArmZ, kp.rArm.z, ek) + swayR,
      );
      setDelta(
        "LeftArm",
        lerp(IDLE.lArmX, kp.lArm.x, ek) + swayL * 0.6,
        lerp(IDLE.lArmY, kp.lArm.y, ek),
        lerp(IDLE.lArmZ, kp.lArm.z, ek) - swayL,
      );
      setDelta(
        "RightForeArm",
        lerp(IDLE.rForeX, kp.rFore.x, ek),
        lerp(IDLE.rForeY, kp.rFore.y, ek),
        lerp(IDLE.rForeZ, kp.rFore.z, ek),
      );
      setDelta(
        "LeftForeArm",
        lerp(IDLE.lForeX, kp.lFore.x, ek),
        lerp(IDLE.lForeY, kp.lFore.y, ek),
        lerp(IDLE.lForeZ, kp.lFore.z, ek),
      );
      setDelta(
        "RightHand",
        lerp(IDLE.rHandX, kp.rHand.x, ek),
        lerp(IDLE.rHandY, kp.rHand.y, ek),
        lerp(IDLE.rHandZ, kp.rHand.z, ek),
      );
      setDelta(
        "LeftHand",
        lerp(IDLE.lHandX, kp.lHand.x, ek),
        lerp(IDLE.lHandY, kp.lHand.y, ek),
        lerp(IDLE.lHandZ, kp.lHand.z, ek),
      );
    } else {
      setDelta("RightArm", IDLE.rArmX + swayR * 0.6, IDLE.rArmY, IDLE.rArmZ + swayR);
      setDelta("LeftArm", IDLE.lArmX + swayL * 0.6, IDLE.lArmY, IDLE.lArmZ - swayL);
      setDelta("RightForeArm", IDLE.rForeX, IDLE.rForeY, IDLE.rForeZ);
      setDelta("LeftForeArm", IDLE.lForeX, IDLE.lForeY, IDLE.lForeZ);
      setDelta("RightHand", IDLE.rHandX, IDLE.rHandY, IDLE.rHandZ);
      setDelta("LeftHand", IDLE.lHandX, IDLE.lHandY, IDLE.lHandZ);
    }

    // ─── 6. Fingers ────────────────────────────────────────────────────────
    (["index", "middle", "ring", "pinky"] as const).forEach((name, fi) => {
      const cp = p[name];
      const base = fi * 4;
      const rest = REST_POSE[name];
      const targets = [
        lerp(rest.mcp, cp.mcp, ek),
        lerp(rest.pip, cp.pip, ek),
        lerp(rest.dip, cp.dip, ek),
        lerp(rest.splay, cp.splay, ek),
      ];

      for (let i = 0; i < 4; i++) {
        const idx = base + i;
        const [nextVal, nextVel] = springStep(s[idx]!, s[19 + idx]!, targets[i]!, dt, 240, 32);
        s[idx] = nextVal;
        s[19 + idx] = nextVel;
      }

      const fingerKey = name.charAt(0).toUpperCase() + name.slice(1);
      const mcp = b[`Right${fingerKey}1`];
      const pip = b[`Right${fingerKey}2`];
      const dip = b[`Right${fingerKey}3`];

      if (mcp) {
        mcp.rotation.x = s[base + 0]!;
        mcp.rotation.z = s[base + 3]!;
      }
      if (pip) pip.rotation.x = s[base + 1]!;
      if (dip) dip.rotation.x = s[base + 2]!;
    });

    const restThumb = REST_POSE.thumb;
    const thumbTargets = [
      lerp(restThumb.splay, p.thumb.splay, ek),
      lerp(restThumb.flex, p.thumb.flex, ek),
      lerp(restThumb.curl, p.thumb.curl, ek),
    ];
    for (let i = 0; i < 3; i++) {
      const idx = 16 + i;
      const [nextVal, nextVel] = springStep(s[idx]!, s[19 + idx]!, thumbTargets[i]!, dt, 200, 28);
      s[idx] = nextVal;
      s[19 + idx] = nextVel;
    }

    if (b.RightHandThumb1) b.RightHandThumb1.rotation.z = s[16]!;
    if (b.RightHandThumb2) b.RightHandThumb2.rotation.x = s[17]!;
    if (b.RightHandThumb3) b.RightHandThumb3.rotation.x = s[18]!;
  });

  return (
    <group scale={scale} position={position} rotation={rotation}>
      <primitive object={scene} />
    </group>
  );
}
