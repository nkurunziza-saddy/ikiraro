import { frames, SHOW } from "./terminal.ts";

/**
 * `curl ikiraro.example/hello` plays the fingerspelling in the terminal.
 * Browsers get the app. Add `?w=$COLUMNS&h=$LINES` to fill a larger terminal.
 */

type Env = { ASSETS: { fetch(request: Request): Promise<Response> } };

const FPS = 15;
const TERMINALS = /^(curl|wget|httpie|xh)\b/i;

export default {
  fetch(request: Request, env: Env): Response | Promise<Response> {
    if (!TERMINALS.test(request.headers.get("user-agent") ?? "")) return env.ASSETS.fetch(request);

    const url = new URL(request.url);
    const text = decodeURIComponent(url.pathname.slice(1)).slice(0, 80) || "hello";
    const size = (name: string, otherwise: number) =>
      Number(url.searchParams.get(name)) || otherwise;
    const playing = frames(text, size("w", 80), size("h", 24), FPS);
    const encoder = new TextEncoder();

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(SHOW.start));
      },
      async pull(controller) {
        const { value, done } = playing.next();
        if (done) {
          controller.enqueue(encoder.encode(SHOW.end));
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(value));
        await new Promise((resolve) => setTimeout(resolve, 1000 / FPS));
      },
    });
    return new Response(body, {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  },
};
