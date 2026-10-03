import { describe, expect, it } from "vite-plus/test";
import { buildPlanFromUnits, createEnvelope } from "@ikiraro/engine/planning";
import type { TranslationEnvelope } from "@ikiraro/engine/types";
import { createIkiraro } from "./factory";

function nextTranslation(runtime: Awaited<ReturnType<typeof createIkiraro>>) {
  return new Promise<TranslationEnvelope>((resolve) => {
    const unsubscribe = runtime.onTranslated((envelope) => {
      unsubscribe();
      resolve(envelope);
    });
  });
}

describe("framework-independent runtime", () => {
  it("translates deterministic units without credentials or browser globals", async () => {
    const runtime = await createIkiraro();
    try {
      const result = nextTranslation(runtime);
      runtime.translateUnits(["A", "B"]);
      expect((await result).rendererQueue.some((frame) => frame.value === "A")).toBe(true);
    } finally {
      await runtime.stop();
    }
  });
  it("accepts a custom semantic planner without a Groq key", async () => {
    const envelope = createEnvelope(buildPlanFromUnits(["HELLO"]), {
      mode: "text",
      rawInput: "hello",
    });
    const runtime = await createIkiraro({
      planners: [{ canPlan: (request) => request.mode === "text", plan: async () => envelope }],
    });
    try {
      const result = nextTranslation(runtime);
      runtime.translate("hello");
      expect(await result).toBe(envelope);
    } finally {
      await runtime.stop();
    }
  });
  it("reports unsupported semantic translation instead of blocking runtime startup", async () => {
    const runtime = await createIkiraro();
    try {
      runtime.translate("hello");
      expect(runtime.snapshot().error).toContain("No translation planner");
      expect(runtime.snapshot().isTranslating).toBe(false);
    } finally {
      await runtime.stop();
    }
  });
});
