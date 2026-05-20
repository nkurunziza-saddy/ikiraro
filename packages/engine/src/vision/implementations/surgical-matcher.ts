import { ASL_ALPHABET } from "../handshapes";
import type { FeatureVector, ISignMatcher, HandshapeDefinition } from "../../types";

const ADJACENT_FINGERPRINT_PENALTY = 0.88;
const MIN_CANDIDATE_SCORE = 0.55;

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

    const relevantDefs = this.getRelevantDefinitions(vector.fingerprint);
    const candidates: Array<{ name: string; score: number }> = [];

    for (const { definition: def, penalty } of relevantDefs) {
      let score = def.disambiguate ? def.disambiguate(vector) : 0.7;

      // Enforce motion requirements (e.g., for J and Z)
      if (def.requiresMotion && !vector.isMoving) {
        score *= 0.2;
      }

      score *= penalty;
      if (score >= MIN_CANDIDATE_SCORE) {
        candidates.push({ name: def.name, score });
      }
    }

    return candidates.sort((a, b) => b.score - a.score);
  }

  private getRelevantDefinitions(
    fingerprint: string,
  ): Array<{ definition: HandshapeDefinition; penalty: number }> {
    const exact = this.definitionsByFingerprint.get(fingerprint);
    if (exact && exact.length > 0) {
      return exact.map((definition) => ({ definition, penalty: 1 }));
    }

    const adjacent = new Map<string, HandshapeDefinition>();
    for (let i = 0; i < fingerprint.length; i++) {
      const flipped =
        fingerprint.slice(0, i) + (fingerprint[i] === "1" ? "0" : "1") + fingerprint.slice(i + 1);
      for (const definition of this.definitionsByFingerprint.get(flipped) ?? []) {
        adjacent.set(definition.name, definition);
      }
    }

    return [...adjacent.values()].map((definition) => ({
      definition,
      penalty: ADJACENT_FINGERPRINT_PENALTY,
    }));
  }
}
