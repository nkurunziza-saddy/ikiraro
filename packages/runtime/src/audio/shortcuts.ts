import type { AccessibilityShortcutManagerOptions, ShortcutSpec } from "./types";

type FocusChangeListener = (index: number | null) => void;
type HelpToggleListener = (visible: boolean) => void;

/**
 * SDK-level keyboard shortcut manager with built-in double-tap detection.
 *
 * Usage:
 *   const manager = new AccessibilityShortcutManager();
 *   const unsub = manager.register({ key: 'f', label: 'Read', description: '...', action: () => ... });
 *   manager.mount(); // attach keydown listener
 *   // cleanup:
 *   unsub();
 *   manager.unmount();
 *
 * Double-tap: if `doubleTapAction` is provided, pressing the same key twice within
 * `doubleTapMs` (default 400 ms) triggers `doubleTapAction` instead of `action`.
 *
 * State:
 *   manager.getFocusedIndex() — currently focused item (null = none)
 *   manager.setFocusedIndex(n)
 *   manager.onFocusChange(cb) → unsubscribe
 *   manager.onHelpToggle(cb) → unsubscribe
 */
export class AccessibilityShortcutManager {
  private specs = new Map<string, ShortcutSpec>();
  private doubleTapMs: number;

  private lastKey: string | null = null;
  private lastKeyTime = 0;

  private focusedIndex: number | null = null;
  private helpVisible = false;

  private focusListeners = new Set<FocusChangeListener>();
  private helpListeners = new Set<HelpToggleListener>();

  private boundHandler: ((e: KeyboardEvent) => void) | null = null;
  private mounted = false;

  constructor(options: AccessibilityShortcutManagerOptions = {}) {
    this.doubleTapMs = options.doubleTapMs ?? 400;
  }

  /**
   * Register a shortcut. Returns an unregister function.
   * Registering the same key twice merges — the last registration wins.
   */
  register(spec: ShortcutSpec): () => void {
    const key = spec.key.toLowerCase();
    this.specs.set(key, spec);
    return () => {
      if (this.specs.get(key) === spec) this.specs.delete(key);
    };
  }

  /** Register multiple shortcuts at once. Returns a single unregister function. */
  registerMany(specs: ShortcutSpec[]): () => void {
    const unsubs = specs.map((s) => this.register(s));
    return () => unsubs.forEach((u) => u());
  }

  /** Attach the keydown listener to `document`. Call once on mount. */
  mount(): void {
    if (this.mounted) return;
    this.boundHandler = this.handleKey.bind(this);
    document.addEventListener("keydown", this.boundHandler);
    this.mounted = true;
  }

  /** Remove the keydown listener. Call on unmount. */
  unmount(): void {
    if (!this.mounted || !this.boundHandler) return;
    document.removeEventListener("keydown", this.boundHandler);
    this.boundHandler = null;
    this.mounted = false;
  }

  // ── State ───────────────────────────────────────────────────────────────────

  getFocusedIndex(): number | null {
    return this.focusedIndex;
  }

  setFocusedIndex(index: number | null): void {
    if (this.focusedIndex === index) return;
    this.focusedIndex = index;
    this.focusListeners.forEach((fn) => fn(index));
  }

  onFocusChange(listener: FocusChangeListener): () => void {
    this.focusListeners.add(listener);
    return () => this.focusListeners.delete(listener);
  }

  isHelpVisible(): boolean {
    return this.helpVisible;
  }

  setHelpVisible(visible: boolean): void {
    if (this.helpVisible === visible) return;
    this.helpVisible = visible;
    this.helpListeners.forEach((fn) => fn(visible));
  }

  onHelpToggle(listener: HelpToggleListener): () => void {
    this.helpListeners.add(listener);
    return () => this.helpListeners.delete(listener);
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  private handleKey(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement | null)?.tagName ?? "";

    const key = e.key.toLowerCase();
    const spec = this.specs.get(key);

    if (!spec) return;
    if ((tag === "INPUT" || tag === "TEXTAREA") && !spec.allowInInput) return;

    e.preventDefault();

    const now = Date.now();
    const isDoubleTap =
      key === this.lastKey && now - this.lastKeyTime <= this.doubleTapMs && !!spec.doubleTapAction;

    // Reset double-tap tracking
    this.lastKey = isDoubleTap ? null : key;
    this.lastKeyTime = isDoubleTap ? 0 : now;

    if (isDoubleTap && spec.doubleTapAction) {
      spec.doubleTapAction();
    } else {
      spec.action();
    }
  }
}
