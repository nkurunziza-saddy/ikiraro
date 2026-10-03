import { describe, expect, it, vi } from "vite-plus/test";
import { GlossService } from "@ikiraro/engine/planning";
import { Effect, Layer } from "effect";
import { Groq } from "./client";
import { GlossGroqLive } from "./gloss";

describe("GlossGroqLive", () => {
  it("defaults to openai/gpt-oss-120b when no model is specified", async () => {
    let capturedBody: any = null;
    const mockFetch = vi.fn().mockImplementation((_url, options) => {
      capturedBody = JSON.parse(options.body);
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "test",
            object: "chat.completion",
            created: Date.now(),
            model: capturedBody.model,
            choices: [
              {
                index: 0,
                message: {
                  role: "assistant",
                  content: JSON.stringify({
                    gloss: "HELLO NAME PTR:SELF FS:JACK",
                    confidence: 1.0,
                  }),
                },
              },
            ],
          }),
      });
    });

    vi.stubGlobal("fetch", mockFetch);

    try {
      const groqLayer = Layer.succeed(Groq, { apiKey: "mock-key" });
      const layer = GlossGroqLive.pipe(Layer.provide(groqLayer));

      const program = Effect.gen(function* (_) {
        const gloss = yield* _(GlossService);
        return yield* _(gloss.generate("Hello, my name is Jack"));
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));

      expect(capturedBody.model).toBe("openai/gpt-oss-120b");
      expect(result.rawGloss).toBe("HELLO NAME PTR:SELF FS:JACK");
      expect(result.confidence).toBe(1.0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("respects custom model when specified", async () => {
    let capturedBody: any = null;
    const mockFetch = vi.fn().mockImplementation((_url, options) => {
      capturedBody = JSON.parse(options.body);
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "test",
            object: "chat.completion",
            created: Date.now(),
            model: capturedBody.model,
            choices: [
              {
                index: 0,
                message: {
                  role: "assistant",
                  content: JSON.stringify({ gloss: "WATER", confidence: 0.95 }),
                },
              },
            ],
          }),
      });
    });

    vi.stubGlobal("fetch", mockFetch);

    try {
      const groqLayer = Layer.succeed(Groq, { apiKey: "mock-key" });
      const layer = GlossGroqLive.pipe(Layer.provide(groqLayer));

      const program = Effect.gen(function* (_) {
        const gloss = yield* _(GlossService);
        return yield* _(gloss.generate("water", "openai/gpt-oss-20b"));
      });

      const result = await Effect.runPromise(Effect.provide(program, layer));

      expect(capturedBody.model).toBe("openai/gpt-oss-20b");
      expect(result.rawGloss).toBe("WATER");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
