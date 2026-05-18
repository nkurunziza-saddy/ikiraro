import type { SensaPlugin, PluginContext } from "../types";
import { VisionSystem } from "../vision-system";
import type { HandProcessor } from "@sensa/engine/vision";

/**
 * Adapts the VisionSystem into a Sensa Plugin.
 * It emits vision events into the runtime bus.
 */
export class VisionPlugin implements SensaPlugin {
  name = "vision";
  private vision: VisionSystem;

  constructor(processor: HandProcessor) {
    this.vision = new VisionSystem(processor);
  }

  setup(ctx: PluginContext) {
    this.vision.on("status-change", (status) => {
      ctx.emit({
        type: "vision:status-change",
        payload: status,
        timestamp: Date.now(),
        source: this.name,
      });
    });

    this.vision.on("tracking-update", (tracking) => {
      ctx.emit({
        type: "vision:tracking",
        payload: tracking,
        timestamp: Date.now(),
        source: this.name,
      });
    });

    this.vision.on("sign-detected", (data) => {
      ctx.emit({
        type: "input:token",
        payload: {
          id: `vision-${Date.now()}`,
          value: data.sign,
          type: "sign",
          source: this.name,
          timestamp: Date.now(),
          confidence: data.confidence,
          stability: "stable",
        },
        timestamp: Date.now(),
        source: this.name,
      });
    });

    this.vision.on("word-committed", (word) => {
      ctx.emit({
        type: "input:token",
        payload: {
          id: `vision-commit-${Date.now()}`,
          value: word,
          type: "sign",
          source: this.name,
          timestamp: Date.now(),
          confidence: 1.0,
          stability: "committed",
        },
        timestamp: Date.now(),
        source: this.name,
      });
    });

    // Handle incoming commands from other plugins (e.g., reset)
    ctx.subscribe("vision:cmd:start", (event) => {
      this.vision.start(event.payload.videoElement);
    });

    ctx.subscribe("vision:cmd:stop", () => {
      this.vision.stop();
    });
  }

  teardown() {
    this.vision.stop();
  }
}
