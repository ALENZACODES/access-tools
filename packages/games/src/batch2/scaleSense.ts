import { mulberry32, shuffle } from "../rng.js";
import { batchCopy, batchPhrase, type BatchCopyKey } from "./copy.js";
import { answerStep, batchMeta, roundLabel } from "./helpers.js";
import type { BatchGame, BatchTwoState, ScaleTrial } from "./types.js";

type State = Extract<BatchTwoState, { game: "scale-sense" }>;

export const SCALE_THINGS = ["canoe", "paddle", "tent", "lantern", "kettle", "backpack"] as const;
const ROUNDS = 3;

export function scaleAnswer(trial: ScaleTrial): string {
  return trial.ask === "heaviest" ? trial.ranked[0] : trial.ranked[2];
}

export const scaleSense: BatchGame<State> = {
  meta: batchMeta("scale-sense", "deduction"),
  start(seed) {
    const rng = mulberry32(seed);
    const trials: ScaleTrial[] = [];
    for (let round = 0; round < ROUNDS; round += 1) {
      const [first, second, third] = shuffle(rng, SCALE_THINGS);
      if (!first || !second || !third) throw new Error("Scale Sense needs three items");
      trials.push({
        ranked: [first, second, third],
        statementOrder: rng() < 0.5 ? [0, 1] : [1, 0],
        optionOrder: shuffle(rng, [0, 1, 2]),
        ask: round % 2 === 0 ? "heaviest" : "lightest",
      });
    }
    return { game: "scale-sense", index: 0, trials };
  },
  step(state, choiceId) {
    const trial = state.trials[state.index];
    if (!trial || !choiceId.startsWith("thing-")) return null;
    const thing = choiceId.slice(6);
    if (!trial.ranked.includes(thing)) return null;
    return answerStep(state, thing === scaleAnswer(trial));
  },
  describe(state, language) {
    const trial = state.trials[state.index];
    if (!trial) return { prompt: "", detail: "", choices: [] };
    const name = (thing: string) => batchCopy(`thing.${thing}` as BatchCopyKey, language);
    const statements = [
      batchPhrase("scale.heavier", language, { a: name(trial.ranked[0]), b: name(trial.ranked[1]) }),
      batchPhrase("scale.heavier", language, { a: name(trial.ranked[1]), b: name(trial.ranked[2]) }),
    ];
    return {
      prompt: batchPhrase("scale.prompt", language, {
        round: roundLabel(language, state.index, state.trials.length),
        first: statements[trial.statementOrder[0]] ?? "",
        second: statements[trial.statementOrder[1]] ?? "",
        question: batchCopy(trial.ask === "heaviest" ? "scale.ask.heaviest" : "scale.ask.lightest", language),
      }),
      detail: batchCopy("scale.detail", language),
      choices: trial.optionOrder.map((position) => {
        const thing = trial.ranked[position] ?? trial.ranked[0];
        return { id: `thing-${thing}`, label: name(thing) };
      }),
    };
  },
  solution(state) {
    const trial = state.trials[state.index];
    return trial ? [`thing-${scaleAnswer(trial)}`] : [];
  },
};
