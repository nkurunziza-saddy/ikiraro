import { type RefObject, useMemo, useRef } from "react";
import { useFrame, useGraph } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  REST_POSE,
  type Handshape,
  computeMotionDelta,
  type MotionDelta,
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
const SIGN = {
  rArmX: 0.78,
  rArmZ: -0.55,
  rArmY: 0.35,
  rForeX: 0.0,
  rForeZ: -1.55,
  rForeY: 0.55,
  rHandX: -0.25,
  rHandY: 0.0,
  rHandZ: 0.0,
  lArmX: 0.78,
  lArmZ: 0.55,
  lArmY: -0.35,
  lForeX: 0.0,
  lForeZ: 1.55,
  lForeY: -0.55,
  lHandX: -0.25,
  lHandY: 0.0,
  lHandZ: 0.0,
};
type ArmPose = {
  rArmX: number;
  rArmZ: number;
  rArmY: number;
  rForeX: number;
  rForeZ: number;
  rForeY: number;
  rHandX: number;
  rHandY: number;
  rHandZ: number;
  lArmX: number;
  lArmZ: number;
  lArmY: number;
  lForeX: number;
  lForeZ: number;
  lForeY: number;
  lHandX: number;
  lHandY: number;
  lHandZ: number;
};
const ARM_KEYS = [
  "rArmX",
  "rArmZ",
  "rArmY",
  "rForeX",
  "rForeZ",
  "rForeY",
  "rHandX",
  "rHandY",
  "rHandZ",
  "lArmX",
  "lArmZ",
  "lArmY",
  "lForeX",
  "lForeZ",
  "lForeY",
  "lHandX",
  "lHandY",
  "lHandZ",
] as const satisfies readonly (keyof ArmPose)[];
const cloneArmPose = (pose: ArmPose): ArmPose => ({ ...pose });
const zeroArmPose = (): ArmPose => ({
  rArmX: 0,
  rArmZ: 0,
  rArmY: 0,
  rForeX: 0,
  rForeZ: 0,
  rForeY: 0,
  rHandX: 0,
  rHandY: 0,
  rHandZ: 0,
  lArmX: 0,
  lArmZ: 0,
  lArmY: 0,
  lForeX: 0,
  lForeZ: 0,
  lForeY: 0,
  lHandX: 0,
  lHandY: 0,
  lHandZ: 0,
});
const resolveArmPose = (armTarget: ArmTarget | null): ArmPose => ({
  rArmX: armTarget?.rArmX ?? SIGN.rArmX,
  rArmZ: armTarget?.rArmZ ?? SIGN.rArmZ,
  rArmY: armTarget?.rArmY ?? SIGN.rArmY,
  rForeX: armTarget?.rForeX ?? SIGN.rForeX,
  rForeZ: armTarget?.rForeZ ?? SIGN.rForeZ,
  rForeY: armTarget?.rForeY ?? SIGN.rForeY,
  rHandX: armTarget?.rHandX ?? SIGN.rHandX,
  rHandY: SIGN.rHandY,
  rHandZ: SIGN.rHandZ,
  lArmX: armTarget?.lArmX ?? SIGN.lArmX,
  lArmZ: armTarget?.lArmZ ?? SIGN.lArmZ,
  lArmY: armTarget?.lArmY ?? SIGN.lArmY,
  lForeX: armTarget?.lForeX ?? SIGN.lForeX,
  lForeZ: armTarget?.lForeZ ?? SIGN.lForeZ,
  lForeY: armTarget?.lForeY ?? SIGN.lForeY,
  lHandX: armTarget?.lHandX ?? SIGN.lHandX,
  lHandY: SIGN.lHandY,
  lHandZ: SIGN.lHandZ,
});
const resolveMotionPose = (motionDelta: MotionDelta, motionScale: number): ArmPose => ({
  rArmX: motionDelta.rArmXDelta * motionScale,
  rArmY: (motionDelta.rArmYDelta ?? 0) * motionScale,
  rArmZ: motionDelta.rArmZDelta * motionScale,
  rForeX: 0,
  rForeZ: motionDelta.rForeZDelta * motionScale,
  rForeY: motionDelta.rForeYDelta * motionScale,
  rHandX: (motionDelta.rHandXDelta ?? 0) * motionScale,
  rHandY: (motionDelta.rHandYDelta ?? 0) * motionScale,
  rHandZ: (motionDelta.rHandZDelta ?? 0) * motionScale,
  lArmX: (motionDelta.lArmXDelta ?? 0) * motionScale,
  lArmY: (motionDelta.lArmYDelta ?? 0) * motionScale,
  lArmZ: (motionDelta.lArmZDelta ?? 0) * motionScale,
  lForeX: 0,
  lForeZ: (motionDelta.lForeZDelta ?? 0) * motionScale,
  lForeY: (motionDelta.lForeYDelta ?? 0) * motionScale,
  lHandX: (motionDelta.lHandXDelta ?? 0) * motionScale,
  lHandY: (motionDelta.lHandYDelta ?? 0) * motionScale,
  lHandZ: (motionDelta.lHandZDelta ?? 0) * motionScale,
});
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

  const scene = useMemo(() => SkeletonUtils.clone(rawScene) as THREE.Group, [rawScene]);
  const { nodes } = useGraph(scene);

  const stateRef = useRef(new Float32Array(40));
  const armPoseRef = useRef({
    values: cloneArmPose(SIGN),
    velocities: zeroArmPose(),
  });
  const motionPoseRef = useRef({
    values: zeroArmPose(),
    velocities: zeroArmPose(),
  });
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
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const activeRef = useRef(active);
  activeRef.current = active;

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

    for (const [k, v] of Object.entries(bones)) {
      if (v) bindQuatsRef.current[k] = v.quaternion.clone();
    }

    if (bones.Hips) bones.Hips.userData.restY = bones.Hips.position.y;
  }

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

    const [nextP, nextV] = springStep(s[38]!, s[39]!, activeRef.current ? 1 : 0, dt, 80, 18);
    s[38] = nextP;
    s[39] = nextV;
    const k = Math.max(0, Math.min(1, s[38]!));
    const ek = k * k * (3 - 2 * k);

    const rawRamp = Math.min(ek * 2, 1);
    const motionScale = rawRamp * rawRamp * (3 - 2 * rawRamp);

    const idleGain = 1 - ek * 0.7;

    const breathPhase = t * 1.45;
    const breath = Math.sin(breathPhase) * 0.55 + Math.sin(breathPhase * 2 + 0.4) * 0.12;

    const swayML = Math.sin(t * 0.18 + 0.7) * 0.65 + Math.sin(t * 0.41 + 2.3) * 0.18;
    const swayAP = Math.cos(t * 0.13) * 0.55 + Math.sin(t * 0.33 + 1.1) * 0.15;

    setDelta("Hips", swayAP * 0.01 * idleGain, swayML * 0.02 * idleGain, swayML * 0.006 * idleGain);
    if (b.Hips) {
      b.Hips.position.y = (b.Hips.userData.restY as number) + breath * 0.045 * idleGain;
    }

    setDelta("Spine", breath * 0.02 + 0.012, 0, swayML * -0.005 * idleGain);
    setDelta("Spine1", breath * 0.014, 0, swayML * 0.006 * idleGain);
    setDelta("Spine2", breath * 0.006, 0, swayML * -0.012 * idleGain);

    setDelta("Neck", -breath * 0.005 - 0.04, 0, 0);

    setDelta("Head", 0.035, 0, -swayML * 0.006 * idleGain);

    const armSway = 0.03 * idleGain;
    const swayR = Math.sin(t * 0.55) * armSway;
    const swayL = Math.sin(t * 0.55 + 0.3) * armSway;

    const frame = signFrameRef?.current;
    const armT = frame?.armTarget ?? null;
    const motion = frame?.motion ?? "none";
    const motionProgress = frame?.progress ?? 0;
    const md = computeMotionDelta(motion, motionProgress);

    const targetArmPose = resolveArmPose(armT);
    const armSpring = armPoseRef.current;
    for (const key of ARM_KEYS) {
      const [nextValue, nextVelocity] = springStep(
        armSpring.values[key],
        armSpring.velocities[key],
        targetArmPose[key],
        dt,
        95,
        20,
      );
      armSpring.values[key] = nextValue;
      armSpring.velocities[key] = nextVelocity;
    }
    const armPose = armSpring.values;
    const targetMotionPose = resolveMotionPose(md, motionScale);
    const motionSpring = motionPoseRef.current;
    for (const key of ARM_KEYS) {
      const [nextValue, nextVelocity] = springStep(
        motionSpring.values[key],
        motionSpring.velocities[key],
        targetMotionPose[key],
        dt,
        240,
        34,
      );
      motionSpring.values[key] = nextValue;
      motionSpring.velocities[key] = nextVelocity;
    }
    const motionPose = motionSpring.values;
    setDelta("RightShoulder", 0, 0, ek * -0.12);
    setDelta("LeftShoulder", 0, 0, ek * 0.12);
    setDelta(
      "RightArm",
      lerp(IDLE.rArmX, armPose.rArmX, ek) + motionPose.rArmX + swayR * 0.6,
      lerp(IDLE.rArmY, armPose.rArmY, ek) + motionPose.rArmY,
      lerp(IDLE.rArmZ, armPose.rArmZ, ek) + motionPose.rArmZ + swayR,
    );
    setDelta(
      "LeftArm",
      lerp(IDLE.lArmX, armPose.lArmX, ek) + motionPose.lArmX + swayL * 0.6,
      lerp(IDLE.lArmY, armPose.lArmY, ek) + motionPose.lArmY,
      lerp(IDLE.lArmZ, armPose.lArmZ, ek) + motionPose.lArmZ - swayL,
    );
    setDelta(
      "RightForeArm",
      lerp(IDLE.rForeX, armPose.rForeX, ek) + motionPose.rForeX,
      lerp(IDLE.rForeY, armPose.rForeY, ek) + motionPose.rForeY,
      lerp(IDLE.rForeZ, armPose.rForeZ, ek) + motionPose.rForeZ,
    );
    setDelta(
      "LeftForeArm",
      lerp(IDLE.lForeX, armPose.lForeX, ek) + motionPose.lForeX,
      lerp(IDLE.lForeY, armPose.lForeY, ek) + motionPose.lForeY,
      lerp(IDLE.lForeZ, armPose.lForeZ, ek) + motionPose.lForeZ,
    );
    setDelta(
      "RightHand",
      lerp(IDLE.rHandX, armPose.rHandX, ek) + motionPose.rHandX,
      motionPose.rHandY,
      motionPose.rHandZ,
    );
    setDelta(
      "LeftHand",
      lerp(IDLE.lHandX, armPose.lHandX, ek) + motionPose.lHandX,
      motionPose.lHandY,
      motionPose.lHandZ,
    );

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
