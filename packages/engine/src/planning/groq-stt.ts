import type { SpeechIntake, SttModel } from "../types";

const GROQ_AUDIO_TRANSCRIPTIONS_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

type GroqWhisperResponse = {
  text?: string;
  language?: string;
  duration?: number;
  words?: Array<{ word: string; start: number; end: number; confidence?: number }>;
  segments?: Array<{ id?: number; start?: number; end?: number; text?: string }>;
};

async function readJsonOrThrow<T>(response: Response): Promise<T> {
  if (response.ok) return (await response.json()) as T;
  const message = await response.text();
  throw new Error(message || `Groq STT request failed with status ${response.status}.`);
}

export async function transcribeAudio(options: {
  apiKey: string;
  audio: File;
  model: SttModel;
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

  if (options.prompt) {
    formData.append("prompt", options.prompt);
  }

  const response = await fetch(GROQ_AUDIO_TRANSCRIPTIONS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${options.apiKey}` },
    body: formData,
  });

  const payload = await readJsonOrThrow<GroqWhisperResponse>(response);

  return {
    model: options.model,
    text: payload.text?.trim() ?? "",
    language: payload.language ?? null,
    durationSeconds: payload.duration ?? null,
    prompt: options.prompt ?? "",
    words:
      payload.words?.map((w) => ({
        word: w.word,
        start: w.start,
        end: w.end,
        confidence: w.confidence,
      })) ?? [],
    segments:
      payload.segments?.map((s, i) => ({
        id: s.id ?? i,
        start: s.start ?? 0,
        end: s.end ?? 0,
        text: s.text?.trim() ?? "",
      })) ?? [],
  };
}
