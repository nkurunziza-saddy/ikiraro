import type { Handshape, SignCanvas } from "@ikiraro/engine/planning";
import { REST_POSE, RendererDirector } from "@ikiraro/engine/planning";
import type { ArmTarget, MotionType, TranslationEnvelope } from "@ikiraro/engine/types";
import { ContactShadows, Environment, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SignModelGLTF } from "./sign-model-gltf";

interface AvatarViewerProps {
  envelope: TranslationEnvelope | null;
  modelUrl: string;
  className?: string;
  /** When true the canvas is not rendered — use in audio-first (blind) mode. */
  hidden?: boolean;
  /** Camera zoom multiplier. 1 is the default view, values below 1 zoom out, above 1 zoom in. */
  zoom?: number;
}

export type SignFrameState = {
  motion: MotionType;
  progress: number;
  armTarget: ArmTarget | null;
};

export function AvatarViewer({
  envelope,
  modelUrl,
  className,
  hidden = false,
  zoom = 1,
}: AvatarViewerProps) {
  const [pose, setPose] = useState<Handshape>(REST_POSE);
  const [active, setActive] = useState(false);
  const [overlay, setOverlayText] = useState<{ label: string; sublabel?: string } | null>(null);

  // Updated on every RAF tick via setMotion — avoid state to prevent re-renders.
  const signFrameRef = useRef<SignFrameState>({
    motion: "none",
    progress: 0,
    armTarget: null,
  });

  const adapter = useMemo<SignCanvas>(
    () => ({
      setPose,
      setOverlay: (label, sublabel) => {
        if (label) setOverlayText({ label, sublabel });
        else setOverlayText(null);
      },
      setMotion: (motion, progress, armTarget) => {
        signFrameRef.current.motion = motion;
        signFrameRef.current.progress = progress;
        signFrameRef.current.armTarget = armTarget ?? null;
      },

      clear: () => {
        setPose(REST_POSE);
        setActive(false);
        setOverlayText(null);
        signFrameRef.current = {
          motion: "none",
          progress: 0,
          armTarget: null,
        };
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
    const unsub = director.subscribe((s) => {
      setActive(s.isPlaying);
    });

    return () => {
      unsub();
      director.dispose();
    };
  }, [director, envelope]);

  if (hidden) return null;

  return (
    <div className={`relative w-full h-full overflow-hidden ${className || ""}`}>
      <Canvas
        className="w-full h-full"
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
        <PerspectiveCamera
          makeDefault
          position={[0, 0.08, 2.2 / Math.max(0.2, zoom)]}
          fov={42 / Math.max(0.2, zoom)}
          near={0.01}
          far={10}
        />

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
      {overlay && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-center bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-2xl flex flex-col items-center">
          <span className="text-xl font-bold tracking-wide">{overlay.label}</span>
          {overlay.sublabel && <span className="text-sm opacity-80">{overlay.sublabel}</span>}
        </div>
      )}
    </div>
  );
}

export function preloadAvatarModel(url: string) {
  useGLTF.preload(url);
}
