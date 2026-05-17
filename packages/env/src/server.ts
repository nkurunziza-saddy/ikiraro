import "../env.d.ts";
import { env as cloudflareEnv } from "cloudflare:workers";

import type { CloudflareEnv } from "../env";

// For Cloudflare Workers, env is accessed via cloudflare:workers module.
// The explicit cast keeps downstream packages aligned with the generated bindings.
export const env = cloudflareEnv as CloudflareEnv;
