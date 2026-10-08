import * as THREE from "three/webgpu";
import type { Capsule } from "./signing/body.ts";
import { Z } from "./signing/math.ts";

/**
 * Draws capsules, and only capsules, as one mesh whose vertices are placed
 * again every frame. There is no model file and no rig; the figure is whatever
 * list of capsules it is handed.
 *
 * It is lit as a studio would light it: one soft key that casts shadows, so a
 * finger in front of the palm shows as one, and a light from behind on each
 * side to draw the figure's edge against the dark.
 */

// Interpreters wear dark for a reason: the body recedes and the hands are all you see.
const INK = new THREE.Color("#4a4a55");
const SKIN = new THREE.Color("#f0e2cd");

/** The part of the figure the camera keeps in frame, in metres. */
const FRAME = { centre: new THREE.Vector3(-0.07, -0.03, 0), width: 0.84, height: 1.08 };
/**
 * The heights, in metres, between which the figure fades out: below the chest
 * and above a hanging hand, so that nothing is cut off behind the controls.
 */
const FADE = [-0.3, -0.46] as const;
const FOV = 24;
/** How far the pointer can swing the camera, in radians. */
const SWING = { yaw: 0.14, pitch: 0.05 };

/** Each capsule is this many rings of this many vertices; half the rings round off each end. */
const AROUND = 32;
const RINGS = 18;
const PER = AROUND * RINGS;
const COS = Array.from({ length: AROUND }, (_, i) => Math.cos((i / AROUND) * 2 * Math.PI));
const SIN = Array.from({ length: AROUND }, (_, i) => Math.sin((i / AROUND) * 2 * Math.PI));

export type Stage = {
  draw(capsules: readonly Capsule[]): void;
  resize(): void;
  /** Lean the camera towards a point, each axis from -1 to 1. */
  lean(x: number, y: number): void;
  /** "webgpu", or "webgl" when the browser had to fall back. */
  backend: string;
};

export async function createStage(canvas: HTMLCanvasElement, capsuleCount: number): Promise<Stage> {
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
  await renderer.init();
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 20);

  scene.add(new THREE.HemisphereLight("#ffffff", "#3c3c46", 1.7));
  const key = new THREE.DirectionalLight("#fff6ea", 2.8);
  key.position.set(-0.9, 1.4, 2.2).add(FRAME.centre);
  key.target.position.copy(FRAME.centre);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 5;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.004;
  Object.assign(key.shadow.camera, { left: -0.7, right: 0.7, top: 0.7, bottom: -0.7, far: 6 });
  scene.add(key, key.target);
  for (const side of [-1, 1]) {
    const rim = new THREE.DirectionalLight("#dfe6ff", 1.6);
    rim.position.set(side * 1.6, 0.8, -1.4);
    scene.add(rim);
  }

  const faces: number[] = [];
  for (let first = 0; first < capsuleCount * PER; first += PER) {
    for (let ring = 0; ring < RINGS - 1; ring++) {
      for (let i = 0; i < AROUND; i++) {
        const p = first + ring * AROUND + i;
        const q = first + ring * AROUND + ((i + 1) % AROUND);
        faces.push(p, q, p + AROUND, q, q + AROUND, p + AROUND);
      }
    }
  }
  const buffer = (size: number, moving = true) => {
    const attribute = new THREE.BufferAttribute(new Float32Array(capsuleCount * PER * size), size);
    return moving ? attribute.setUsage(THREE.DynamicDrawUsage) : attribute;
  };
  const positions = buffer(3);
  const normals = buffer(3);
  const colours = buffer(3, false);
  const geometry = new THREE.BufferGeometry()
    .setIndex(faces)
    .setAttribute("position", positions)
    .setAttribute("normal", normals)
    .setAttribute("color", colours);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardNodeMaterial({ vertexColors: true, roughness: 0.55 }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  scene.add(mesh);

  const from = new THREE.Vector3();
  const to = new THREE.Vector3();
  const w = new THREE.Vector3();
  const u = new THREE.Vector3();
  const v = new THREE.Vector3();
  const k = new THREE.Vector3();
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();

  /** Place the vertices of capsule `n`. */
  function shape(n: number, { a, b, radius, end = radius, press = Z }: Capsule) {
    // A flattened capsule is a round one built deeper than it should be, then pressed.
    const share = k.set(...press).length();
    k.divideScalar(share);
    from.set(...a).addScaledVector(k, (1 / share - 1) * from.dot(k));
    to.set(...b).addScaledVector(k, (1 / share - 1) * to.dot(k));
    const length = w.subVectors(to, from).length();
    if (length > 1e-6) w.divideScalar(length);
    else w.set(0, 1, 0);
    u.set(Math.abs(w.x) < 0.9 ? 1 : 0, 0, Math.abs(w.x) < 0.9 ? 0 : 1)
      .cross(w)
      .normalize();
    v.crossVectors(w, u);
    // Where the wall leaves each end: on the equator, or past it towards the thinner end.
    const leaves =
      length > 1e-6 ? Math.asin(THREE.MathUtils.clamp((radius - end) / length, -1, 1)) : 0;

    let at = n * PER;
    for (let ring = 0; ring < RINGS; ring++) {
      const far = ring >= RINGS / 2;
      const turn = (ring % (RINGS / 2)) / (RINGS / 2 - 1);
      const latitude = far
        ? leaves + (Math.PI / 2 - leaves) * turn
        : -Math.PI / 2 + (leaves + Math.PI / 2) * turn;
      const out = Math.cos(latitude);
      const along = Math.sin(latitude);
      for (let i = 0; i < AROUND; i++, at++) {
        normal
          .copy(w)
          .multiplyScalar(along)
          .addScaledVector(u, out * COS[i]!)
          .addScaledVector(v, out * SIN[i]!);
        point.copy(far ? to : from).addScaledVector(normal, far ? end : radius);
        point.addScaledVector(k, (share - 1) * point.dot(k));
        // Pressing a surface flat turns its normals to face the way it was pressed.
        normal.addScaledVector(k, (1 / share - 1) * normal.dot(k)).normalize();
        positions.setXYZ(at, point.x, point.y, point.z);
        normals.setXYZ(at, normal.x, normal.y, normal.z);
      }
    }
  }

  let coloured = false;
  const lean = { x: 0, y: 0, yaw: 0, pitch: 0 };
  /** How many metres of the figure the canvas shows from top to bottom. */
  let tall = FRAME.height;

  function resize() {
    const { clientWidth: width, clientHeight: height } = canvas;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    tall = Math.max(FRAME.height, FRAME.width / camera.aspect);
    const [from, to] = FADE.map((y) => 50 - ((y - FRAME.centre.y) / tall) * 100);
    canvas.style.maskImage = `linear-gradient(#000 ${from}%, #0000 ${to}%)`;
  }

  function aim() {
    // Ease towards the pointer, so the camera drifts rather than tracks.
    lean.yaw += (lean.x * SWING.yaw - lean.yaw) * 0.06;
    lean.pitch += (lean.y * SWING.pitch - lean.pitch) * 0.06;
    const distance = tall / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camera.position
      .set(
        Math.sin(lean.yaw) * Math.cos(lean.pitch),
        Math.sin(lean.pitch),
        Math.cos(lean.yaw) * Math.cos(lean.pitch),
      )
      .multiplyScalar(distance)
      .add(FRAME.centre);
    camera.lookAt(FRAME.centre);
  }

  return {
    backend: (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend
      ? "webgpu"
      : "webgl",
    resize,
    lean(x, y) {
      lean.x = x;
      lean.y = y;
    },
    draw(capsules) {
      capsules.forEach((capsule, n) => {
        shape(n, capsule);
        if (!coloured) {
          const { r, g, b } = capsule.skin ? SKIN : INK;
          for (let i = n * PER; i < (n + 1) * PER; i++) colours.setXYZ(i, r, g, b);
        }
      });
      coloured = true;
      positions.needsUpdate = true;
      normals.needsUpdate = true;
      aim();
      renderer.render(scene, camera);
    },
  };
}
