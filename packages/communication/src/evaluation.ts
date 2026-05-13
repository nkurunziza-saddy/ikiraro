import { buildDeterministicPlanFromText } from "./planning";
import type { TranslationDomain } from "./types";

export type EvaluationCase = {
  id: string;
  domain: TranslationDomain;
  input: string;
  expectedIncludes: string[];
};

export type EvaluationSuite = {
  id: string;
  title: string;
  focus: string;
  benchmarkDirection: "continuous-asl" | "held-out-phrases";
  reference: string;
  cases: EvaluationCase[];
};

export const HELD_OUT_PHRASE_CASES: EvaluationCase[] = [
  {
    id: "support-bathroom",
    domain: "support",
    input: "Where is the bathroom?",
    expectedIncludes: ["WHERE", "BATHROOM"],
  },
  {
    id: "healthcare-medicine",
    domain: "healthcare",
    input: "I need medicine for pain.",
    expectedIncludes: ["NEED", "MEDICINE", "PAIN"],
  },
  {
    id: "education-interpreter",
    domain: "education",
    input: "I need an interpreter for school.",
    expectedIncludes: ["NEED", "INTERPRETER", "SCHOOL"],
  },
  {
    id: "general-name",
    domain: "general",
    input: "My name is Amina.",
    expectedIncludes: ["NAME", "AMINA"],
  },
];

export const CONTINUOUS_ASL_CASES: EvaluationCase[] = [
  {
    id: "how2sign-healthcare",
    domain: "healthcare",
    input: "Please help me find medicine and water.",
    expectedIncludes: ["HELP", "FIND", "MEDICINE", "WATER"],
  },
  {
    id: "how2sign-support",
    domain: "support",
    input: "I need help finding the right bathroom.",
    expectedIncludes: ["NEED", "HELP", "FIND", "BATHROOM"],
  },
];

export const EVALUATION_SUITES: EvaluationSuite[] = [
  {
    id: "continuous-asl-how2sign",
    title: "Continuous ASL",
    focus: "Sentence-level, gloss-free evaluation direction for real signing flow.",
    benchmarkDirection: "continuous-asl",
    reference: "How2Sign and recent gloss-free SLT work",
    cases: CONTINUOUS_ASL_CASES,
  },
  {
    id: "held-out-phrases-all-domains",
    title: "Held-out Phrase Sets",
    focus: "Domain-balanced phrases kept separate from demo copy.",
    benchmarkDirection: "held-out-phrases",
    reference: "General, support, healthcare, and education phrase coverage",
    cases: HELD_OUT_PHRASE_CASES,
  },
];

export function getEvaluationReadinessSummary() {
  const domains = new Set<TranslationDomain>();

  for (const suite of EVALUATION_SUITES) {
    for (const testCase of suite.cases) {
      domains.add(testCase.domain);
    }
  }

  return {
    suites: EVALUATION_SUITES.length,
    domains: [...domains],
    heldOutCases: HELD_OUT_PHRASE_CASES.length,
    continuousCases: CONTINUOUS_ASL_CASES.length,
  };
}

export function runDeterministicBenchmarkCase(testCase: EvaluationCase): {
  matched: boolean;
  output: string[];
} {
  const plan = buildDeterministicPlanFromText(testCase.input, {
    domain: testCase.domain,
  });
  const output = plan.clauses.flatMap((clause) =>
    clause.tokens.map((token) => {
      if (token.type === "lexeme") {
        return token.lexemeId;
      }

      if (token.type === "fingerspell") {
        return token.text;
      }

      if (token.type === "number") {
        return token.value;
      }

      if (token.type === "pointing") {
        return token.target.toUpperCase();
      }

      return "/";
    }),
  );

  const matched = testCase.expectedIncludes.every((expected) =>
    output.some((candidate) => candidate.includes(expected)),
  );

  return {
    matched,
    output,
  };
}
