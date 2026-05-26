import { useEffect, useState } from "react";
import { useIkiraro } from "../lib/ikiraro";

export function useDomObserver(enabled: boolean = true) {
  const { translate } = useIkiraro();
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Ignore playground inputs to avoid annoying loops
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        if (target.id.includes("playground") || target.className.includes("playground")) return;
      }

      setFocusedElement(target);

      const label = target.getAttribute("aria-label") || target.title || target.innerText;
      let role = target.getAttribute("role") || target.tagName.toLowerCase();

      // Clean up common roles
      if (role === "button") role = "button";
      else if (role === "a") role = "link";
      else if (role === "input") role = "input";
      else role = "";

      if (label) {
        // Strip out excessive whitespace
        const cleanLabel = label.trim().replace(/\s+/g, " ");
        const textToSign = role ? `${cleanLabel} ${role}` : cleanLabel;

        // Translate it (with some context so the model knows it's reading UI)
        translate(textToSign);
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [enabled, translate]);

  return { focusedElement };
}
