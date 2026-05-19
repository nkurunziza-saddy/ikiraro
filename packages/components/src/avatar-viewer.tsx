import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { RendererDirector } from "@ikiraro/engine/planning";
import type { SignCanvas } from "@ikiraro/engine/planning";
import type { TranslationEnvelope } from "@ikiraro/engine/types";
import { REST_POSE } from "@ikiraro/engine/planning";
import type { Handshape } from "@ikiraro/engine/planning";
import { SignModelGLTF } from "./sign-model-gltf";

interface AvatarViewerProps {
  envelope: TranslationEnvelope | null;
  modelUrl: string;
  className?: string;
}

export function AvatarViewer({ envelope, modelUrl, className }: AvatarViewerProps) {
  const [pose, setPose] = useState<Handshape>(REST_POSE);
  const [active, setActive] = useState(false);

  const adapter = useMemo<SignCanvas>(
    () => ({
      setPose,
      setOverlay: () => {},
      clear: () => {
        setPose(REST_POSE);
        setActive(false);
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
      {/* Camera at chest height, pulled back enough to frame head → waist */}
      <PerspectiveCamera makeDefault position={[0, 0.05, 2.4]} fov={44} near={0.01} far={10} />

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

      <Environment preset="apartment" background={false} />

      <Suspense fallback={null}>
        <SignModelGLTF
          url={modelUrl}
          pose={pose}
          active={active}
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
