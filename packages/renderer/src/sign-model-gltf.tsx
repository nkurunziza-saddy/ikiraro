import { springStepStable } from "@ikiraro/engine/math";
import {
  computeMotionDelta,
  type Handshape,
  KinematicController,
  REST_POSE,
} from "@ikiraro/engine/planning";
import { useGLTF } from "@react-three/drei";
import { useFrame, useGraph } from "@react-three/fiber";
import { type RefObject, useMemo, useRef } from "react";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import type { SignFrameState } from "./avatar-viewer";
import { applySigningPose, SIGNING_REFERENCE } from "./rig-motion";

const FACIAL_CHANNELS = [
  "browInnerUp",
  "browDownLeft",
  "browDownRight",
  "mouthSmileLeft",
  "mouthSmileRight",
  "jawOpen",
] as const;
const FACIAL_TARGETS: Record<string, Partial<Record<(typeof FACIAL_CHANNELS)[number], number>>> = {
  neutral: {},
  inquisitive: { browInnerUp: 0.65 },
  assertive: { browDownLeft: 0.45, browDownRight: 0.45 },
  urgent: { browDownLeft: 0.45, browDownRight: 0.45, jawOpen: 0.25 },
  empathetic: { browInnerUp: 0.2, mouthSmileLeft: 0.35, mouthSmileRight: 0.35 },
};

interface SignModelGLTFProps {
  url: string;
  pose?: Handshape;
  poseRef?: RefObject<Handshape>;
  leftPoseRef?: RefObject<Handshape>;
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
  rForeZ: -0.18,
  rForeY: 0.0,
  rHandX: 0.0,
  rHandY: -0.18,
  rHandZ: 0.0,

  lArmX: 1.32,
  lArmZ: 0.18,
  lArmY: 0.0,
  lForeX: 0.0,
  lForeZ: 0.3,
  lForeY: 0.0,
  lHandX: 0.0,
  lHandY: 0.22,
  lHandZ: 0.0,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function SignModelGLTF({
  url,
  pose = REST_POSE,
  poseRef: externalPoseRef,
  leftPoseRef,
  active = false,
  signFrameRef,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: SignModelGLTFProps) {
  const { scene: rawScene } = useGLTF(url);
  // Clone per-instance so useFrame mutations never corrupt the cached original.
  const scene = useMemo(() => {
    const clone = SkeletonUtils.clone(rawScene) as THREE.Group;
    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return clone;
  }, [rawScene]);
  const { nodes } = useGraph(scene);

  // [0-18: joint angles, 19-37: velocities, 38: signProgress, 39: signVelocity]
  const stateRef = useRef(new Float32Array(40));
  const leftStateRef = useRef(new Float32Array(40));
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
    joints.forEach((val, i) => {
      s[i] = val;
      leftStateRef.current[i] = val;
    });
    initialized.current = true;
  }

  const kinematicsRef = useRef(new KinematicController());

  const poseRef = useRef(pose);
  poseRef.current = pose;
  const activeRef = useRef(active);
  activeRef.current = active;

  // Resolve bones once per scene.
  const bonesRef = useRef<Record<string, THREE.Object3D | null> | null>(null);
  const calibrationRef = useRef<Record<string, THREE.Quaternion>>({});
  const bindQuatsRef = useRef<Record<string, THREE.Quaternion>>({});
  const lastSceneRef = useRef<THREE.Group | null>(null);

  if (lastSceneRef.current !== scene) {
    lastSceneRef.current = scene;
    bonesRef.current = null;
    bindQuatsRef.current = {};
    calibrationRef.current = {};
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
      RightForeArm_Twist: findBone("RightForeArm_Twist"),
      LeftForeArm_Twist: findBone("LeftForeArm_Twist"),
      RightHand: findBone("RightHand"),
      LeftHand: findBone("LeftHand"),
      RightHandThumb1: findBone("RightHandThumb1"),
      RightHandThumb2: findBone("RightHandThumb2"),
      RightHandThumb3: findBone("RightHandThumb3"),
    };
    for (const side of ["Right", "Left"]) {
      for (const key of ["Index", "Middle", "Ring", "Pinky"]) {
        for (const joint of [1, 2, 3]) {
          bones[`${side}${key}${joint}`] = findBone(`${side}Hand${key}${joint}`);
        }
      }
      for (const joint of [1, 2, 3]) {
        bones[`${side}HandThumb${joint}`] = findBone(`${side}HandThumb${joint}`);
      }
    }
    bonesRef.current = bones;

    // Capture every controlled bone's bind quaternion.
    for (const [k, v] of Object.entries(bones)) {
      if (v) {
        bindQuatsRef.current[k] = v.quaternion.clone().normalize();
        const q: unknown = v.userData.signingNeutral;
        if (Array.isArray(q) && q.length === 4 && q.every(Number.isFinite))
          calibrationRef.current[k] = new THREE.Quaternion(q[0], q[1], q[2], q[3]).normalize();
      }
    }

    // Stash the Hips' rest Y position.
    if (bones.Hips) bones.Hips.userData.restY = bones.Hips.position.y;
  }

  const facialMeshes = useMemo(() => {
    const meshes: THREE.Mesh[] = [];
    scene.traverse((object) => {
      if (
        object instanceof THREE.Mesh &&
        object.morphTargetDictionary &&
        object.morphTargetInfluences
      )
        meshes.push(object);
    });
    return meshes;
  }, [scene]);

  // Reusable scratch objects.
  const tmpEuler = useMemo(() => new THREE.Euler(0, 0, 0, "XYZ"), []);
  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);
  const wristDelta = useMemo(() => new THREE.Quaternion(), []);
  const wristTwist = useMemo(() => new THREE.Quaternion(), []);
  const halfWristTwist = useMemo(() => new THREE.Quaternion(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
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

    const expression = activeRef.current
      ? (signFrameRef?.current?.expression ?? "neutral")
      : "neutral";
    const facialTargets = FACIAL_TARGETS[expression] ?? FACIAL_TARGETS.neutral!;
    const facialBlend = 1 - Math.exp(-12 * dt);
    for (const mesh of facialMeshes) {
      const dictionary = mesh.morphTargetDictionary!;
      const influences = mesh.morphTargetInfluences!;
      for (const name of FACIAL_CHANNELS) {
        const index = dictionary[name];
        if (index !== undefined)
          influences[index] = lerp(influences[index] ?? 0, facialTargets[name] ?? 0, facialBlend);
      }
    }

    // 1. Sign ⇄ Idle transition
    const [nextP, nextV] = springStepStable(s[38]!, s[39]!, activeRef.current ? 1 : 0, dt, 80, 18);
    s[38] = nextP;
    s[39] = nextV;
    const k = Math.max(0, Math.min(1, s[38]!));
    const ek = k * k * (3 - 2 * k);

    // Idle motion dampens while signing.
    const idleGain = 1 - ek;
    const ls = leftStateRef.current;
    const leftActive =
      activeRef.current && leftPoseRef?.current !== REST_POSE && leftPoseRef?.current != null;
    const [lp, lv] = springStepStable(ls[38]!, ls[39]!, leftActive ? 1 : 0, dt, 80, 18);
    ls[38] = lp;
    ls[39] = lv;
    const lk = Math.max(0, Math.min(1, lp));
    const leftEk = lk * lk * (3 - 2 * lk);

    // 2. Breathing
    const breathPhase = t * 1.45;
    const idleBreathGain = lerp(1, 0.18, ek);
    const breath =
      (Math.sin(breathPhase) * 0.18 + Math.sin(breathPhase * 2 + 0.4) * 0.04) * idleBreathGain;

    // 3. Postural sway
    const swayML = Math.sin(t * 0.18 + 0.7) * 0.65 + Math.sin(t * 0.41 + 2.3) * 0.18;
    const swayAP = Math.cos(t * 0.13) * 0.55 + Math.sin(t * 0.33 + 1.1) * 0.15;

    // 4. Torso chain
    setDelta("Hips", swayAP * 0.01 * idleGain, swayML * 0.02 * idleGain, swayML * 0.006 * idleGain);
    if (b.Hips) {
      b.Hips.position.y = (b.Hips.userData.restY as number) + breath * 0.012 * idleGain;
    }
    setDelta("Spine", breath * 0.02 + 0.012, 0, swayML * -0.005 * idleGain);
    setDelta("Spine1", breath * 0.014, 0, swayML * 0.006 * idleGain);
    setDelta("Spine2", breath * 0.006, 0, swayML * -0.012 * idleGain);
    setDelta("Neck", -breath * 0.005 - 0.04, 0, 0);
    setDelta(
      "Head",
      0.025,
      Math.sin(t * 0.31) * 0.008 * idleGain,
      (-0.025 - swayML * 0.006) * idleGain,
    );

    // Brief, unevenly spaced blinks. Fade them out during signing so these
    // decorative controls do not compete with non-manual expression channels.
    const blinkPhase = t % 11.7;
    const blink =
      Math.max(0, 1 - Math.abs(blinkPhase - 3.4) / 0.13, 1 - Math.abs(blinkPhase - 8.9) / 0.15) *
      idleGain;
    for (const mesh of facialMeshes) {
      for (const name of ["eyeBlinkLeft", "eyeBlinkRight"]) {
        const index = mesh.morphTargetDictionary![name];
        if (index !== undefined) mesh.morphTargetInfluences![index] = blink;
      }
    }

    // 5. Arms: apply kinematic pose
    const armSway = 0.012 * idleGain;
    const swayR = Math.sin(t * 0.55) * armSway;
    const swayL = Math.sin(t * 0.55 + 0.3) * armSway;

    const frame = signFrameRef?.current;

    const kinematics = kinematicsRef.current;
    if (frame) {
      kinematics.setTarget(frame.armTarget ?? {});
      kinematics.setMotionDelta(computeMotionDelta(frame.motion ?? "none", frame.progress ?? 0));
    }
    const kp = kinematics.solve(dt * 1000);

    const calibrated = !!calibrationRef.current.RightArm;
    setDelta("RightShoulder", 0, 0, calibrated ? 0 : ek * -0.12);
    setDelta("LeftShoulder", 0, 0, calibrated ? 0 : leftEk * 0.12);
    const arm = (
      key: string,
      idle: [number, number, number],
      target: { x: number; y: number; z: number },
      weight: number,
    ) => {
      const bone = b[key];
      const bind = bindQuatsRef.current[key];
      if (!bone || !bind) return;
      applySigningPose(
        bone.quaternion,
        bind,
        calibrationRef.current[key],
        idle,
        [target.x, target.y, target.z],
        SIGNING_REFERENCE[key]!,
        weight,
        tmpQuat,
        tmpEuler,
      );
    };
    arm("RightArm", [IDLE.rArmX + swayR * 0.6, IDLE.rArmY, IDLE.rArmZ + swayR], kp.rArm, ek);
    arm("LeftArm", [IDLE.lArmX + swayL * 0.6, IDLE.lArmY, IDLE.lArmZ - swayL], kp.lArm, leftEk);
    arm("RightForeArm", [IDLE.rForeX, IDLE.rForeY, IDLE.rForeZ], kp.rFore, ek);
    arm("LeftForeArm", [IDLE.lForeX, IDLE.lForeY, IDLE.lForeZ], kp.lFore, leftEk);
    arm("RightHand", [IDLE.rHandX, IDLE.rHandY, IDLE.rHandZ], kp.rHand, ek);
    arm("LeftHand", [IDLE.lHandX, IDLE.lHandY, IDLE.lHandZ], kp.lHand, leftEk);

    // glTF does not evaluate Blender bone constraints. Reproduce each
    // forearm twist constraint by extracting the hand's local-Y twist and
    // sharing half of it with the dedicated deformation bone.
    const distributeWristTwist = (twistKey: string, handKey: string) => {
      const twistBone = b[twistKey];
      const handBone = b[handKey];
      const twistBind = bindQuatsRef.current[twistKey];
      const handBind = bindQuatsRef.current[handKey];
      if (!twistBone || !handBone || !twistBind || !handBind) return;

      wristDelta.copy(handBind).invert().multiply(handBone.quaternion).normalize();
      const length = Math.hypot(wristDelta.w, wristDelta.y);
      if (length < 1e-8) wristTwist.identity();
      else wristTwist.set(0, wristDelta.y / length, 0, wristDelta.w / length);
      halfWristTwist.identity().slerp(wristTwist, 0.5);
      twistBone.quaternion.copy(twistBind).multiply(halfWristTwist).normalize();
    };
    distributeWristTwist("RightForeArm_Twist", "RightHand");
    distributeWristTwist("LeftForeArm_Twist", "LeftHand");

    // Independent state for each hand; handshapes use the same flexion convention.
    for (const side of ["Right", "Left"] as const) {
      const p =
        side === "Right"
          ? (externalPoseRef?.current ?? poseRef.current)
          : (leftPoseRef?.current ?? REST_POSE);
      const s = side === "Right" ? stateRef.current : leftStateRef.current;
      const mirror = side === "Right" ? 1 : -1;
      const handWeight = side === "Right" ? ek : leftEk;
      const ajHand = !!calibrationRef.current[`${side}Hand`];
      (["index", "middle", "ring", "pinky"] as const).forEach((name, fi) => {
        const cp = p[name];
        const base = fi * 4;
        const rest = REST_POSE[name];
        const targets = [
          lerp(rest.mcp, cp.mcp, handWeight),
          lerp(rest.pip, cp.pip, handWeight),
          lerp(rest.dip, cp.dip, handWeight),
          lerp(rest.splay, cp.splay, handWeight),
        ];

        // Settle handshape change in ~80ms.
        for (let i = 0; i < 4; i++) {
          const idx = base + i;
          const [nextVal, nextVel] = springStepStable(
            s[idx]!,
            s[19 + idx]!,
            targets[i]!,
            dt,
            2400,
            98,
          );
          s[idx] = nextVal;
          s[19 + idx] = nextVel;
        }

        const fingerKey = name.charAt(0).toUpperCase() + name.slice(1);
        // Imported finger/thumb joints have meaningful bind rotations. Compose
        // flexion in that local frame instead of replacing its Euler axes.
        const spread = ajHand ? [0.1, 0.025, -0.035, -0.1][fi]! : 0;
        setDelta(
          `${side}${fingerKey}1`,
          s[base]! * (ajHand ? 0.8 : 1),
          0,
          (s[base + 3]! + spread) * mirror,
        );
        setDelta(`${side}${fingerKey}2`, s[base + 1]! * (ajHand ? 0.9 : 1), 0, 0);
        setDelta(`${side}${fingerKey}3`, s[base + 2]! * (ajHand ? 0.65 : 1), 0, 0);
      });

      const restThumb = REST_POSE.thumb;
      const thumbTargets = [
        lerp(restThumb.splay, p.thumb.splay, handWeight),
        lerp(restThumb.flex, p.thumb.flex, handWeight),
        lerp(restThumb.curl, p.thumb.curl, handWeight),
      ];
      for (let i = 0; i < 3; i++) {
        const idx = 16 + i;
        const [nextVal, nextVel] = springStepStable(
          s[idx]!,
          s[19 + idx]!,
          thumbTargets[i]!,
          dt,
          2400,
          98,
        );
        s[idx] = nextVal;
        s[19 + idx] = nextVel;
      }

      setDelta(`${side}HandThumb1`, 0, 0, (ajHand ? 0.3 + s[16]! * 0.8 : s[16]!) * mirror);
      setDelta(`${side}HandThumb2`, s[17]! * (ajHand ? 0.6 : 1), 0, 0);
      setDelta(`${side}HandThumb3`, s[18]! * (ajHand ? 0.7 : 1), 0, 0);
    }
  });

  return (
    <group scale={scale} position={position} rotation={rotation}>
      <primitive object={scene} />
    </group>
  );
}
