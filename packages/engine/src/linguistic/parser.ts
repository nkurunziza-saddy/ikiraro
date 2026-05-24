import type { SignPlan, SignGraph, SignNode, SignToken } from "../types";
import { LanguageRegistry } from "../language-registry";

export class LinguisticParser {
  /**
   * Transforms a flat SignPlan (from the LLM or Deterministic planner)
   * into a structured SignGraph, extracting implied spatial anchors.
   *
   * In Pass 1, the LLM provides glossTokens. We heuristically assign roles
   * and extract anchors here. (A more advanced LLM prompt would return JSON
   * directly mapping to SignNode).
   */
  public parse(plan: SignPlan): SignGraph {
    const nodes: SignNode[] = [];

    // For now, we assume statements. The LLM could provide this in metadata later.
    let intent: SignGraph["intent"] = "statement";

    if (plan.sourceText.includes("?")) {
      intent = "question";
    } else if (plan.sourceText.match(/^(stop|do|go|please|dont)/i)) {
      intent = "command";
    }

    // Process all clauses and tokens
    for (const clause of plan.clauses) {
      for (const token of clause.tokens) {
        if (token.type === "pause") continue;
        if (token.type === "fingerspell") {
          const letters = token.text
            .toUpperCase()
            .replace(/[^A-Z]/g, "")
            .split("");
          for (const letter of letters) {
            nodes.push({
              gloss: letter,
              role: this.guessRole(letter, token),
              emphasis: token.emphasis === "high" ? 2 : token.emphasis === "normal" ? 1 : 0,
              tokenType: "fingerspell",
            });
          }
          continue;
        }

        if (token.type === "number") {
          const digits = token.value.split("");
          for (const digit of digits) {
            nodes.push({
              gloss: digit,
              role: this.guessRole(digit, token),
              emphasis: token.emphasis === "high" ? 2 : token.emphasis === "normal" ? 1 : 0,
              tokenType: "number",
            });
          }
          continue;
        }

        const gloss = this.getGlossFromToken(token);
        if (!gloss) continue;

        // Basic heuristic role assignment (this is a placeholder for true NLP tagging)
        const role = this.guessRole(gloss, token);

        let spatialAnchor: string | undefined = undefined;

        const lang = LanguageRegistry.getActive();
        // Infer spatial anchors from pointing tokens or pronouns
        if (token.type === "pointing") {
          spatialAnchor = token.target;
        } else if (lang.nlp.pronouns[gloss]) {
          spatialAnchor = lang.nlp.pronouns[gloss];
        }

        nodes.push({
          gloss,
          role,
          emphasis: token.emphasis === "high" ? 2 : token.emphasis === "normal" ? 1 : 0,
          spatialAnchor,
          tokenType: token.type,
        });
      }
    }

    return {
      intent,
      nodes,
    };
  }

  private getGlossFromToken(token: SignToken): string | null {
    if (token.type === "lexeme") return token.lexemeId;
    if (token.type === "fingerspell") return token.text;
    if (token.type === "number") return token.value;
    if (token.type === "pointing") return `POINT-${token.target}`;
    return null;
  }

  private guessRole(gloss: string, token: SignToken): SignNode["role"] {
    if (token.type === "pointing") return "topic";

    const lang = LanguageRegistry.getActive();
    if (lang.nlp.pronouns[gloss]) return "topic";
    if (lang.nlp.actionWords.has(gloss)) return "action";
    if (lang.nlp.modifierWords.has(gloss)) return "modifier";

    return "object";
  }
}
