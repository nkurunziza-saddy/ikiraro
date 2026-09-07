import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  fmt: {
    ignorePatterns: ["dist/**", "**/routeTree.gen.ts"],
  },
  lint: {
    ignorePatterns: ["dist/**", "scripts/**", "**/routeTree.gen.ts"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
    overrides: [
      {
        files: ["**/*.test.ts", "**/*.spec.ts"],
        rules: {
          "typescript/unbound-method": "off",
        },
      },
    ],
  },
  staged: {
    "*.{js,jsx,ts,tsx}": "vp check --fix",
  },
});
