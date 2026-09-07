import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  pack: [
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
      outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
      dts: {
        compilerOptions: {
          composite: false,
        },
      },
      sourcemap: true,
      clean: false,
      treeshake: true,
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
    },
  ],
});
