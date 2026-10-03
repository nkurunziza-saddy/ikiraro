import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig(({ command }) => ({
  resolve: {
    tsconfigPaths: true,
    dedupe: ["react", "react-dom"],
    // Development consumes source so library build cleanup cannot break HMR.
    alias:
      command === "serve"
        ? [
            {
              find: /^@ikiraro\/sdk$/,
              replacement: new URL("../../packages/sdk/src/index.ts", import.meta.url).pathname,
            },
            ...["planning", "math", "vision"].map((entry) => ({
              find: `@ikiraro/engine/${entry}`,
              replacement: new URL(`../../packages/engine/src/${entry}/index.ts`, import.meta.url)
                .pathname,
            })),
            {
              find: "@ikiraro/engine/types",
              replacement: new URL("../../packages/engine/src/types.ts", import.meta.url).pathname,
            },
          ]
        : [],
  },
  plugins: lazyPlugins(() => [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ]),
  server: {
    port: 3001,
  },
}));
