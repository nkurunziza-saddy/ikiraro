import type { IkiraroPlugin, PluginContext } from "../types";
import { VisionSystem } from "../vision-system";
import type { HandProcessor, VisionEventMap } from "@ikiraro/engine/vision";

/**
 * Adapts the VisionSystem into a Ikiraro Plugin.
 * It emits vision events into the runtime bus.
 */
export class VisionPlugin implements IkiraroPlugin {
  name = "vision";
  private vision: VisionSystem;

  constructor(processor: HandProcessor) {
    this.vision = new VisionSystem(processor);
  }

  setup(ctx: PluginContext) {
    const handleStatusChange = (status: VisionEventMap["status-change"]) => {
      ctx.emit({
        type: "vision:status-change",
        payload: status,
        timestamp: Date.now(),
        source: this.name,
      });
    };

    const handleTrackingUpdate = (tracking: VisionEventMap["tracking-update"]) => {
      ctx.emit({
        type: "vision:tracking",
        payload: tracking,
        timestamp: Date.now(),
        source: this.name,
      });
    };

    const handleSignDetected = (data: VisionEventMap["sign-detected"]) => {
      const now = Date.now();
      ctx.emit({
        type: "input:token",
        payload: {
          id: `vision-${now}`,
          value: data.sign,
          type: "sign",
          source: this.name,
          timestamp: now,
          confidence: data.confidence,
          stability: "stable",
        },
        timestamp: now,
        source: this.name,
      });
    };

    const handleWordCommitted = (word: VisionEventMap["word-committed"]) => {
      const now = Date.now();
      ctx.emit({
        type: "input:token",
        payload: {
          id: `vision-commit-${now}`,
          value: word,
          type: "sign",
          source: this.name,
          timestamp: now,
          confidence: 1.0,
          stability: "committed",
        },
        timestamp: now,
        source: this.name,
      });
    };

    this.vision.on("status-change", handleStatusChange);
    this.vision.on("tracking-update", handleTrackingUpdate);
    this.vision.on("sign-detected", handleSignDetected);
    this.vision.on("word-committed", handleWordCommitted);

    // Handle incoming commands from other plugins (e.g., reset)
    ctx.subscribe("vision:cmd:start", (event) => {
      this.vision.start(event.payload.videoElement);
    });

    ctx.subscribe("vision:cmd:stop", () => {
      this.vision.stop();
    });

    return [
      () => this.vision.off("status-change", handleStatusChange),
      () => this.vision.off("tracking-update", handleTrackingUpdate),
      () => this.vision.off("sign-detected", handleSignDetected),
      () => this.vision.off("word-committed", handleWordCommitted),
    ];
  }

  teardown() {
    this.vision.stop();
  }
}
