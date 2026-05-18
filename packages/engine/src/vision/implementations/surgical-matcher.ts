import { ASL_ALPHABET } from "../handshapes";
import type { FeatureVector, ISignMatcher, HandshapeDefinition } from "../../types";

/**
 * A heuristic-based sign matcher that uses fingerprints and disambiguation rules.
 * "Surgical" refers to its precision and reliance on manually tuned heuristics.
 */
export class IkiraroSurgicalMatcher implements ISignMatcher {
  private definitionsByFingerprint = new Map<string, HandshapeDefinition[]>();

  constructor(definitions: HandshapeDefinition[] = ASL_ALPHABET) {
    for (const def of definitions) {
      const list = this.definitionsByFingerprint.get(def.fingerprint) ?? [];
      list.push(def);
      this.definitionsByFingerprint.set(def.fingerprint, list);
    }
  }

  match(vector: FeatureVector): Array<{ name: string; score: number }> {
    if (!vector.isValid) {
      return [];
    }
    const relevantDefs = this.definitionsByFingerprint.get(vector.fingerprint) ?? [];
    const candidates: Array<{ name: string; score: number }> = [];

    for (const def of relevantDefs) {
      let score = def.disambiguate ? def.disambiguate(vector) : 0.7;

      // Enforce motion requirements (e.g., for J and Z)
      if (def.requiresMotion && !vector.isMoving) {
        score *= 0.2;
      }

      candidates.push({ name: def.name, score });
    }

    return candidates.sort((a, b) => b.score - a.score);
  }
}
