import { LEXEME_POSES } from "../planning/lexeme-poses";
import { ASL_HAND_POSES } from "../planning/pose-library";
import type { SignLanguagePlugin } from "../types";

export const ASLPlugin: SignLanguagePlugin = {
  id: "asl",
  name: "American Sign Language",

  nlp: {
    questionWords: new Set(["WHAT", "WHERE", "WHO", "WHEN", "WHY", "HOW"]),
    pronouns: {
      I: "SELF",
      ME: "SELF",
      MY: "SELF",
      YOU: "YOU",
      YOUR: "YOU",
      HE: "THAT",
      SHE: "THAT",
      HIM: "THAT",
      HER: "THAT",
      IT: "THAT",
      THEY: "THAT",
      THEM: "THAT",
    },
    actionWords: new Set(["GO", "DO", "MAKE", "SEE", "HEAR", "EAT", "WANT", "LIKE"]),
    modifierWords: new Set(["NOT", "VERY", "ALWAYS", "NEVER"]),
  },

  fingerspellMotions: {
    J: "j-trace",
    Z: "z-trace",
    G: "g-push",
    H: "h-slide",
    D: "d-arc",
    N: "n-dip",
    K: "k-push",
  },

  numberMotions: {
    "6": "wrist-twist",
    "7": "wrist-twist",
    "8": "wrist-twist",
    "9": "wrist-twist",
  },

  numberArmTarget: { rArmX: 0.74, rArmZ: -0.5, rForeZ: -1.44, rForeY: 0.46 },

  getHandshape: (key: string) => ASL_HAND_POSES[key.toUpperCase()] ?? null,
  getLexemePose: (gloss: string) => LEXEME_POSES[gloss.toUpperCase()] ?? null,
};
