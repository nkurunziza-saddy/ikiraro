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

export const AVATAR_MODEL_OPTIONS = [
  {
    value: "/models/avatar-aj-signer-v9.glb",
    label: "Aj Signer",
    description: "Warm tan skin, light-blue polo, and articulated hands.",
  },
  {
    value: "/models/avatar-aj.glb?v=2",
    label: "Aj Original (Mixamo)",
    description: "Original build with backward cap, backpack, and default styling.",
  },
  {
    value: "/models/avatar-signing.glb",
    label: "Signing Avatar (Default)",
    description: "Standard Ikiraro signing avatar.",
  },
] as const;

export type AvatarModelOption = (typeof AVATAR_MODEL_OPTIONS)[number]["value"];
