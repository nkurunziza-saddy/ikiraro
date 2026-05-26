import { create } from "zustand";

export type DemoScene = "store" | "news";

interface DemoState {
  selectedScene: DemoScene;
  setSelectedScene: (scene: DemoScene) => void;

  agentActive: boolean;
  setAgentActive: (active: boolean) => void;

  avatarExpanded: boolean;
  setAvatarExpanded: (expanded: boolean) => void;

  showKeyboard: boolean;
  setShowKeyboard: (show: boolean) => void;

  textDraft: string;
  setTextDraft: (draft: string) => void;

  signUnits: string[];
  setSignUnits: (units: string[] | ((prev: string[]) => string[])) => void;
}

export const useDemoStore = create<DemoState>((set) => ({
  selectedScene: "store",
  setSelectedScene: (scene) => set({ selectedScene: scene }),

  agentActive: true,
  setAgentActive: (active) => set({ agentActive: active }),

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
