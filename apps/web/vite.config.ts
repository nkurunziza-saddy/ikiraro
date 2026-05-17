import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import alchemy from "alchemy/cloudflare/tanstack-start";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    alchemy({
      // The Cloudflare plugin probes network interfaces to allocate an inspector port.
      // In constrained environments that call can fail before Vite boots.
      inspectorPort: false,
    }),
  ],
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  ssr: {
    noExternal: ["better-auth"],
  },
});
