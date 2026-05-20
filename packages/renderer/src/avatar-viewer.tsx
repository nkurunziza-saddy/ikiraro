import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { RendererDirector } from "@ikiraro/engine/planning";
import type { SignCanvas } from "@ikiraro/engine/planning";
import type { TranslationEnvelope } from "@ikiraro/engine/types";
import type { ArmTarget, MotionType } from "@ikiraro/engine/types";
import { REST_POSE } from "@ikiraro/engine/planning";
import type { Handshape } from "@ikiraro/engine/planning";
import { SignModelGLTF } from "./sign-model-gltf";

interface AvatarViewerProps {
  envelope: TranslationEnvelope | null;
  modelUrl: string;
  className?: string;
}

export type SignFrameState = {
  motion: MotionType;
  progress: number;
  armTarget: ArmTarget | null;
};

export function AvatarViewer({ envelope, modelUrl, className }: AvatarViewerProps) {
  const [pose, setPose] = useState<Handshape>(REST_POSE);
  const [active, setActive] = useState(false);

  // Updated on every RAF tick via setMotion — avoid state to prevent re-renders.
  const signFrameRef = useRef<SignFrameState>({ motion: "none", progress: 0, armTarget: null });

  const adapter = useMemo<SignCanvas>(
    () => ({
      setPose,
      setOverlay: () => {},
      setMotion: (motion, progress, armTarget) => {
        signFrameRef.current = { motion, progress, armTarget: armTarget ?? null };
      },
      clear: () => {
        setPose(REST_POSE);
        setActive(false);
        signFrameRef.current = { motion: "none", progress: 0, armTarget: null };
      },
    }),
    [],
  );

  const director = useMemo(() => new RendererDirector(adapter), [adapter]);

  useEffect(() => {
    const queue = envelope?.rendererQueue ?? [];
    director.setQueue(queue);
    if (queue.length > 0) {
      setActive(true);
      director.play();
    } else {
      setActive(false);
    }
    return director.subscribe((s) => {
      setActive(s.isPlaying);
    });
  }, [director, envelope]);

  return (
    <Canvas
      className={className}
      shadows
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      {/* Framed on signing space: shoulders → just above head, arms visible */}
      <PerspectiveCamera makeDefault position={[0, 0.15, 2.2]} fov={42} near={0.01} far={10} />

      <ambientLight intensity={0.22} color="#f8ece2" />
      <directionalLight
        position={[2.2, 4.5, 3.2]}
        intensity={2.4}
        color="#fff2e2"
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <directionalLight position={[-2.8, 1.4, 1.8]} intensity={0.55} color="#e2ecff" />
      <directionalLight position={[0.4, 2.6, -3.5]} intensity={0.85} color="#ffd9b8" />

      <Suspense fallback={null}>
        <Environment preset="apartment" background={false} />

        <SignModelGLTF
          url={modelUrl}
          pose={pose}
          active={active}
          signFrameRef={signFrameRef}
          scale={1}
          position={[0, -1.2, 0]}
        />
        <ContactShadows
          position={[0, -1.2, 0]}
          opacity={0.35}
          scale={2}
          blur={2.5}
          far={1}
          color="#1a0e06"
          resolution={512}
        />
      </Suspense>
    </Canvas>
  );
}
