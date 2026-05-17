import type { SensaPlugin, PluginContext } from "../types";

/**
 * Captures sign units from a physical or virtual keyboard.
 */
export class KeyboardPlugin implements SensaPlugin {
  name = "keyboard";

  setup(ctx: PluginContext) {
    const handler = (e: KeyboardEvent) => {
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        ctx.emit({
          type: "input:token",
          payload: {
            id: `kb-${Date.now()}`,
            value: e.key.toUpperCase(),
            type: "text",
            source: this.name,
            timestamp: Date.now(),
            confidence: 1.0,
            stability: "committed",
          },
          timestamp: Date.now(),
          source: this.name,
        });
      }
    };

    window.addEventListener("keydown", handler);

    // We can also subscribe to virtual keyboard events from the UI
    ctx.subscribe("keyboard:cmd:press", (event) => {
      ctx.emit({
        type: "input:token",
        payload: {
          id: `vkb-${Date.now()}`,
          value: event.payload.unit,
          type: "text",
          source: this.name,
          timestamp: Date.now(),
          confidence: 1.0,
          stability: "committed",
        },
        timestamp: Date.now(),
        source: this.name,
      });
    });
  }
}
