import { Suspense, useMemo, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import type { TranslationEnvelope } from "@sensa/engine/types";
import {
  RendererDirector,
  REST_POSE,
  type RendererState,
  type SignCanvas,
  type Handshape,
} from "@sensa/engine/planning";
import { PlaybackControls } from "./playback-controls";
import { TtsControls } from "./tts-controls";
import { SignModelProcedural } from "./sign-model-procedural";
import { SignModelGLTF } from "./sign-model-gltf";

// ─── Cinematic three-point lighting ───────────────────────────────────────────
// Tuned for ACES tonemapping — values are a touch hotter than they would be
// under linear output so the highlights have shape after the tone curve.
function HandLighting() {
  return (
    <>
      <ambientLight intensity={0.22} color="#f8ece2" />

      {/* Key light — warm upper-right, casts the primary shadow */}
      <directionalLight
        position={[2.2, 4.5, 3.2]}
        intensity={2.4}
        color="#fff2e2"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={8}
        shadow-camera-left={-0.55}
        shadow-camera-right={0.55}
        shadow-camera-top={0.55}
        shadow-camera-bottom={-0.55}
        shadow-bias={-0.00025}
        shadow-radius={4}
      />

      {/* Fill — cool, opposite side of key, softens shadow side */}
      <directionalLight position={[-2.8, 1.4, 1.8]} intensity={0.55} color="#e2ecff" />

      {/* Rim — backlight, separates the hand from the background */}
      <directionalLight position={[0.4, 2.6, -3.5]} intensity={0.85} color="#ffd9b8" />

      {/* Bounce from below — fakes light coming off the surface the hand sits over */}
      <pointLight
        position={[0, -0.8, 0.6]}
        intensity={0.3}
        color="#ffd6b8"
        decay={2}
        distance={2}
      />
    </>
  );
}

// ─── Stable Canvas: always mounted, identity is the model itself ─────────────
// We mount the WebGL context once on first render and keep it alive across
// plan changes. Empty/loading states render a placeholder pose INSIDE the
// canvas instead of unmounting the whole scene — that's what was causing the
// "page refreshes" feel when toggling 3D before.
function HandScene({
  pose,
  modelUrl,
  active,
}: {
  pose: Handshape;
  modelUrl?: string;
  active?: boolean;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
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
      <PerspectiveCamera makeDefault position={[0, 0.4, 1.8]} fov={30} near={0.01} far={10} />

      <HandLighting />
      <Environment preset="apartment" background={false} />
      <Suspense fallback={null}>
        {modelUrl ? (
          <SignModelGLTF
            url={modelUrl}
            pose={pose}
            active={active}
            scale={1}
            position={[0, -1.2, 0]}
          />
        ) : (
          <SignModelProcedural pose={pose} />
        )}
        <ContactShadows
          position={[0, -1.2, 0]}
          opacity={0.4}
          scale={2}
          blur={2.0}
          far={1}
          color="#1a0e06"
          resolution={1024}
        />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={0.6}
        minDistance={1}
        maxDistance={4}
        minPolarAngle={Math.PI * 0.1}
        maxPolarAngle={Math.PI * 0.8}
        target={[0, 0, 0]}
        makeDefault
      />
    </Canvas>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function SignPlayer3D({
  envelope,
  modelUrl,
}: {
  envelope: TranslationEnvelope | null;
  modelUrl?: string;
}) {
  const queue = useMemo(() => envelope?.rendererQueue ?? [], [envelope]);
  const [playbackState, setPlaybackState] = useState<RendererState | null>(null);
  const [speed, setSpeed] = useState(1);

  const [currentPose, setCurrentPose] = useState<Handshape>(REST_POSE);

  const canvasAdapter = useMemo<SignCanvas>(
    () => ({
      setPose: (pose) => setCurrentPose(pose),
      setOverlay: () => {},
      clear: () => setCurrentPose(REST_POSE),
    }),
    [],
  );

  const director = useMemo(() => new RendererDirector(canvasAdapter), [canvasAdapter]);

  useEffect(() => {
    director.setQueue(queue);
    return director.subscribe(setPlaybackState);
  }, [director, queue]);

  useEffect(() => {
    director.setOptions({ speed });
  }, [director, speed]);

  const ready = !!envelope && queue.length > 0 && !!playbackState;
  const totalMs = queue.reduce((acc, f) => acc + f.duration, 0);
  const progress = ready && totalMs > 0 ? playbackState.time / totalMs : 0;
  const activeFrame = ready ? queue[playbackState.frameIndex] : undefined;
  const frameLabel = activeFrame?.label ?? activeFrame?.value ?? "";

  return (
    <div className="space-y-8">
      {/* ── 3D Viewport ─────────────────────────────────────────────────────── */}
      <div className="relative aspect-video overflow-hidden rounded-xl border bg-gradient-to-b from-stone-50/[0.04] via-transparent to-stone-100/[0.06] dark:from-stone-900/30 dark:via-stone-900/10 dark:to-stone-800/30 shadow-inner">
        {/* Progress bar */}
        <div className="absolute inset-x-0 top-0 z-10 h-[3px] bg-muted/15">
          <div
            className="h-full bg-primary shadow-[0_0_6px_rgba(var(--primary),0.6)] transition-[width] duration-150 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Canvas mounts once, lives across plan changes */}
        <HandScene
          pose={currentPose}
          modelUrl={modelUrl}
          active={playbackState?.isPlaying || false}
        />

        {/* ── HUD overlays ──────────────────────────────────────────────────── */}
        <div className="pointer-events-none absolute inset-x-0 top-3 flex items-start justify-between px-4">
          <span className="rounded-full bg-background/70 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest backdrop-blur-sm border shadow-sm animate-in fade-in slide-in-from-top-1 duration-500 ease-out">
            3D
          </span>

          {ready ? (
            <span className="rounded-full bg-background/70 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest backdrop-blur-sm border shadow-sm tabular-nums text-muted-foreground animate-in fade-in slide-in-from-top-1 duration-500 delay-150 ease-out">
              {playbackState!.frameIndex + 1}&thinsp;/&thinsp;{queue.length}
            </span>
          ) : null}
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4">
          <div className="flex items-center gap-2.5 rounded-full border bg-background/65 px-3 py-1.5 shadow-sm backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out">
            <span
              className={`size-2 rounded-full ${ready && playbackState!.isPlaying ? "animate-pulse bg-primary" : "bg-muted-foreground/40"}`}
            />
            <span className="text-[11px] font-bold uppercase tracking-widest">
              {frameLabel || "Ready"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Controls ────────────────────────────────────────────────────────── */}
      {ready ? (
        <div className="grid gap-8 sm:grid-cols-2">
          <PlaybackControls
            isPlaying={playbackState!.isPlaying}
            togglePlayback={() => (playbackState!.isPlaying ? director.pause() : director.play())}
            resetPlayback={() => director.reset()}
            stepBackward={() => director.seek(Math.max(0, playbackState!.time - 500))}
            stepForward={() => director.seek(playbackState!.time + 500)}
            speed={speed}
            setSpeed={setSpeed}
            canStepBackward={playbackState!.time > 0}
            canStepForward={playbackState!.frameIndex < queue.length - 1}
          />
          <TtsControls text={envelope!.plan.normalizedText} />
        </div>
      ) : null}
    </div>
  );
}
