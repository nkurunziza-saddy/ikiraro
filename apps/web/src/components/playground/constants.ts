import { RiHistoryLine, RiPulseLine, RiSettings3Line, RiTerminalBoxLine } from "@remixicon/react";

export const PLAYGROUND_TABS = [
  { id: "stream", icon: RiPulseLine, label: "Live stream" },
  { id: "metadata", icon: RiTerminalBoxLine, label: "Engine logs" },
  { id: "history", icon: RiHistoryLine, label: "History" },
  { id: "settings", icon: RiSettings3Line, label: "Settings" },
] as const;

export type PlaygroundTab = (typeof PLAYGROUND_TABS)[number]["id"];

export const ACCESSIBILITY_OPTIONS = [
  {
    value: "standard",
    label: "Standard",
    description: "Balanced experience for everyday use.",
  },
  {
    value: "audio-first",
    label: "Audio first",
    description: "Prioritizes spoken cues and audio feedback.",
  },
  {
    value: "visual-first",
    label: "Visual first",
    description: "Emphasizes visual indicators and captions.",
  },
] as const;

export const TTS_PROVIDER_OPTIONS = [
  {
    value: "browser",
    label: "Browser voice",
    description: "Use the device's built-in speech synthesis.",
  },
  {
    value: "openai",
    label: "OpenAI TTS",
    description: "Use OpenAI speech synthesis.",
  },
  {
    value: "elevenlabs",
    label: "ElevenLabs",
    description: "Use ElevenLabs voice synthesis.",
  },
] as const;

export type TtsProvider = "browser" | "openai" | "elevenlabs";
