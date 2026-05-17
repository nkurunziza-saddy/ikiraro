import {
  buildPlanFromGloss,
  buildPlanFromUnits,
  buildRendererQueue,
  generateGloss,
  isSttModel,
  transcribeAudio,
} from "@sensa/engine/planning";
import type { SttModel } from "@sensa/engine/types";
import { env } from "@sensa/env/server";
import { Hono } from "hono";

type JsonTranslateBody =
  | { mode: "text"; text: string }
  | { mode: "sign-keys" | "camera-fingerspell"; units: string[] };

type FileLike = {
  arrayBuffer(): Promise<ArrayBuffer>;
  name?: string;
  type?: string;
};

function isFileLike(value: unknown): value is FileLike {
  return Boolean(value && typeof value === "object" && "arrayBuffer" in value);
}

export const communicationRoute = new Hono();

communicationRoute.post("/translate", async (c) => {
  const contentType = c.req.header("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await c.req.formData();
    const mode = formData.get("mode")?.toString();
    const audio = formData.get("audio");

    if (mode !== "speech") {
      return c.json({ error: "Multipart translate only supports speech mode." }, 400);
    }

    if (!isFileLike(audio)) {
      return c.json({ error: "Speech translation requires an audio file." }, 400);
    }

    if (!env.GROQ_API_KEY) {
      return c.json({ error: "GROQ_API_KEY is not configured." }, 500);
    }

    const requestedSttModel = formData.get("sttModel")?.toString() ?? "";
    const sttModel: SttModel = isSttModel(requestedSttModel)
      ? requestedSttModel
      : "whisper-large-v3";
    const prompt = formData.get("prompt")?.toString() ?? "";

    const intake = await transcribeAudio({
      apiKey: env.GROQ_API_KEY,
      audio: audio as unknown as File,
      model: sttModel,
      prompt: prompt || undefined,
    });

    const intent = await generateGloss({ text: intake.text, apiKey: env.GROQ_API_KEY });
    const plan = buildPlanFromGloss(intent);

    return c.json({
      mode: "speech",
      intake,
      plan,
      rendererQueue: buildRendererQueue(plan),
      rawInput: intake.text,
      normalizedText: plan.normalizedText,
      intent,
    });
  }

  const payload = (await c.req.json()) as JsonTranslateBody;

  if (payload.mode === "text") {
    if (!env.GROQ_API_KEY) {
      return c.json({ error: "GROQ_API_KEY is not configured." }, 500);
    }

    const intent = await generateGloss({ text: payload.text, apiKey: env.GROQ_API_KEY });
    const plan = buildPlanFromGloss(intent);

    return c.json({
      mode: "text",
      intake: null,
      plan,
      rendererQueue: buildRendererQueue(plan),
      rawInput: payload.text,
      normalizedText: plan.normalizedText,
      intent,
    });
  }

  if (payload.mode === "sign-keys" || payload.mode === "camera-fingerspell") {
    const plan = buildPlanFromUnits(payload.units);
    return c.json({
      mode: payload.mode,
      intake: null,
      plan,
      rendererQueue: buildRendererQueue(plan),
      rawInput: payload.units.join(" "),
      normalizedText: plan.normalizedText,
    });
  }

  return c.json({ error: "Unsupported communication mode." }, 400);
});
