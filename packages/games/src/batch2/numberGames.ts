import { mulberry32, pick } from "../rng.js";
import { batchCopy, batchPhrase } from "./copy.js";
import { answerStep, batchMeta, numberOptions, roundLabel } from "./helpers.js";
import type { BatchGame, BatchTwoState, NumberTrial } from "./types.js";

type SumState = Extract<BatchTwoState, { game: "sum-check" }>;
type StepsState = Extract<BatchTwoState, { game: "number-steps" }>;

const ROUNDS = 4;
export const STEP_SIZES: readonly number[] = [2, 3, 4, 5, -2, -3];

function whole(rng: () => number, low: number, high: number): number {
  return low + Math.floor(rng() * (high - low + 1));
}

function numberStep<S extends SumState | StepsState>(state: S, choiceId: string) {
  const trial = state.trials[state.index];
  if (!trial || !/^n-\d+$/.test(choiceId)) return null;
  const value = Number(choiceId.slice(2));
  if (!trial.options.includes(value)) return null;
  return answerStep(state, value === trial.answer);
}

function numberChoices(trial: NumberTrial) {
  return trial.options.map((value) => ({ id: `n-${value}`, label: String(value) }));
}

export const sumCheck: BatchGame<SumState> = {
  meta: batchMeta("sum-check", "arithmetic"),
  start(seed) {
    const rng = mulberry32(seed);
    const trials: NumberTrial[] = [];
    for (let round = 0; round < ROUNDS; round += 1) {
      const operator = round % 2 === 0 ? "+" : "-";
      const first = whole(rng, 2, 15);
      const second = whole(rng, 2, 12);
      const terms = operator === "-" && second > first ? [second, first] : [first, second];
      const a = terms[0] ?? 0;
      const b = terms[1] ?? 0;
      const answer = operator === "+" ? a + b : a - b;
      trials.push({ terms, operator, answer, options: numberOptions(rng, answer, [10, 1, -1, 2, -2]) });
    }
    return { game: "sum-check", index: 0, trials };
  },
  step: numberStep,
  describe(state, language) {
    const trial = state.trials[state.index];
    if (!trial) return { prompt: "", detail: "", choices: [] };
    return {
      prompt: batchPhrase("sum.prompt", language, {
        round: roundLabel(language, state.index, state.trials.length),
        a: trial.terms[0] ?? 0,
        b: trial.terms[1] ?? 0,
        operator: batchCopy(trial.operator === "+" ? "sum.plus" : "sum.minus", language),
      }),
      detail: batchCopy("sum.detail", language),
      choices: numberChoices(trial),
    };
  },
  solution(state) {
    const trial = state.trials[state.index];
    return trial ? [`n-${trial.answer}`] : [];
  },
};

export const numberSteps: BatchGame<StepsState> = {
  meta: batchMeta("number-steps", "number_pattern"),
  start(seed) {
    const rng = mulberry32(seed);
    const trials: NumberTrial[] = [];
    for (let round = 0; round < ROUNDS; round += 1) {
      const step = pick(rng, STEP_SIZES);
      const start = whole(rng, 1, 12) + (step < 0 ? 20 : 0);
      const terms = [0, 1, 2, 3].map((position) => start + position * step);
      const answer = start + 4 * step;
      trials.push({ terms, operator: "+", answer, options: numberOptions(rng, answer, [step, 1, -1]) });
    }
    return { game: "number-steps", index: 0, trials };
  },
  step: numberStep,
  describe(state, language) {
    const trial = state.trials[state.index];
    if (!trial) return { prompt: "", detail: "", choices: [] };
    return {
      prompt: batchPhrase("steps.prompt", language, {
        round: roundLabel(language, state.index, state.trials.length),
        terms: trial.terms.join(", "),
      }),
      detail: batchCopy("steps.detail", language),
      choices: numberChoices(trial),
    };
  },
  solution(state) {
    const trial = state.trials[state.index];
    return trial ? [`n-${trial.answer}`] : [];
  },
};
