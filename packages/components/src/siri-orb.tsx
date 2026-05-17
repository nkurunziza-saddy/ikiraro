import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Float } from "@react-three/drei";
import * as THREE from "three";

/**
 * A premium, organic 3D orb inspired by Siri and fluid design.
 * Uses Three.js for hardware-accelerated shader distortions.
 *
 * Props:
 * - active: whether the orb is in a high-energy "listening" state
 * - color: primary color of the orb
 * - size: base size of the orb
 */
function OrbInner({ active, color = "oklch(0.6 0.1 260)" }: { active?: boolean; color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    // Subtle floating motion
    meshRef.current.position.y = Math.sin(time * 0.5) * 0.1;

    // Distort based on active state
    if (active) {
      meshRef.current.scale.setScalar(1 + Math.sin(time * 10) * 0.05);
    } else {
      meshRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.02);
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color={color}
          speed={active ? 5 : 2}
          distort={active ? 0.6 : 0.4}
          radius={1}
        />
      </Sphere>
    </Float>
  );
}

export function SiriOrb({
  active = false,
  color = "oklch(0.6 0.1 260)",
  className = "",
}: {
  active?: boolean;
  color?: string;
  className?: string;
}) {
  return (
    <div className={`relative aspect-square w-full max-w-[300px] ${className}`}>
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-700 ease-out bg-primary"
        style={{
          transform: active ? "scale(1.2)" : "scale(1)",
          opacity: active ? 0.2 : 0.1,
        }}
      />

      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <OrbInner active={active} color={color} />
      </Canvas>
    </div>
  );
}
