import type {
  PlannerModel,
  SttModel,
  TranslationContext,
  TranslationDomain,
  TranslationEnvelope,
} from "@sensa/communication";
import { env } from "@sensa/env/web";

import { getAudioFileExtension } from "./audio";

async function readEnvelope(response: Response): Promise<TranslationEnvelope> {
  if (response.ok) {
    return (await response.json()) as TranslationEnvelope;
  }

  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  throw new Error(payload?.error ?? `Request failed with ${response.status}.`);
}

export async function translateTextRequest(options: {
  text: string;
  plannerModel: PlannerModel;
  context?: TranslationContext;
}): Promise<TranslationEnvelope> {
  const response = await fetch(`${env.VITE_SERVER_URL}/api/communication/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode: "text",
      text: options.text,
      plannerModel: options.plannerModel,
      context: options.context,
    }),
  });

  return readEnvelope(response);
}

export async function translateSpeechRequest(options: {
  audio: Blob;
  sttModel: SttModel;
  plannerModel: PlannerModel;
  prompt: string;
  context?: TranslationContext;
  domain?: TranslationDomain;
}): Promise<TranslationEnvelope> {
  const formData = new FormData();
  const audioMimeType = options.audio.type || "audio/webm";
  formData.append(
    "audio",
    new File([options.audio], `speech-intake.${getAudioFileExtension(audioMimeType)}`, {
      type: audioMimeType,
    }),
  );
  formData.append("mode", "speech");
  formData.append("sttModel", options.sttModel);
  formData.append("plannerModel", options.plannerModel);
  formData.append("prompt", options.prompt);

  if (options.domain) {
    formData.append("domain", options.domain);
  }

  if (options.context) {
    formData.append("context", JSON.stringify(options.context));
  }

  const response = await fetch(`${env.VITE_SERVER_URL}/api/communication/translate`, {
    method: "POST",
    body: formData,
  });

  return readEnvelope(response);
}
