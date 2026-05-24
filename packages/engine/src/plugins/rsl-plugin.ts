import type { SignLanguagePlugin } from "../types";
import { ASLPlugin } from "./asl-plugin";

// Rwanda Sign Language (RSL) Stub Plugin
// For now, it heavily borrows from ASL but demonstrates the capability to provide unique mappings.
export const RSLPlugin: SignLanguagePlugin = {
  id: "rsl",
  name: "Rwanda Sign Language",

  nlp: {
    // Basic Kinyarwanda question words mapped for testing
    questionWords: new Set(["IKI", "HEHE", "NDE", "RYARI", "KUKI", "GUTE"]),
    pronouns: {
      NJYE: "SELF",
      NJYEWE: "SELF",
      WE: "YOU",
      WEWE: "YOU",
      UWO: "THAT",
      BO: "THAT", // Kinyarwanda context depends heavily on noun classes, this is simplified
    },
    actionWords: new Set(["KUGENDA", "GUKORA", "KUBONA", "KUMVA", "KURYA", "GUSHAKA", "GUKUNDA"]),
    modifierWords: new Set(["OYA", "CYANE", "ITEKA", "NTA NA RIMWE"]),
  },

  // RSL uses similar manual alphabet for many letters, but motions can differ
  fingerspellMotions: ASLPlugin.fingerspellMotions,

  numberMotions: ASLPlugin.numberMotions,
  numberArmTarget: ASLPlugin.numberArmTarget,

  // Fallback to ASL handshapes for now until custom RSL shapes are defined
  getHandshape: ASLPlugin.getHandshape,

  // Custom lexeme poses would go here. For now, empty fallback.
  getLexemePose: (gloss: string) => {
    // Example of custom mapping override
    if (gloss === "AMAKURU") {
      return ASLPlugin.getLexemePose("HELLO");
    }
    return ASLPlugin.getLexemePose(gloss); // fallback for testing
  },
};
