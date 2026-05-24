import { defineConfig } from "tsup";

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
  setup(build: any) {
    build.onResolve({ filter: /\?worker$/ }, (args: any) => ({
      path: args.path,
      namespace: "ikiraro-worker",
    }));
    build.onLoad({ filter: /.*/, namespace: "ikiraro-worker" }, (args: any) => {
      if (args.path.endsWith("holistic-landmarker.worker?worker")) {
        return {
          loader: "js",
          contents: `
          export default function WorkerFactory() {
            return new Worker(new URL("./holistic-landmarker.worker.js", import.meta.url), {
              type: "module"
            });
          }
        `,
        };
      }
      return {
        loader: "js",
        contents: `
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
      `,
      };
    });
  },
};
export default defineConfig({
  entry: {
    index: "src/index.ts",
    components: "src/components.ts",
    engine: "src/engine.ts",
    "holistic-landmarker.worker": "../runtime/src/workers/holistic-landmarker.worker.ts",
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
