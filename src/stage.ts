import * as THREE from "three/webgpu";
import type { Capsule } from "./signing/body.ts";

/**
 * Draws capsules, and only capsules: one instanced cylinder per bone and one
 * instanced sphere per bone end. There is no model file and no rig; the figure
 * is whatever list of capsules it is handed each frame.
 */

// Interpreters wear black for a reason: the body recedes and the hands are all you see.
const INK = new THREE.Color("#3a3547");
const SKIN = new THREE.Color("#f4e6cf");
/** The part of the figure the camera keeps in frame, in metres. The controls cover the bottom of it. */
const FRAME = { centre: new THREE.Vector3(-0.06, -0.19, 0), width: 0.95, height: 1.26 };
const FOV = 24;
/** How far the pointer can swing the camera, in radians. */
const SWING = { yaw: 0.32, pitch: 0.1 };

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

  scene.add(new THREE.HemisphereLight("#ffffff", "#6f6a80", 1.1));
  const key = new THREE.DirectionalLight("#fff3e2", 2.8);
  key.position.set(-0.9, 1.5, 2.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 4;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.012;
  Object.assign(key.shadow.camera, {
    left: -0.8,
    right: 0.8,
    top: 0.8,
    bottom: -0.8,
    near: 0.5,
    far: 6,
  });
  key.target.position.copy(FRAME.centre);
  scene.add(key, key.target);
  // Two lights from behind pick the dark body's outline out of the dark.
  for (const side of [-1, 1]) {
    const rim = new THREE.DirectionalLight("#b9a8ff", 2.2);
    rim.position.set(1.6 * side, 0.7, -1.3);
    scene.add(rim);
  }

  const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.78, metalness: 0 });
  const bones = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(1, 1, 1, 24, 1, true),
    material,
    capsuleCount,
  );
  const ends = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 24, 16),
    material,
    capsuleCount * 2,
  );
  for (const mesh of [bones, ends]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);
  }

  const up = new THREE.Vector3(0, 1, 0);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const along = new THREE.Vector3();
  const size = new THREE.Vector3();
  const spin = new THREE.Quaternion();
  const still = new THREE.Quaternion();
  const matrix = new THREE.Matrix4();
  let coloured = false;

  const lean = { x: 0, y: 0, yaw: 0, pitch: 0 };

  function resize() {
    const { clientWidth: width, clientHeight: height } = canvas;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function aim() {
    // Ease towards the pointer, so the camera drifts rather than tracks.
    lean.yaw += (lean.x * SWING.yaw - lean.yaw) * 0.06;
    lean.pitch += (lean.y * SWING.pitch - lean.pitch) * 0.06;
    const half = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const distance = Math.max(FRAME.height / 2 / half, FRAME.width / 2 / (half * camera.aspect));
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
      capsules.forEach((capsule, i) => {
        a.fromArray(capsule.a);
        b.fromArray(capsule.b);
        along.subVectors(b, a);
        const length = along.length();
        if (length > 1e-6) spin.setFromUnitVectors(up, along.divideScalar(length));
        else spin.identity();
        size.set(capsule.radius, Math.max(length, 1e-6), capsule.radius);
        bones.setMatrixAt(
          i,
          matrix.compose(along.addVectors(a, b).multiplyScalar(0.5), spin, size),
        );
        size.setScalar(capsule.radius);
        ends.setMatrixAt(i * 2, matrix.compose(a, still, size));
        ends.setMatrixAt(i * 2 + 1, matrix.compose(b, still, size));
        if (!coloured) {
          const colour = capsule.skin ? SKIN : INK;
          bones.setColorAt(i, colour);
          ends.setColorAt(i * 2, colour);
          ends.setColorAt(i * 2 + 1, colour);
        }
      });
      coloured = true;
      bones.instanceMatrix.needsUpdate = true;
      ends.instanceMatrix.needsUpdate = true;
      aim();
      renderer.render(scene, camera);
    },
  };
}
