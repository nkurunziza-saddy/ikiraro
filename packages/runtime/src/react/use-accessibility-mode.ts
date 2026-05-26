import { useCallback, useEffect, useState } from "react";
import { AccessibilityModeManager } from "../audio/mode-manager";
import type { AccessibilityMode } from "../audio/types";

export function useAccessibilityMode(): {
  mode: AccessibilityMode;
  setMode: (mode: AccessibilityMode) => void;
  isAvatarSuppressed: boolean;
  isTtsSuppressed: boolean;
} {
  const manager = AccessibilityModeManager.getInstance();
  const [mode, setModeState] = useState<AccessibilityMode>(manager.getMode());

  useEffect(() => {
    return manager.onModeChange(setModeState);
  }, [manager]);

  const setMode = useCallback((next: AccessibilityMode) => manager.setMode(next), [manager]);

  // Derive from React state so these are always consistent with the rendered mode
  return {
    mode,
    setMode,
    isAvatarSuppressed: mode === "audio-first",
    isTtsSuppressed: mode === "visual-first",
  };
}
