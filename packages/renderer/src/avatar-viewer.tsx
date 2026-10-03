import type { Handshape, SignCanvas } from "@ikiraro/engine/planning";
import { REST_POSE, RendererDirector } from "@ikiraro/engine/planning";
import type { ArmTarget, MotionType, TranslationEnvelope } from "@ikiraro/engine/types";
import { ContactShadows, Environment, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { type CSSProperties, Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SignModelGLTF } from "./sign-model-gltf";

interface AvatarViewerProps {
  envelope: TranslationEnvelope | null;
  modelUrl: string;
  className?: string;
  style?: CSSProperties;
  hidden?: boolean;
  /** Camera zoom multiplier. */
  zoom?: number;
}

export type SignFrameState = {
  motion: MotionType;
  progress: number;
  armTarget: ArmTarget | null;
  expression?: string;
};

export function AvatarViewer({
  envelope,
  modelUrl,
  className,
  style,
  hidden = false,
  zoom = 1,
}: AvatarViewerProps) {
  const poseRef = useRef<Handshape>(REST_POSE);
  const leftPoseRef = useRef<Handshape>(REST_POSE);
  const [active, setActive] = useState(false);
  const [overlay, setOverlayText] = useState<{
    label: string;
    sublabel?: string;
  } | null>(null);

  // RAF-updated state — avoiding React state to prevent re-renders.
  const signFrameRef = useRef<SignFrameState>({
    motion: "none",
    progress: 0,
    armTarget: null,
  });

  const adapter = useMemo<SignCanvas>(
    () => ({
      setPose: (pose) => {
        poseRef.current = pose;
      },
      setLeftPose: (pose) => {
        leftPoseRef.current = pose ?? REST_POSE;
      },
      setOverlay: (label, sublabel) => {
        setOverlayText((previous) => {
          if (!label) return null;
          return previous?.label === label && previous.sublabel === sublabel
            ? previous
            : { label, sublabel };
        });
      },
      setExpression: (expression) => {
        signFrameRef.current.expression = expression;
      },
      setMotion: (motion, progress, armTarget) => {
        signFrameRef.current.motion = motion;
        signFrameRef.current.progress = progress;
        signFrameRef.current.armTarget = armTarget ?? null;
      },

      clear: () => {
        poseRef.current = REST_POSE;
        leftPoseRef.current = REST_POSE;
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
    const queue = hidden ? [] : (envelope?.rendererQueue ?? []);
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
  }, [director, envelope, hidden]);

  if (hidden) return null;

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", ...style }}
    >
      <Canvas
        style={{ width: "100%", height: "100%" }}
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
        <PerspectiveCamera
          makeDefault
          position={[0, 0.08, 2.2 / Math.max(0.2, zoom)]}
          fov={42}
          near={0.01}
          far={10}
        />

        <ambientLight intensity={0.12} color="#f8ece2" />
        <directionalLight
          position={[2.2, 4.5, 3.2]}
          intensity={1.8}
          color="#fff2e2"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-1.5}
          shadow-camera-right={1.5}
          shadow-camera-top={1.5}
          shadow-camera-bottom={-1.5}
          shadow-normalBias={0.012}
          shadow-bias={-0.0001}
          shadow-radius={3}
        />
        <directionalLight position={[-2.8, 1.4, 1.8]} intensity={0.3} color="#e2ecff" />
        <directionalLight position={[0.4, 2.6, -3.5]} intensity={0.85} color="#ffd9b8" />

        <Suspense fallback={null}>
          <Environment preset="apartment" background={false} environmentIntensity={0.4} />

          <SignModelGLTF
            url={modelUrl}
            poseRef={poseRef}
            leftPoseRef={leftPoseRef}
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
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            pointerEvents: "none",
            textAlign: "center",
            background: "rgba(0,0,0,0.6)",
            color: "white",
            padding: "8px 16px",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 700 }}>{overlay.label}</span>
          {overlay.sublabel && (
            <span style={{ fontSize: 14, opacity: 0.8 }}>{overlay.sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function preloadAvatarModel(url: string) {
  useGLTF.preload(url);
}
