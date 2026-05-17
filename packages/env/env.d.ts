// Shared Cloudflare Worker bindings used across the server, auth, db, and web packages.
// This keeps the env surface explicit even when generated Alchemy typings are unavailable
// during local type-only or bundle-only workflows.

type ExplicitBindings = {
  DB: D1Database;
  CORS_ORIGIN: string;
  GROQ_API_KEY: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  VITE_SERVER_URL: string;
};

export type CloudflareEnv = ExplicitBindings;

declare global {
  type Env = CloudflareEnv;
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends CloudflareEnv {}
  }
}
