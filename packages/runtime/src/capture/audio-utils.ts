const PREFERRED_AUDIO_RECORDING_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
] as const;
export function getSupportedAudioRecordingMimeType(): string | undefined {
  if (
    typeof globalThis === "undefined" ||
    typeof MediaRecorder === "undefined" ||
    typeof MediaRecorder.isTypeSupported !== "function"
  ) {
    return undefined;
  }
  return PREFERRED_AUDIO_RECORDING_MIME_TYPES.find((mimeType) =>
    MediaRecorder.isTypeSupported(mimeType),
  );
}
export function getAudioFileExtension(mimeType: string | null | undefined): string {
  const normalizedMimeType = mimeType?.split(";")[0]?.trim().toLowerCase();
  switch (normalizedMimeType) {
    case "audio/mp4":
    case "audio/x-m4a":
      return "m4a";
    case "audio/mpeg":
      return "mp3";
    case "audio/ogg":
      return "ogg";
    case "audio/wav":
    case "audio/wave":
    case "audio/x-wav":
      return "wav";
    case "audio/webm":
    default:
      return "webm";
  }
}
