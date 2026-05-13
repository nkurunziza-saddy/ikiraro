import {
  buildDeterministicPlanFromText,
  buildDeterministicPlanFromUnits,
  buildRendererQueue,
  generateSemanticSignPlanWithGroq,
  isPlannerModel,
  isSttModel,
  isTranslationDomain,
  transcribeAudioWithGroq,
  type CommunicationMode,
  type PlannerModel,
  type SttModel,
  type TranslationContext,
  type TranslationEnvelope,
} from "@sensa/communication";
import { env } from "@sensa/env/server";
import { Hono } from "hono";

type JsonTranslateBody =
  | {
      mode: "text";
      text: string;
      plannerModel?: PlannerModel;
      context?: TranslationContext;
    }
  | {
      mode: "sign-keys" | "camera-fingerspell";
      units: string[];
      context?: TranslationContext;
    };

type FileLike = {
  arrayBuffer(): Promise<ArrayBuffer>;
  name?: string;
  type?: string;
};

function isFileLike(value: unknown): value is FileLike {
  return Boolean(value && typeof value === "object" && "arrayBuffer" in value);
}

function parseContext(value: string | FileLike | undefined | null): TranslationContext {
  if (!value || typeof value !== "string") {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as TranslationContext;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function withPlanEnvelope(
  mode: CommunicationMode,
  rawInput: string,
  plan: TranslationEnvelope["plan"],
  intake: TranslationEnvelope["intake"] = null,
): TranslationEnvelope {
  return {
    mode,
    intake,
    plan,
    rendererQueue: buildRendererQueue(plan),
    rawInput,
    normalizedText: plan.normalizedText,
  };
}

async function buildSemanticPlanOrFallback(options: {
  text: string;
  plannerModel?: string;
  context: TranslationContext;
}) {
  if (!env.GROQ_API_KEY) {
    return buildDeterministicPlanFromText(options.text, options.context, {
      note: "GROQ_API_KEY is missing. Deterministic fallback plan used.",
    });
  }

  try {
    return await generateSemanticSignPlanWithGroq({
      apiKey: env.GROQ_API_KEY,
      text: options.text,
      plannerModel: isPlannerModel(options.plannerModel) ? options.plannerModel : undefined,
      context: options.context,
    });
  } catch (error) {
    return buildDeterministicPlanFromText(options.text, options.context, {
      note: `Groq semantic planning failed. ${error instanceof Error ? error.message : "Unknown error."}`,
    });
  }
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

    const context = parseContext(formData.get("context"));
    const requestedDomain = formData.get("domain")?.toString();
    if (isTranslationDomain(requestedDomain)) {
      context.domain = requestedDomain;
    }

    const requestedSttModel = formData.get("sttModel")?.toString();
    const sttModel: SttModel = isSttModel(requestedSttModel)
      ? requestedSttModel
      : "whisper-large-v3";
    const plannerModel = formData.get("plannerModel")?.toString();
    const prompt = formData.get("prompt")?.toString() ?? "";

    const intake = await transcribeAudioWithGroq({
      apiKey: env.GROQ_API_KEY,
      audio: audio as unknown as File,
      model: sttModel,
      prompt,
      promptHints: context.spellingHints,
    });

    const plan = await buildSemanticPlanOrFallback({
      text: intake.text,
      plannerModel,
      context,
    });

    return c.json(withPlanEnvelope("speech", intake.text, plan, intake));
  }

  const payload = (await c.req.json()) as JsonTranslateBody;

  if (payload.mode === "text") {
    const plan = await buildSemanticPlanOrFallback({
      text: payload.text,
      plannerModel: payload.plannerModel,
      context: payload.context ?? {},
    });

    return c.json(withPlanEnvelope("text", payload.text, plan));
  }

  if (payload.mode === "sign-keys" || payload.mode === "camera-fingerspell") {
    const plan = buildDeterministicPlanFromUnits(
      payload.units,
      payload.context ?? {},
      payload.mode,
    );
    return c.json(withPlanEnvelope(payload.mode, payload.units.join(" "), plan));
  }

  return c.json({ error: "Unsupported communication mode." }, 400);
});
