import { numberOptions, answerStep } from "../batch2/helpers.js";
import { mulberry32 } from "../rng.js";
import { batchThreeCopy, batchThreePhrase, type BatchThreeCopyKey } from "./copy.js";
import { batchThreeMeta, roundLabel, whole } from "./helpers.js";
import type { BatchThreeGame, BatchThreeState, TallyTrial } from "./types.js";

type State = Extract<BatchThreeState, { game: "tally-row" }>;

export const TALLY_SHAPES = ["circle", "square", "triangle"] as const;
const ROUNDS = 4;

/** How many places in a row hold the shape. */
export function tallyCount(row: readonly number[], shape: number): number {
  return row.filter((item) => item === shape).length;
}

function shapeName(language: "en" | "fr", shape: number): string {
  return batchThreeCopy(`shape.${TALLY_SHAPES[shape] ?? "circle"}` as BatchThreeCopyKey, language);
}

export const tallyRow: BatchThreeGame<State> = {
  meta: batchThreeMeta("tally-row", "counting"),
  start(seed) {
    const rng = mulberry32(seed);
    const trials: TallyTrial[] = [];
    for (let round = 0; round < ROUNDS; round += 1) {
      const length = whole(rng, 7, 10);
      const target = whole(rng, 0, 2);
      const row = Array.from({ length }, () => whole(rng, 0, 2));
      // The counted shape appears at least twice, so the answer is never zero.
      row[0] = target;
      row[length - 1] = target;
      const answer = tallyCount(row, target);
      trials.push({ row, target, answer, options: numberOptions(rng, answer, [1, -1, 2]) });
    }
    return { game: "tally-row", index: 0, trials };
  },
  step(state, choiceId) {
    const trial = state.trials[state.index];
    if (!trial || !/^n-\d+$/.test(choiceId)) return null;
    const value = Number(choiceId.slice(2));
    if (!trial.options.includes(value)) return null;
    return answerStep(state, value === trial.answer);
  },
  describe(state, language) {
    const trial = state.trials[state.index];
    if (!trial) return { prompt: "", detail: "", choices: [] };
    return {
      prompt: batchThreePhrase("tally.prompt", language, {
        round: roundLabel(language, state.index, state.trials.length),
        row: trial.row.map((shape) => shapeName(language, shape)).join(", "),
        shape: shapeName(language, trial.target),
      }),
      detail: batchThreeCopy("tally.detail", language),
      choices: trial.options.map((value) => ({ id: `n-${value}`, label: String(value) })),
    };
  },
  solution(state) {
    const trial = state.trials[state.index];
    return trial ? [`n-${trial.answer}`] : [];
  },
};
