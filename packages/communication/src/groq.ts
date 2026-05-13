import {
  buildDeterministicPlanFromText,
  buildPlanningMessages,
  buildRendererQueue,
  buildSttPrompt,
  createStrictSignPlanJsonSchema,
  parseStructuredSignPlan,
} from "./planning";
import {
  isPlannerModel,
  type PlannerModel,
  type SignPlan,
  type SpeechIntake,
  type SttModel,
  type TranslationContext,
  type TranslationEnvelope,
} from "./types";

const GROQ_AUDIO_TRANSCRIPTIONS_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";

type GroqSpeechResponse = {
  text?: string;
  language?: string;
  duration?: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence?: number;
  }>;
  segments?: Array<{
    id?: number;
    start?: number;
    end?: number;
    text?: string;
  }>;
};

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

async function readJsonOrThrow<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  const message = await response.text();
  throw new Error(message || `Groq request failed with ${response.status}.`);
}

export async function transcribeAudioWithGroq(options: {
  apiKey: string;
  audio: File;
  model: SttModel;
  promptHints?: string[];
  prompt?: string;
}): Promise<SpeechIntake> {
  const formData = new FormData();
  formData.append("file", options.audio);
  formData.append("model", options.model);
  formData.append("language", "en");
  formData.append("temperature", "0");
  formData.append("response_format", "verbose_json");
  formData.append("timestamp_granularities[]", "word");
  formData.append("timestamp_granularities[]", "segment");

  const prompt = options.prompt?.trim() || buildSttPrompt(options.promptHints);
  if (prompt) {
    formData.append("prompt", prompt);
  }

  const response = await fetch(GROQ_AUDIO_TRANSCRIPTIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: formData,
  });

  const payload = await readJsonOrThrow<GroqSpeechResponse>(response);
  return {
    model: options.model,
    text: payload.text?.trim() ?? "",
    language: payload.language ?? null,
    durationSeconds: payload.duration ?? null,
    prompt,
    words:
      payload.words?.map((word) => ({
        word: word.word,
        start: word.start,
        end: word.end,
        confidence: word.confidence,
      })) ?? [],
    segments:
      payload.segments?.map((segment, index) => ({
        id: segment.id ?? index,
        start: segment.start ?? 0,
        end: segment.end ?? 0,
        text: segment.text?.trim() ?? "",
      })) ?? [],
  };
}

export async function generateSemanticSignPlanWithGroq(options: {
  apiKey: string;
  text: string;
  plannerModel?: PlannerModel;
  context?: TranslationContext;
}): Promise<SignPlan> {
  const plannerModel = isPlannerModel(options.plannerModel)
    ? options.plannerModel
    : "openai/gpt-oss-20b";

  const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: plannerModel,
      temperature: 0,
      messages: buildPlanningMessages(options.text, options.context, plannerModel),
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sign_plan",
          strict: true,
          schema: createStrictSignPlanJsonSchema(),
        },
      },
    }),
  });

  const payload = await readJsonOrThrow<GroqChatResponse>(response);
  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("Groq planner returned an empty response.");
  }

  const parsed = parseStructuredSignPlan(JSON.parse(content));
  return {
    ...parsed,
    metadata: {
      ...parsed.metadata,
      plannerModel,
      notes:
        parsed.metadata.notes.length > 0
          ? parsed.metadata.notes
          : ["Structured Groq semantic plan."],
    },
  };
}

export async function translateTextWithFallback(options: {
  apiKey?: string;
  text: string;
  plannerModel?: PlannerModel;
  context?: TranslationContext;
}): Promise<TranslationEnvelope> {
  const rawText = options.text.trim();

  if (!rawText) {
    const emptyPlan = buildDeterministicPlanFromText("", options.context, {
      note: "No text available to translate.",
    });
    return {
      mode: "text",
      intake: null,
      plan: emptyPlan,
      rendererQueue: buildRendererQueue(emptyPlan),
      rawInput: options.text,
      normalizedText: emptyPlan.normalizedText,
    };
  }

  if (options.apiKey) {
    try {
      const plan = await generateSemanticSignPlanWithGroq({
        apiKey: options.apiKey,
        text: rawText,
        plannerModel: options.plannerModel,
        context: options.context,
      });

      return {
        mode: "text",
        intake: null,
        plan,
        rendererQueue: buildRendererQueue(plan),
        rawInput: rawText,
        normalizedText: plan.normalizedText,
      };
    } catch (error) {
      const fallbackPlan = buildDeterministicPlanFromText(rawText, options.context, {
        note: `Groq semantic planning failed: ${error instanceof Error ? error.message : "unknown error"}`,
      });

      return {
        mode: "text",
        intake: null,
        plan: fallbackPlan,
        rendererQueue: buildRendererQueue(fallbackPlan),
        rawInput: rawText,
        normalizedText: fallbackPlan.normalizedText,
      };
    }
  }

  const fallbackPlan = buildDeterministicPlanFromText(rawText, options.context, {
    note: "No Groq API key configured. Deterministic fallback plan used.",
  });

  return {
    mode: "text",
    intake: null,
    plan: fallbackPlan,
    rendererQueue: buildRendererQueue(fallbackPlan),
    rawInput: rawText,
    normalizedText: fallbackPlan.normalizedText,
  };
}
