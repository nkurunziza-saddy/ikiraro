import { defineConfig } from "vite-plus";

const external = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "three",
  "@react-three/fiber",
  "@react-three/drei",
  "effect",
  "@mediapipe/tasks-vision",
];

const workerBundlePlugin = {
  name: "ikiraro-worker-bundle",
  resolveId(id: string) {
    if (id.includes("?worker")) {
      return id;
    }
  },
  load(id: string) {
    if (id.includes("holistic-landmarker.worker") && id.includes("?worker")) {
      return `
        export default function WorkerFactory() {
          return new Worker(new URL("./holistic-landmarker.worker.js", import.meta.url), {
            type: "module"
          });
        }
      `;
    }
    if (id.includes("?worker")) {
      return `
        export default class IkiraroBundledWorker {
          constructor(options) {
            if (typeof Worker === "undefined") {
              throw new Error("Ikiraro hand tracking workers can only be created in a browser runtime.");
            }
            return new Worker(new URL("./holistic-landmarker.worker.js", import.meta.url), {
              ...options,
              type: "module",
            });
          }
        }
      `;
    }
  },
};

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  pack: {
    entry: {
      index: "src/index.ts",
      core: "src/core.ts",
      vision: "src/vision.ts",
      components: "src/components.ts",
      engine: "src/engine.ts",
      "holistic-landmarker.worker": "../runtime/src/workers/holistic-landmarker.worker.ts",
    },
    format: ["esm"],
    outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
    dts: {
      entry: ["src/index.ts", "src/components.ts", "src/engine.ts", "src/core.ts", "src/vision.ts"],
    },
    clean: true,
    sourcemap: true,
    treeshake: true,
    plugins: [workerBundlePlugin],
    deps: {
      neverBundle: external,
      alwaysBundle: [/^@ikiraro\//],
    },
    target: false,
  },
});
