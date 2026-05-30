import type { IkiraroPlugin, PluginContext } from "../types";
/**
 * Captures sign units from a physical or virtual keyboard.
 * Enable via `createIkiraro({ keyboard: true })`.
 */
export class KeyboardPlugin implements IkiraroPlugin {
  name = "keyboard";
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
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handler);
    }
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
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("keydown", handler);
      }
    };
  }
}
