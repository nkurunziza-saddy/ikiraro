import type {
  SignGraph,
  CompiledSign,
  MotionInstruction,
  MotionType,
  SignNode,
  ArmTarget,
} from "../types";
import { getTransitionRule } from "./transition-rules";
import type { EpisodicSpatialMemory } from "../linguistic/spatial-grammar";
import { LanguageRegistry } from "../language-registry";

export class SignCompiler {
  private signCache = new Map<string, CompiledSign>();

  public compile(graph: SignGraph, memory: EpisodicSpatialMemory): MotionInstruction[] {
    const instructions: MotionInstruction[] = [];
    let currentTime = 0;

    const compiledSigns: CompiledSign[] = [];

    // Pass 2: Engine validates and compiles each node
    for (const node of graph.nodes) {
      const compiled = this.compileNode(node, memory, graph.intent);
      compiledSigns.push(compiled);
    }

    // Inject transitions and build timeline
    for (let i = 0; i < compiledSigns.length; i++) {
      const current = compiledSigns[i]!;
      const next = compiledSigns[i + 1];

      let transitionDuration = 0;
      if (next) {
        const transition = getTransitionRule(current.bodyMotion, next.bodyMotion);
        current.transitions.exit = transition;
        next.transitions.entry = transition;
        transitionDuration = transition.durationMs;
      }

      instructions.push({
        bodyMotion: current.bodyMotion,
        startTime: currentTime,
        endTime: currentTime + current.duration,
        spatialTarget: current.spatialTarget,
        armTarget: current.armTarget,
        handshape: current.handshape,
        emphasisCurve: current.emphasisCurve,
        facial: current.facial,
        // If there's a transition, next sign anticipates by starting early
        coarticulationHint: next ? "blend" : "snap",
      });

      // Advance time (anticipation: next sign starts before this one fully ends if transitioning)
      currentTime += current.duration - transitionDuration * 0.5;
    }

    return instructions;
  }

  private compileNode(
    node: SignNode,
    memory: EpisodicSpatialMemory,
    intent: SignGraph["intent"],
  ): CompiledSign {
    const spatialTarget = memory.getAnchor(node.spatialAnchor);

    const cacheKey = `${node.gloss}|${node.role}|${node.emphasis}|${spatialTarget ? "spatial" : "neutral"}`;
    if (this.signCache.has(cacheKey)) {
      return { ...this.signCache.get(cacheKey)! };
    }

    // Resolve motion and handshape (falling back to plugin for now)
    let bodyMotion: MotionType = "none";
    let handshape = node.gloss; // Let the pose library resolve it
    let armTarget: ArmTarget | undefined = undefined;

    const lang = LanguageRegistry.getActive();

    if (node.tokenType === "fingerspell") {
      bodyMotion = lang.fingerspellMotions[node.gloss] ?? "none";
    } else if (node.tokenType === "number") {
      bodyMotion = lang.numberMotions[node.gloss] ?? "none";
      armTarget = lang.numberArmTarget;
    } else {
      const lexeme = lang.getLexemePose(node.gloss);
      bodyMotion = lexeme?.motion ?? "none";
      armTarget = lexeme?.armTarget;
    }

    // Timing normalization based on emphasis
    let duration = 600; // Base duration
    let emphasisCurve: CompiledSign["emphasisCurve"] = "linear";

    if (node.emphasis === 2) {
      duration = 900;
      emphasisCurve = "impact";
    } else if (node.emphasis === 1) {
      duration = 750;
      emphasisCurve = "accelerate";
    }

    // Elision / Movement reduction (Pass 2 validation)
    // If it's a modifier with no motion, it just affects the face/hands, make it fast
    if (node.role === "modifier" && bodyMotion === "none") {
      duration = 300;
    }

    let facial = "neutral";
    if (intent === "question") facial = "inquisitive";
    else if (node.emphasis > 0) facial = "assertive";

    const compiled: CompiledSign = {
      id: crypto.randomUUID?.() ?? Math.random().toString(),
      bodyMotion,
      handshape,
      facial,
      transitions: { entry: null, exit: null },
      duration,
      spatialTarget,
      armTarget,
      emphasisCurve,
    };

    this.signCache.set(cacheKey, compiled);
    return { ...compiled };
  }
}
