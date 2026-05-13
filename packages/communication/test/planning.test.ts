import { describe, expect, it } from "vitest";

import {
  buildDeterministicPlanFromText,
  buildDeterministicPlanFromUnits,
  buildRendererQueue,
} from "../src/planning";

describe("deterministic planning", () => {
  it("maps a healthcare phrase onto known lexemes", () => {
    const plan = buildDeterministicPlanFromText("I need medicine for pain.", {
      domain: "healthcare",
    });

    const lexemes = plan.clauses.flatMap((clause) =>
      clause.tokens.flatMap((token) => (token.type === "lexeme" ? [token.lexemeId] : [])),
    );

    expect(lexemes).toEqual(expect.arrayContaining(["NEED", "MEDICINE", "PAIN"]));
    expect(plan.track).toBe("deterministic-fallback");
  });

  it("preserves unknown names through fingerspelling", () => {
    const plan = buildDeterministicPlanFromText("My name is Amina.", {
      domain: "general",
    });

    const fingerspell = plan.clauses.flatMap((clause) =>
      clause.tokens.flatMap((token) => (token.type === "fingerspell" ? [token.text] : [])),
    );

    expect(fingerspell).toContain("AMINA");
  });

  it("builds renderer frames from sign units without semantic planning", () => {
    const plan = buildDeterministicPlanFromUnits(["HELLO", "/", "W", "A", "T", "E", "R"]);
    expect(buildRendererQueue(plan)).toEqual([
      "HELLO",
      "/",
      "FS:W",
      "FS:A",
      "FS:T",
      "FS:E",
      "FS:R",
    ]);
  });
});
