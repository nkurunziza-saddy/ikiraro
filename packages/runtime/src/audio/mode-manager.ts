import type { AccessibilityMode } from "./types";

type ModeChangeListener = (mode: AccessibilityMode) => void;

const STORAGE_KEY = "ikiraro:accessibility-mode";

const VALID_MODES = new Set<AccessibilityMode>(["standard", "audio-first", "visual-first"]);

function loadMode(): AccessibilityMode {
  if (typeof localStorage === "undefined") return "standard";
  const stored = localStorage.getItem(STORAGE_KEY) as AccessibilityMode | null;
  return stored && VALID_MODES.has(stored) ? stored : "standard";
}

export class AccessibilityModeManager {
  private static instance: AccessibilityModeManager | null = null;

  private mode: AccessibilityMode = loadMode();
  private listeners = new Set<ModeChangeListener>();

  private constructor() {}

  static getInstance(): AccessibilityModeManager {
    if (!AccessibilityModeManager.instance) {
      AccessibilityModeManager.instance = new AccessibilityModeManager();
    }
    return AccessibilityModeManager.instance;
  }

  getMode(): AccessibilityMode {
    return this.mode;
  }

  setMode(mode: AccessibilityMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* private browsing */
    }
    this.listeners.forEach((fn) => fn(mode));
  }

  isAvatarSuppressed(): boolean {
    return this.mode === "audio-first";
  }

  isTtsSuppressed(): boolean {
    return this.mode === "visual-first";
  }

  onModeChange(listener: ModeChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  static reset(): void {
    AccessibilityModeManager.instance = null;
  }
}

export const accessibilityMode = AccessibilityModeManager.getInstance;
