import { defineConfig } from "tsup";

// Packages consumers must install themselves — we never bundle them.
const external = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "three",
  "@react-three/fiber",
  "@react-three/drei",
  "effect",
  "@effect/platform",
  "@effect/platform-browser",
  "@mediapipe/tasks-vision",
  // UI libraries that ship their own bundles
  "framer-motion",
  "sonner",
  "next-themes",
  "class-variance-authority",
  "clsx",
  "tailwind-merge",
  "cmdk",
  "lucide-react",
  "vaul",
  "@base-ui/react",
  "@hugeicons/react",
  "@hugeicons/core-free-icons",
];

export default defineConfig({
  entry: {
    index: "src/index.ts",
    components: "src/components.ts",
    engine: "src/engine.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external,
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
