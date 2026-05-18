import { useRef, useCallback, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { REST_POSE, type Handshape } from "@sensa/engine/planning";
import { springStep } from "@sensa/engine/math";

// ─── Anthropometric anatomy (meters) ──────────────────────────────────────────
// All dimensions are based on average adult-male hand measurements. The palm
// is intentionally LONGER than the fingers — this is the single most important
// proportion. If you violate it the hand looks alien/dwarfy.
//
// Reference: hand length ~189mm = palm 108mm + middle finger 79mm + tip.

const PALM_W = 0.084;
const PALM_H = 0.108;
const PALM_D = 0.026;

// Phalanx lengths per finger (proximal, middle, distal) — sum = finger length.
// Radii taper from MCP toward fingertip.
const FINGERS = {
  index: {
    lengths: [0.041, 0.022, 0.012] as const,
    radii: [0.0088, 0.0078, 0.007] as const,
  },
  middle: {
    lengths: [0.043, 0.025, 0.013] as const,
    radii: [0.0094, 0.0083, 0.0073] as const,
  },
  ring: {
    lengths: [0.041, 0.023, 0.012] as const,
    radii: [0.0088, 0.0078, 0.007] as const,
  },
  pinky: {
    lengths: [0.031, 0.017, 0.01] as const,
    radii: [0.0075, 0.0067, 0.006] as const,
  },
} as const;

// Knuckle X positions across the palm (negative = thumb side for a right hand
// with palm toward viewer). Spacing follows real metacarpal head distribution.
const FINGER_X = {
  index: -0.03,
  middle: -0.01,
  ring: 0.01,
  pinky: 0.029,
};

// Forward-arc of MCP heads — middle sits slightly proud of the row, index and
// pinky sit slightly back. This is what gives the back of a real hand its
// gentle curve.
const FINGER_Z = {
  index: -0.0015,
  middle: 0.001,
  ring: 0.0,
  pinky: -0.0018,
};

// Skin
const SKIN_BASE = "#e8b9a0";
const SKIN_DEEP = "#cf8a6a"; // for subsurface tint
const NAIL = "#f3d2bd";

// ─── Phalanx geometry ─────────────────────────────────────────────────────────
// A SINGLE CapsuleGeometry per phalanx. The capsule's hemispherical end is the
// joint — adjacent capsules share their cap volumes so the surface reads as
// continuous. No separate joint spheres, no bumps.
function Phalanx({ len, rad, material }: { len: number; rad: number; material: THREE.Material }) {
  const geom = useMemo(() => {
    const cylLen = Math.max(0.0001, len - rad * 0.2);
    // CapsuleGeometry: radius, length, capSegments, radialSegments
    return new THREE.CapsuleGeometry(rad, cylLen, 8, 24);
  }, [len, rad]);
  return (
    <mesh position={[0, len / 2, 0]} geometry={geom} material={material} castShadow receiveShadow />
  );
}

// Fingertip — slight ellipsoidal cap that hides the capsule's flat end and adds
// a real-looking tip volume.
function Fingertip({ rad, material }: { rad: number; material: THREE.Material }) {
  const geom = useMemo(() => {
    const g = new THREE.SphereGeometry(rad * 1.04, 22, 16);
    g.scale(1.0, 0.92, 1.05);
    return g;
  }, [rad]);
  return <mesh geometry={geom} material={material} castShadow receiveShadow />;
}

// Nail — tiny shiny cap on the dorsal side.
function Nail({ rad, material }: { rad: number; material: THREE.Material }) {
  const geom = useMemo(() => {
    const g = new THREE.SphereGeometry(rad * 0.58, 14, 10);
    g.scale(1.0, 0.4, 0.85);
    return g;
  }, [rad]);
  return <mesh position={[0, 0, -rad * 0.55]} geometry={geom} material={material} castShadow />;
}

// ─── Finger ──────────────────────────────────────────────────────────────────
function Finger({
  name,
  lengths,
  radii,
  x,
  z,
  skinMat,
  nailMat,
  setRef,
}: {
  name: "index" | "middle" | "ring" | "pinky";
  lengths: readonly [number, number, number];
  radii: readonly [number, number, number];
  x: number;
  z: number;
  skinMat: THREE.Material;
  nailMat: THREE.Material;
  setRef: (key: string) => (el: THREE.Group | null) => void;
}) {
  const [pl, ml, dl] = lengths;
  const [pr, mr, dr] = radii;

  return (
    <group position={[x, PALM_H * 0.45, z]}>
      <group ref={setRef(`${name}-splay`)}>
        <group ref={setRef(`${name}-mcp`)}>
          <Phalanx len={pl} rad={pr} material={skinMat} />
          <group position={[0, pl, 0]}>
            <group ref={setRef(`${name}-pip`)}>
              <Phalanx len={ml} rad={mr} material={skinMat} />
              <group position={[0, ml, 0]}>
                <group ref={setRef(`${name}-dip`)}>
                  <Phalanx len={dl} rad={dr} material={skinMat} />
                  <group position={[0, dl, 0]}>
                    <Fingertip rad={dr} material={skinMat} />
                    <Nail rad={dr} material={nailMat} />
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

// ─── Palm — smooth rounded shape with dorsal definition ──────────────────────
function Palm({ skinMat }: { skinMat: THREE.Material }) {
  // Base palm: a stretched sphere gives soft edges without the boxy seams of a
  // box geometry. It blends naturally into the wrist and the metacarpal heads.
  const palmGeom = useMemo(() => {
    const g = new THREE.SphereGeometry(PALM_W * 0.55, 36, 28);
    g.scale(1.0, PALM_H / (PALM_W * 1.1), PALM_D / (PALM_W * 1.1));
    return g;
  }, []);

  // Thenar (thumb-base muscle pad) on the radial side — adds real palm volume.
  const thenarGeom = useMemo(() => {
    const g = new THREE.SphereGeometry(0.02, 24, 18);
    g.scale(1.0, 1.5, 0.85);
    return g;
  }, []);

  // Hypothenar (pinky-base pad) on the ulnar side — opposite the thenar.
  const hypothenarGeom = useMemo(() => {
    const g = new THREE.SphereGeometry(0.015, 24, 18);
    g.scale(1.0, 1.3, 0.85);
    return g;
  }, []);

  return (
    <group>
      <mesh geometry={palmGeom} material={skinMat} castShadow receiveShadow />
      <mesh
        position={[PALM_W * 0.36, -PALM_H * 0.12, PALM_D * 0.18]}
        geometry={thenarGeom}
        material={skinMat}
        castShadow
        receiveShadow
      />
      <mesh
        position={[-PALM_W * 0.38, -PALM_H * 0.06, PALM_D * 0.05]}
        geometry={hypothenarGeom}
        material={skinMat}
        castShadow
        receiveShadow
      />
    </group>
  );
}

// ─── Wrist ────────────────────────────────────────────────────────────────────
function Wrist({ skinMat }: { skinMat: THREE.Material }) {
  const geom = useMemo(
    () => new THREE.CylinderGeometry(PALM_W * 0.42, PALM_W * 0.38, 0.032, 28, 1, false),
    [],
  );
  return (
    <mesh
      position={[0, -PALM_H * 0.55, 0]}
      geometry={geom}
      material={skinMat}
      castShadow
      receiveShadow
    />
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function SignModelProcedural({ pose = REST_POSE }: { pose?: Handshape }) {
  const rootRef = useRef<THREE.Group>(null);

  // We store both current angles AND their velocities for spring physics.
  // [angles: 19, velocities: 19]
  const stateRef = useRef(new Float32Array(38));

  // Initialize angles on mount (velocities default to 0)
  useMemo(() => {
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
  }, []);

  const poseRef = useRef(pose);
  poseRef.current = pose;

  const groupRefs = useRef<Map<string, THREE.Group>>(new Map());
  const setRef = useCallback(
    (key: string) => (el: THREE.Group | null) => {
      if (el) groupRefs.current.set(key, el);
      else groupRefs.current.delete(key);
    },
    [],
  );

  // Single shared skin material. MeshPhysicalMaterial gives us proper PBR
  // plus a hint of subsurface (via sheen + clearcoat) without the cost of
  // real `transmission` SSS.
  const { skinMat, nailMat } = useMemo(() => {
    const skin = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(SKIN_BASE),
      roughness: 0.78,
      metalness: 0.0,
      clearcoat: 0.18,
      clearcoatRoughness: 0.55,
      sheen: 0.35,
      sheenColor: new THREE.Color(SKIN_DEEP),
      sheenRoughness: 0.85,
      envMapIntensity: 0.65,
      ior: 1.4,
    });
    const nail = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(NAIL),
      roughness: 0.4,
      metalness: 0.0,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.7,
    });
    return { skinMat: skin, nailMat: nail };
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const p = poseRef.current;
    const s = stateRef.current;
    const G = groupRefs.current;

    (["index", "middle", "ring", "pinky"] as const).forEach((name, fi) => {
      const cp = p[name];
      const base = fi * 4;
      const targets = [cp.mcp, cp.pip, cp.dip, cp.splay];

      for (let i = 0; i < 4; i++) {
        const idx = base + i;
        const [nextVal, nextVel] = springStep(s[idx]!, s[19 + idx]!, targets[i]!, dt, 240, 22);
        s[idx] = nextVal;
        s[19 + idx] = nextVel;
      }

      const mcpG = G.get(`${name}-mcp`);
      const pipG = G.get(`${name}-pip`);
      const dipG = G.get(`${name}-dip`);
      const splayG = G.get(`${name}-splay`);
      if (mcpG) mcpG.rotation.x = -s[base + 0]!;
      if (pipG) pipG.rotation.x = -s[base + 1]!;
      if (dipG) dipG.rotation.x = -s[base + 2]!;
      if (splayG) splayG.rotation.z = s[base + 3]!;
    });

    // Thumb spring
    const thumbTargets = [p.thumb.splay, p.thumb.flex, p.thumb.curl];
    for (let i = 0; i < 3; i++) {
      const idx = 16 + i;
      const [nextVal, nextVel] = springStep(s[idx]!, s[19 + idx]!, thumbTargets[i]!, dt, 200, 20);
      s[idx] = nextVal;
      s[19 + idx] = nextVel;
    }

    const tSplay = G.get("thumb-splay");
    const tFlex = G.get("thumb-flex");
    const tCurl = G.get("thumb-curl");
    if (tSplay) tSplay.rotation.z = -(Math.PI / 4 + s[16]! * 0.55);
    if (tFlex) tFlex.rotation.x = -s[17]!;
    if (tCurl) tCurl.rotation.x = -s[18]!;

    // ─── Natural Idle Micromotion ───────────────────────────────────────────
    // Multi-octave "noise" (layered sines) mimics physiological tremor and
    // natural breathing better than a single frequency.
    const t_ = state.clock.getElapsedTime();
    if (rootRef.current) {
      // Position tremor
      rootRef.current.position.y =
        Math.sin(t_ * 0.7) * 0.0012 + Math.sin(t_ * 2.3) * 0.0004 + Math.sin(t_ * 4.1) * 0.0001;

      // Rotation breathing (Y)
      rootRef.current.rotation.y = Math.sin(t_ * 0.35) * 0.01 + Math.sin(t_ * 1.1) * 0.003;

      // Rotation breathing (X)
      rootRef.current.rotation.x = Math.sin(t_ * 0.5 + 1.2) * 0.006 + Math.sin(t_ * 1.8) * 0.002;
    }
  });

  return (
    <group ref={rootRef} scale={1.25}>
      <Palm skinMat={skinMat} />
      <Wrist skinMat={skinMat} />

      {(["index", "middle", "ring", "pinky"] as const).map((name) => (
        <Finger
          key={name}
          name={name}
          lengths={FINGERS[name].lengths}
          radii={FINGERS[name].radii}
          x={FINGER_X[name]}
          z={FINGER_Z[name]}
          skinMat={skinMat}
          nailMat={nailMat}
          setRef={setRef}
        />
      ))}

      {/* Thumb — slightly larger phalanges, on the radial side */}
      <group position={[PALM_W * 0.42, -PALM_H * 0.08, PALM_D * 0.22]}>
        <group ref={setRef("thumb-splay")}>
          <Phalanx len={0.026} rad={0.0125} material={skinMat} />
          <group position={[0, 0.026, 0]}>
            <group ref={setRef("thumb-flex")}>
              <Phalanx len={0.032} rad={0.0115} material={skinMat} />
              <group position={[0, 0.032, 0]}>
                <group ref={setRef("thumb-curl")}>
                  <Phalanx len={0.024} rad={0.0102} material={skinMat} />
                  <group position={[0, 0.024, 0]}>
                    <Fingertip rad={0.0102} material={skinMat} />
                    <Nail rad={0.0102} material={nailMat} />
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
