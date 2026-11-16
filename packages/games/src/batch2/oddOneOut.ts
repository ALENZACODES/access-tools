import { mulberry32 } from "../rng.js";
import { batchCopy, batchPhrase, type BatchCopyKey } from "./copy.js";
import { answerStep, batchMeta, roundLabel } from "./helpers.js";
import type { BatchGame, BatchTwoState, OddTrial } from "./types.js";

type State = Extract<BatchTwoState, { game: "odd-one-out" }>;

export const ODD_SHAPES = ["circle", "square", "triangle"] as const;
export const ODD_FILLS = ["filled", "open", "striped"] as const;
export const ODD_SIZES = ["large", "small", "medium"] as const;
const ROUNDS = 4;
const ITEMS = 5;

function whole(rng: () => number, below: number): number {
  return Math.floor(rng() * below);
}

/** The three attribute indexes of the item at a position in a trial. */
export function oddItem(trial: OddTrial, position: number): [number, number, number] {
  const item: [number, number, number] = [...trial.base];
  if (position === trial.odd) item[trial.dimension] = trial.alternate;
  return item;
}

function describeItem(language: "en" | "fr", item: [number, number, number]): string {
  return batchPhrase("odd.describe", language, {
    shape: batchCopy(`shape.${ODD_SHAPES[item[0]] ?? "circle"}` as BatchCopyKey, language),
    fill: batchCopy(`fill.${ODD_FILLS[item[1]] ?? "filled"}` as BatchCopyKey, language),
    size: batchCopy(`size.${ODD_SIZES[item[2]] ?? "large"}` as BatchCopyKey, language),
  });
}

export const oddOneOut: BatchGame<State> = {
  meta: batchMeta("odd-one-out", "visual_search"),
  start(seed) {
    const rng = mulberry32(seed);
    const trials: OddTrial[] = [];
    for (let round = 0; round < ROUNDS; round += 1) {
      const base: [number, number, number] = [whole(rng, 3), whole(rng, 3), whole(rng, 3)];
      const dimension = (round % 3) as 0 | 1 | 2;
      const alternate = (base[dimension] + 1 + whole(rng, 2)) % 3;
      trials.push({ base, dimension, alternate, odd: whole(rng, ITEMS) });
    }
    return { game: "odd-one-out", index: 0, trials };
  },
  step(state, choiceId) {
    const trial = state.trials[state.index];
    if (!trial || !/^item-[0-4]$/.test(choiceId)) return null;
    return answerStep(state, Number(choiceId.slice(5)) === trial.odd);
  },
  describe(state, language) {
    const trial = state.trials[state.index];
    if (!trial) return { prompt: "", detail: "", choices: [] };
    return {
      prompt: batchPhrase("odd.prompt", language, { round: roundLabel(language, state.index, state.trials.length) }),
      detail: batchCopy("odd.detail", language),
      choices: Array.from({ length: ITEMS }, (_, position) => ({
        id: `item-${position}`,
        label: batchPhrase("odd.item", language, { n: position + 1, description: describeItem(language, oddItem(trial, position)) }),
      })),
    };
  },
  solution(state) {
    const trial = state.trials[state.index];
    return trial ? [`item-${trial.odd}`] : [];
  },
};
