import type { IkiraroPlugin, PluginContext } from "../types";

/**
 * Captures sign units from a physical or virtual keyboard.
 */
export class KeyboardPlugin implements IkiraroPlugin {
  name = "keyboard";
  private teardownHandler: (() => void) | null = null;

  setup(ctx: PluginContext) {
    const handler = (event: KeyboardEvent) => {
      if (event.key.length !== 1 || !/[a-zA-Z]/.test(event.key)) return;

      const now = Date.now();
      ctx.emit({
        type: "input:token",
        payload: {
          id: `kb-${now}`,
          value: event.key.toUpperCase(),
          type: "text",
          source: this.name,
          timestamp: now,
          confidence: 1.0,
          stability: "committed",
        },
        timestamp: now,
        source: this.name,
      });
    };

    window.addEventListener("keydown", handler);
    this.teardownHandler = () => window.removeEventListener("keydown", handler);

    ctx.subscribe("keyboard:cmd:press", (event) => {
      const now = Date.now();
      ctx.emit({
        type: "input:token",
        payload: {
          id: `vkb-${now}`,
          value: event.payload.unit,
          type: "text",
          source: this.name,
          timestamp: now,
          confidence: 1.0,
          stability: "committed",
        },
        timestamp: now,
        source: this.name,
      });
    });
  }

  teardown() {
    this.teardownHandler?.();
    this.teardownHandler = null;
  }
}
