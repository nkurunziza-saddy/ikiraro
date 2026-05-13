import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import alchemy from "alchemy/cloudflare/tanstack-start";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
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
  ssr: {
    noExternal: ["better-auth"],
  },
});
