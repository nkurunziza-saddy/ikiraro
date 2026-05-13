import { describe, expect, it } from "vitest";

import {
  EVALUATION_SUITES,
  getEvaluationReadinessSummary,
  runDeterministicBenchmarkCase,
} from "../src/evaluation";

describe("evaluation coverage", () => {
  it("covers all configured domains across held-out and continuous suites", () => {
    const summary = getEvaluationReadinessSummary();
    expect(summary.domains).toEqual(
      expect.arrayContaining(["general", "support", "healthcare", "education"]),
    );
    expect(summary.suites).toBeGreaterThanOrEqual(2);
  });

  it("keeps the required benchmark directions in place", () => {
    expect(EVALUATION_SUITES.map((suite) => suite.benchmarkDirection)).toEqual(
      expect.arrayContaining(["continuous-asl", "held-out-phrases"]),
    );
  });

  it("makes the deterministic baseline pass every seed benchmark case", () => {
    for (const suite of EVALUATION_SUITES) {
      for (const testCase of suite.cases) {
        const result = runDeterministicBenchmarkCase(testCase);
        expect(result.matched).toBe(true);
      }
    }
  });
});
