import { defineConfig } from "tsup";
export default defineConfig([
  // Library build — what npm consumers import
  {
    entry: {
      types: "src/types.ts",
      "planning/index": "src/planning/index.ts",
      "math/index": "src/math/index.ts",
      "vision/index": "src/vision/index.ts",
      cdn: "src/cdn.ts",
    },
    format: ["esm"],
    dts: {
      compilerOptions: {
        composite: false,
        ignoreDeprecations: "6.0",
      },
    },
    sourcemap: true,
    clean: false,
    treeshake: true,
    external: ["effect"],
    outDir: "dist",
    tsconfig: "tsconfig.json",
  },
  // CDN bundle — unchanged behavior, kept from the original config
  {
    entry: { "ikiraro-engine": "src/cdn.ts" },
    format: ["esm", "iife"],
    globalName: "IkiraroEngine",
    clean: false,
    minify: true,
    sourcemap: true,
    treeshake: true,
    dts: false,
    outDir: "dist/cdn",
    esbuildOptions(options) {
      options.bundle = true;
    },
  },
]);
