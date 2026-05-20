import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "ikiraro-engine": "src/cdn.ts",
  },
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
});
