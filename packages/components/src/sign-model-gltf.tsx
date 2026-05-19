import { useMemo, useRef } from "react";
import { useFrame, useGraph } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { REST_POSE, type Handshape } from "@ikiraro/engine/planning";
import { springStep } from "@ikiraro/engine/math";

interface SignModelGLTFProps {
  url: string;
  pose?: Handshape;
  active?: boolean;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

// ─── Mixamo arm-pose library ─────────────────────────────────────────────────
// The Mixamo "Michelle" GLB ships in T-pose (arms outstretched horizontally).
// Bone-local axes (computed from the bind quaternions in the GLB) are:
//
//                       local Y               local X            local Z
//   LeftArm   →   world +X (down arm)     world −Z (back)     world −Y (down)
//   RightArm  →   world −X (down arm)     world +Z (forward)  world −Y (down)
//
// So the canonical control axes are:
//   • rotation.x  → swing the arm DOWN from horizontal. Same sign on both
//                   sides (positive ≈ +1.3 rad gets arms to natural hanging).
//   • rotation.z  → swing the arm FORWARD. MIRRORED: Left positive, Right
//                   negative. The old code used Left negative + Right positive,
//                   which is why both arms ended up swinging behind the back.
//   • rotation.y  → twist along the bone (pronation). Mirrored sign.
//   • ForeArm.rotation.z → elbow bend forward. Mirrored sign (L+, R−).
//                          NOT rotation.y — that just twists the wrist.

// NOTE on forearm rotation.x:
//   The model's bind pose has a pre-rotation on the forearm's local X axis —
//   it's what made the elbow read as "already bent" no matter what Z/Y values
//   we used. The original code never set rotation.x on the forearm, so that
//   pre-rotation leaked through and folded the hands up at the chest in idle.
//   We now drive rForeX / lForeX explicitly: 0 means a straight, unbent elbow.

const IDLE = {
  rArmX: 1.32,
  rArmZ: -0.18,
  rArmY: 0.0,
  rForeX: 0.0,
  rForeZ: -0.04,
  rForeY: 0.0,
  rHandX: 0.0,

  lArmX: 1.32,
  lArmZ: 0.18,
  lArmY: 0.0,
  lForeX: 0.0,
  lForeZ: 0.04,
  lForeY: 0.0,
  lHandX: 0.0,
};

const SIGN = {
  // Arms raised into ASL signing space — forearms ~vertical, hands at chest
  // height in front of the body, palms angled toward the viewer.
  rArmX: 0.78,
  rArmZ: -0.55,
  rArmY: 0.35,
  rForeX: 0.0,
  rForeZ: -1.55,
  rForeY: 0.55,
  rHandX: -0.25,

  lArmX: 0.78,
  lArmZ: 0.55,
  lArmY: -0.35,
  lForeX: 0.0,
  lForeZ: 1.55,
  lForeY: -0.55,
  lHandX: -0.25,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function SignModelGLTF({
  url,
  pose = REST_POSE,
  active = false,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: SignModelGLTFProps) {
  const { scene: rawScene } = useGLTF(url);
  // Clone per-instance so useFrame mutations never corrupt the cached original.
  // Without this, navigating away and back re-uses the mutated scene and
  // bindQuatsRef captures already-modified quaternions as the "bind pose".
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

  const poseRef = useRef(pose);
  poseRef.current = pose;
  const activeRef = useRef(active);
  activeRef.current = active;

  // Resolve bones once. The Object3D references are stable for the life of the
  // scene; re-walking the node graph every frame is wasted work.
  const bonesRef = useRef<Record<string, THREE.Object3D | null> | null>(null);
  // Bind-pose quaternions for additive rotation. The Mixamo shoulder bone has
  // a ~−180° Z component that holds the arm in T-pose; writing rotation.z
  // directly nukes that and folds the whole chain. We compose deltas on top
  // of the captured bind so IDLE/SIGN values mean "Euler offset from bind."
  const bindQuatsRef = useRef<Record<string, THREE.Quaternion>>({});
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

    // Capture every controlled bone's bind quaternion so we can compose
    // deltas on top instead of overwriting.
    for (const [k, v] of Object.entries(bones)) {
      if (v) bindQuatsRef.current[k] = v.quaternion.clone();
    }

    // Stash the Hips' rest Y position once so breathing can offset from it.
    if (bones.Hips) bones.Hips.userData.restY = bones.Hips.position.y;
  }

  // Reusable scratch objects so useFrame stays allocation-free.
  const tmpEuler = useMemo(() => new THREE.Euler(0, 0, 0, "XYZ"), []);
  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const p = poseRef.current;
    const s = stateRef.current;
    const b = bonesRef.current!;
    const t = state.clock.getElapsedTime();

    // Compose an Euler delta onto a captured bind quaternion. This is what
    // makes IDLE/SIGN angles mean "rotation relative to T-pose" — direct
    // .rotation.x writes would destroy bind data on heavily-rotated bones
    // like the shoulder, and silently swap axes on the Hips bone whose bind
    // is a −90° X rotation (Z-up → Y-up conversion).
    const setDelta = (key: string, x: number, y: number, z: number) => {
      const bone = b[key];
      const bind = bindQuatsRef.current[key];
      if (!bone || !bind) return;
      tmpEuler.set(x, y, z, "XYZ");
      tmpQuat.setFromEuler(tmpEuler);
      bone.quaternion.copy(bind).multiply(tmpQuat);
    };

    // ─── 1. Sign ⇄ Idle transition ─────────────────────────────────────────
    // Spring on progress, then smoothstep so the arms ease in and out instead
    // of arriving on a linear ramp.
    const [nextP, nextV] = springStep(s[38]!, s[39]!, activeRef.current ? 1 : 0, dt, 55, 14);
    s[38] = nextP;
    s[39] = nextV;
    const k = Math.max(0, Math.min(1, s[38]!));
    const ek = k * k * (3 - 2 * k);

    // Idle motion dampens (but doesn't disappear) while signing. A fully
    // statue-still avatar mid-sign reads as broken; a fully-swaying one
    // fights the gesture. 30% retained is the sweet spot.
    const idleGain = 1 - ek * 0.7;

    // ─── 2. Breathing — ~14 breaths/min, slightly asymmetric ───────────────
    // Real respiration: inhale ≈ 1.7s, exhale ≈ 2.6s, period ≈ 4.3s (0.23 Hz).
    // Primary sine + small second harmonic gives the asymmetric "fuller at
    // peak, slower release" shape without piecewise functions. Range ≈ ±0.7.
    const breathPhase = t * 1.45;
    const breath = Math.sin(breathPhase) * 0.55 + Math.sin(breathPhase * 2 + 0.4) * 0.12;

    // ─── 3. Postural sway — detuned multi-frequency for non-repeating feel ─
    // Quiet standing is multi-frequency and never quite repeats. Two octaves
    // per axis with irrational ratios approximates that without true noise.
    const swayML = Math.sin(t * 0.18 + 0.7) * 0.65 + Math.sin(t * 0.41 + 2.3) * 0.18;
    const swayAP = Math.cos(t * 0.13) * 0.55 + Math.sin(t * 0.33 + 1.1) * 0.15;

    // ─── 4. Torso chain (all additive on bind) ─────────────────────────────
    // Hips: bind has −90° X (Mixamo Z-up conversion), so delta axes map:
    //   x → pelvis pitch, y → roll, z → yaw. Yaw and roll drive the sway;
    //   pitch carries a faint AP component for life.
    setDelta("Hips", swayAP * 0.01 * idleGain, swayML * 0.02 * idleGain, swayML * 0.006 * idleGain);
    if (b.Hips) {
      b.Hips.position.y = (b.Hips.userData.restY as number) + breath * 0.045 * idleGain;
    }

    // Spine column — lumbar/thoracic chest rise on inhale, gentle lateral
    // bend that follows the sway. Spine1 carries more breath signal
    // (sternum-adjacent), Spine2 carries more roll (shoulder girdle).
    setDelta("Spine", breath * 0.02 + 0.012, 0, swayML * -0.005 * idleGain);
    setDelta("Spine1", breath * 0.014, 0, swayML * 0.006 * idleGain);
    setDelta("Spine2", breath * 0.006, 0, swayML * -0.012 * idleGain);

    // Neck holds steady — counter-tilt the spine's forward lean so the head
    // doesn't pitch with breathing. Real necks barely move during quiet
    // breathing.
    setDelta("Neck", -breath * 0.005 - 0.04, 0, 0);

    // Head: hold the gaze. No idle drift — signers maintain eye contact
    // with the viewer. A faint counter-roll to the sway keeps the eyes
    // level even when the torso tips a few degrees.
    setDelta("Head", 0.035, 0, -swayML * 0.006 * idleGain);

    // ─── 5. Arms: blend IDLE ⇄ SIGN with subtle ambient sway ───────────────
    // The sway is gated by idleGain so it doesn't fight the signing motion.
    const armSway = 0.03 * idleGain;
    const swayR = Math.sin(t * 0.55) * armSway;
    const swayL = Math.sin(t * 0.55 + 0.3) * armSway;

    // Small shoulder lift when signing so the upper-arm hinge looks natural.
    setDelta("RightShoulder", 0, 0, ek * -0.12);
    setDelta("LeftShoulder", 0, 0, ek * 0.12);

    setDelta(
      "RightArm",
      lerp(IDLE.rArmX, SIGN.rArmX, ek) + swayR * 0.6,
      lerp(IDLE.rArmY, SIGN.rArmY, ek),
      lerp(IDLE.rArmZ, SIGN.rArmZ, ek) + swayR,
    );
    setDelta(
      "LeftArm",
      lerp(IDLE.lArmX, SIGN.lArmX, ek) + swayL * 0.6,
      lerp(IDLE.lArmY, SIGN.lArmY, ek),
      lerp(IDLE.lArmZ, SIGN.lArmZ, ek) - swayL,
    );
    setDelta(
      "RightForeArm",
      lerp(IDLE.rForeX, SIGN.rForeX, ek),
      lerp(IDLE.rForeY, SIGN.rForeY, ek),
      lerp(IDLE.rForeZ, SIGN.rForeZ, ek),
    );
    setDelta(
      "LeftForeArm",
      lerp(IDLE.lForeX, SIGN.lForeX, ek),
      lerp(IDLE.lForeY, SIGN.lForeY, ek),
      lerp(IDLE.lForeZ, SIGN.lForeZ, ek),
    );
    setDelta("RightHand", lerp(IDLE.rHandX, SIGN.rHandX, ek), 0, 0);
    setDelta("LeftHand", lerp(IDLE.lHandX, SIGN.lHandX, ek), 0, 0);

    // ─── 6. Fingers (spring physics from Handshape) ────────────────────────
    // Finger curl scales with the signing progress — when idle the hand
    // settles to a soft natural curve regardless of the target Handshape.
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
        const [nextVal, nextVel] = springStep(s[idx]!, s[19 + idx]!, targets[i]!, dt, 240, 22);
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
      const [nextVal, nextVel] = springStep(s[idx]!, s[19 + idx]!, thumbTargets[i]!, dt, 200, 20);
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
