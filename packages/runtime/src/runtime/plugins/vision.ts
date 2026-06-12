import type { IkiraroPlugin, PluginContext } from "../types";
import { VisionSystem } from "../vision-system";
import type { HandProcessor, VisionEventMap } from "@ikiraro/engine/vision";
/**
 * Adapts the VisionSystem into an Ikiraro Plugin.
 * Bridges camera tracking events into the runtime event bus.
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
    const handleWordCommitted = (token: VisionEventMap["word-committed"]) => {
      const now = Date.now();
      const value =
        token.type === "fingerspell"
          ? token.text
          : token.type === "lexeme"
            ? token.lexemeId
            : token.type === "number"
              ? token.value
              : token.type === "pointing"
                ? token.target
                : "";
      ctx.emit({
        type: "input:token",
        payload: {
          id: `vision-commit-${now}`,
          value,
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
    const unsubStatus = this.vision.on("status-change", handleStatusChange);
    const unsubTracking = this.vision.on("tracking-update", handleTrackingUpdate);
    const unsubSign = this.vision.on("sign-detected", handleSignDetected);
    const unsubWord = this.vision.on("word-committed", handleWordCommitted);
    const unsubStart = ctx.subscribe("vision:cmd:start", (event) => {
      this.vision.start(event.payload.videoElement);
    });
    const unsubStop = ctx.subscribe("vision:cmd:stop", () => {
      this.vision.stop();
    });
    return [
      unsubStatus,
      unsubTracking,
      unsubSign,
      unsubWord,
      unsubStart,
      unsubStop,
      () => this.vision.stop(),
    ];
  }
}
