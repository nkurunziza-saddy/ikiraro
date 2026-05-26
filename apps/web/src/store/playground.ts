import { create } from "zustand";

export type TTSProvider = "browser" | "openai" | "elevenlabs";

interface PlaygroundState {
  // TTS config (shared singleton — demo page reads this too)
  ttsProvider: TTSProvider;
  setTtsProvider: (provider: TTSProvider) => void;

  ttsApiKey: string;
  setTtsApiKey: (key: string) => void;

  // Camera / vision
  visionEnabled: boolean;
  setVisionEnabled: (enabled: boolean) => void;

  // UI
  avatarExpanded: boolean;
  setAvatarExpanded: (expanded: boolean) => void;

  showKeyboard: boolean;
  setShowKeyboard: (show: boolean) => void;

  textDraft: string;
  setTextDraft: (draft: string) => void;

  signUnits: string[];
  setSignUnits: (units: string[] | ((prev: string[]) => string[])) => void;
}

export const usePlaygroundStore = create<PlaygroundState>((set) => ({
  ttsProvider: "browser",
  setTtsProvider: (provider) => set({ ttsProvider: provider }),

  ttsApiKey: import.meta.env.VITE_ELEVENLABS_API_KEY || "",
  setTtsApiKey: (key) => set({ ttsApiKey: key }),

  visionEnabled: false,
  setVisionEnabled: (enabled) => set({ visionEnabled: enabled }),

  avatarExpanded: false,
  setAvatarExpanded: (expanded) => set({ avatarExpanded: expanded }),

  showKeyboard: false,
  setShowKeyboard: (show) => set({ showKeyboard: show }),

  textDraft: "",
  setTextDraft: (draft) => set({ textDraft: draft }),

  signUnits: [],
  setSignUnits: (units) =>
    set((state) => ({
      signUnits: typeof units === "function" ? units(state.signUnits) : units,
    })),
}));
