import { auth, trustedOrigins } from "@sensa/auth";
import { env } from "@sensa/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { communicationRoute } from "./routes/communication";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (!origin) {
        return env.CORS_ORIGIN;
      }

      return trustedOrigins.includes(origin) ? origin : env.CORS_ORIGIN;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.route("/api/communication", communicationRoute);

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
