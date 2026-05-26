import { useEffect, useRef, useState, useCallback } from "react";
import { AccessibilityShortcutManager, EarconPlayer } from "@ikiraro/runtime";
import type { DemoScene } from "../store/demo";
import { PRODUCTS } from "../components/store/mock-storefront";
import { ARTICLES } from "../components/demo/mock-news";

export interface DemoShortcutsOptions {
  scene: DemoScene;
  itemCount: number;
  announce: (text: string) => void;
  repeat: () => void;
  query: (text: string) => void;
  stopAudio: () => void;
  toggleVoice: () => void;
}

export interface DemoShortcutsState {
  focusedIndex: number | null;
  showShortcuts: boolean;
  setShowShortcuts: (v: boolean) => void;
  shortcutRows: [string, string][];
}

// Derived from source of truth — update here picks up everywhere
const STORE_ITEM_IDS = PRODUCTS.map((p) => p.id);
const NEWS_ITEM_IDS = ARTICLES.map((a) => a.id);
const STORE_ITEM_NAMES = PRODUCTS.map((p) => p.name);
const NEWS_ITEM_NAMES = ARTICLES.map((a) => a.title);

const STORE_SHORTCUTS: [string, string][] = [
  ["V", "Toggle voice mic"],
  ["W", "What's on this page?"],
  ["S  or  Backspace", "Stop audio  ·  ×2 = go back"],
  ["R", "Repeat last announcement"],
  ["1 – 4", "Focus product 1 to 4"],
  ["↑ / K", "Previous product"],
  ["↓ / J", "Next product"],
  ["F", "Read focused item  ·  FF = read all"],
  ["A", "Add focused product to cart"],
  ["C", "Hear cart contents"],
  ["O", "Checkout"],
  ["H  or  ?", "Shortcuts panel"],
  ["Escape", "Close panel / clear focus"],
];

const NEWS_SHORTCUTS: [string, string][] = [
  ["V", "Toggle voice mic"],
  ["W", "What's on this page?"],
  ["S  or  Backspace", "Stop audio  ·  ×2 = go back"],
  ["R", "Repeat last announcement"],
  ["1 – 6", "Focus article 1 to 6"],
  ["↑ / K", "Previous article"],
  ["↓ / J", "Next article"],
  ["F", "Read focused item  ·  FF = read all"],
  ["O  or  Enter", "Open focused article"],
  ["M", "Mark focused article as read"],
  ["H  or  ?", "Shortcuts panel"],
  ["Escape", "Close article / clear focus"],
];

function focusDomItem(scene: DemoScene, index: number): void {
  const ids = scene === "store" ? STORE_ITEM_IDS : NEWS_ITEM_IDS;
  const id = scene === "store" ? `product-title-${ids[index]}` : `article-${ids[index]}`;
  document.getElementById(id)?.focus({ preventScroll: false });
}

function triggerDomAction(id: string): void {
  document.getElementById(id)?.click();
}

export function useDemoShortcuts({
  scene,
  itemCount,
  announce,
  repeat,
  query,
  stopAudio,
  toggleVoice,
}: DemoShortcutsOptions): DemoShortcutsState {
  const earcon = EarconPlayer.getInstance();

  const [focusedIndex, setFocusedIndexState] = useState<number | null>(null);
  const [showShortcuts, setShowShortcutsState] = useState(false);

  // Stable refs — handlers always see fresh values without re-registering
  const focusedRef = useRef<number | null>(null);
  const announceRef = useRef(announce);
  const repeatRef = useRef(repeat);
  const queryRef = useRef(query);
  const stopAudioRef = useRef(stopAudio);
  const toggleVoiceRef = useRef(toggleVoice);
  const itemNamesRef = useRef(scene === "store" ? STORE_ITEM_NAMES : NEWS_ITEM_NAMES);

  announceRef.current = announce;
  repeatRef.current = repeat;
  queryRef.current = query;
  stopAudioRef.current = stopAudio;
  toggleVoiceRef.current = toggleVoice;
  itemNamesRef.current = scene === "store" ? STORE_ITEM_NAMES : NEWS_ITEM_NAMES;

  const setFocusedIndex = useCallback((idx: number | null) => {
    focusedRef.current = idx;
    setFocusedIndexState(idx);
  }, []);

  const setShowShortcuts = useCallback((v: boolean) => {
    setShowShortcutsState(v);
  }, []);

  const navigate = useCallback(
    (delta: number) => {
      const current = focusedRef.current;
      const next =
        current === null
          ? delta > 0
            ? 0
            : itemCount - 1
          : Math.max(0, Math.min(itemCount - 1, current + delta));
      setFocusedIndex(next);
      focusDomItem(scene, next);
      earcon.play("navigate");
      announceRef.current(`Item ${next + 1}: ${itemNamesRef.current[next] ?? ""}`);
    },
    [scene, itemCount, setFocusedIndex, earcon],
  );

  // Single manager instance per component lifetime — keydown listener stays stable
  const managerRef = useRef<AccessibilityShortcutManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = new AccessibilityShortcutManager({ doubleTapMs: 400 });
  }

  useEffect(() => {
    managerRef.current!.mount();
    return () => {
      managerRef.current!.unmount();
    };
  }, []);

  useEffect(() => {
    setFocusedIndex(null);
    setShowShortcutsState(false);
  }, [scene, setFocusedIndex]);

  useEffect(() => {
    const manager = managerRef.current!;
    const itemIds = scene === "store" ? STORE_ITEM_IDS : NEWS_ITEM_IDS;
    const itemNames = scene === "store" ? STORE_ITEM_NAMES : NEWS_ITEM_NAMES;
    const unsubs: Array<() => void> = [];

    // ── Digit keys: jump to item ──────────────────────────────────────────────
    for (let digit = 1; digit <= itemCount; digit++) {
      const idx = digit - 1;
      unsubs.push(
        manager.register({
          key: String(digit),
          label: String(digit),
          description: `Focus item ${digit}`,
          action: () => {
            setFocusedIndex(idx);
            focusDomItem(scene, idx);
            earcon.play("focus");
            announceRef.current(`Item ${digit}: ${itemNames[idx] ?? ""}`);
          },
        }),
      );
    }

    // ── Navigation ────────────────────────────────────────────────────────────
    unsubs.push(
      manager.register({
        key: "arrowdown",
        label: "↓",
        description: "Next item",
        action: () => navigate(1),
      }),
      manager.register({
        key: "j",
        label: "J",
        description: "Next item",
        action: () => navigate(1),
      }),
      manager.register({
        key: "arrowup",
        label: "↑",
        description: "Previous item",
        action: () => navigate(-1),
      }),
      manager.register({
        key: "k",
        label: "K",
        description: "Previous item",
        action: () => navigate(-1),
      }),
    );

    // ── V — toggle voice mic ──────────────────────────────────────────────────
    unsubs.push(
      manager.register({
        key: "v",
        label: "V",
        description: "Toggle voice mic",
        action: () => {
          earcon.play("select");
          toggleVoiceRef.current();
        },
      }),
    );

    // ── W — what's on this page ───────────────────────────────────────────────
    const whatQuery =
      scene === "store"
        ? "What products are available? Give me a brief overview with prices."
        : "What articles are on the page? Give me a brief list.";
    unsubs.push(
      manager.register({
        key: "w",
        label: "W",
        description: "What's on this page?",
        action: () => {
          earcon.play("open");
          queryRef.current(whatQuery);
        },
      }),
    );

    // ── S — stop audio ────────────────────────────────────────────────────────
    unsubs.push(
      manager.register({
        key: "s",
        label: "S",
        description: "Stop audio",
        action: () => stopAudioRef.current(),
      }),
    );

    // ── R — repeat last announcement ──────────────────────────────────────────
    unsubs.push(
      manager.register({
        key: "r",
        label: "R",
        description: "Repeat last announcement",
        action: () => repeatRef.current(),
      }),
    );

    // ── F — read focused item / FF — read all ─────────────────────────────────
    unsubs.push(
      manager.register({
        key: "f",
        label: "F",
        description: "Read focused item",
        action: () => {
          const idx = focusedRef.current;
          if (idx !== null && itemNames[idx]) {
            announceRef.current(`Item ${idx + 1}: ${itemNames[idx]}`);
          } else {
            announceRef.current("No item focused. Press a number key to select one.");
          }
        },
        doubleTapAction: () => queryRef.current("What is on the page right now?"),
      }),
    );

    // ── H / ? — shortcuts help / HH — repeat last ────────────────────────────
    const toggleHelp = () => setShowShortcutsState((v) => !v);
    unsubs.push(
      manager.register({
        key: "h",
        label: "H",
        description: "Shortcuts panel",
        action: toggleHelp,
        doubleTapAction: () => repeatRef.current(),
      }),
      manager.register({
        key: "?",
        label: "?",
        description: "Shortcuts panel",
        action: toggleHelp,
      }),
    );

    // ── Backspace — stop audio / ×2 — go back ────────────────────────────────
    unsubs.push(
      manager.register({
        key: "backspace",
        label: "Backspace",
        description: "Stop audio / go back",
        action: () => {
          stopAudioRef.current();
          triggerDomAction("close-article");
          setFocusedIndex(null);
        },
        doubleTapAction: () => {
          stopAudioRef.current();
          setFocusedIndex(null);
          setShowShortcutsState(false);
          triggerDomAction("close-article");
        },
      }),
    );

    // ── Escape — close/clear ──────────────────────────────────────────────────
    unsubs.push(
      manager.register({
        key: "escape",
        label: "Escape",
        description: "Close panel / clear focus",
        action: () => {
          setShowShortcutsState(false);
          setFocusedIndex(null);
          triggerDomAction("close-article");
        },
      }),
    );

    // ── Store-specific shortcuts ──────────────────────────────────────────────
    if (scene === "store") {
      unsubs.push(
        manager.register({
          key: "a",
          label: "A",
          description: "Add focused product to cart",
          action: () => {
            const idx = focusedRef.current;
            if (idx !== null && itemIds[idx]) {
              earcon.play("select");
              triggerDomAction(`add-to-cart-${itemIds[idx]}`);
            } else {
              announceRef.current("No product selected. Press 1 to 4 to select one first.");
            }
          },
        }),
        manager.register({
          key: "c",
          label: "C",
          description: "Hear cart contents",
          action: () => queryRef.current("What is in my cart and what is the total?"),
        }),
        manager.register({
          key: "o",
          label: "O",
          description: "Checkout",
          action: () => queryRef.current("Checkout my cart."),
        }),
        manager.register({
          key: "enter",
          label: "Enter",
          description: "Checkout",
          action: () => queryRef.current("Checkout my cart."),
        }),
      );
    }

    // ── News-specific shortcuts ───────────────────────────────────────────────
    if (scene === "news") {
      unsubs.push(
        manager.register({
          key: "o",
          label: "O",
          description: "Open focused article",
          action: () => {
            const idx = focusedRef.current;
            if (idx !== null && itemIds[idx]) {
              earcon.play("open");
              triggerDomAction(`read-${itemIds[idx]}`);
            }
          },
        }),
        manager.register({
          key: "enter",
          label: "Enter",
          description: "Open focused article",
          action: () => {
            const idx = focusedRef.current;
            if (idx !== null && itemIds[idx]) {
              earcon.play("open");
              triggerDomAction(`read-${itemIds[idx]}`);
            }
          },
        }),
        manager.register({
          key: "m",
          label: "M",
          description: "Mark focused article as read",
          action: () => {
            const idx = focusedRef.current;
            if (idx !== null && itemIds[idx]) {
              earcon.play("success");
              triggerDomAction(`mark-read-${itemIds[idx]}`);
              announceRef.current("Marked as read.");
            }
          },
        }),
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [scene, itemCount, navigate, setFocusedIndex, earcon]);

  return {
    focusedIndex,
    showShortcuts,
    setShowShortcuts,
    shortcutRows: scene === "store" ? STORE_SHORTCUTS : NEWS_SHORTCUTS,
  };
}
