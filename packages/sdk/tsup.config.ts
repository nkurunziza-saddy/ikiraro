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
  "@mediapipe/tasks-vision", // optional peer — never bundle the WASM binary
];

const workerBundlePlugin = {
  name: "ikiraro-worker-bundle",
  setup(build: any) {
    build.onResolve({ filter: /\?worker$/ }, (args: any) => ({
      path: args.path,
      namespace: "ikiraro-worker",
    }));

    build.onLoad({ filter: /.*/, namespace: "ikiraro-worker" }, () => ({
      loader: "js",
      contents: `
        export default class IkiraroBundledWorker {
          constructor(options) {
            if (typeof Worker === "undefined") {
              throw new Error("Ikiraro hand tracking workers can only be created in a browser runtime.");
            }

            return new Worker(new URL("./hand-landmarker.worker.js", import.meta.url), {
              ...options,
              type: "module",
            });
          }
        }
      `,
    }));
  },
};

export default defineConfig({
  entry: {
    index: "src/index.ts",
    components: "src/components.ts",
    engine: "src/engine.ts",
    "hand-landmarker.worker": "../runtime/src/workers/hand-landmarker.worker.ts",
  },
  format: ["esm"],
  dts: {
    entry: {
      index: "src/index.ts",
      components: "src/components.ts",
      engine: "src/engine.ts",
    },
  },
  clean: true,
  sourcemap: true,
  treeshake: true,
  external,
  noExternal: [/^@ikiraro\//],
  esbuildPlugins: [workerBundlePlugin],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
