import { answerStep } from "../batch2/helpers.js";
import { mulberry32 } from "../rng.js";
import { batchThreeCopy, batchThreePhrase, type BatchThreeCopyKey } from "./copy.js";
import { batchThreeMeta, mixed, roundLabel } from "./helpers.js";
import type { BatchThreeGame, BatchThreeState, GroupTrial } from "./types.js";

type State = Extract<BatchThreeState, { game: "group-finder" }>;

const ROUNDS = 4;
export const GROUPS = ["birds", "tools", "fruit", "vehicles"] as const;

/** Everyday words and the one group each belongs to. `group` is an index into GROUPS. */
export const GROUP_WORDS: ReadonlyArray<{ word: string; group: number }> = [
  { word: "loon", group: 0 },
  { word: "robin", group: 0 },
  { word: "owl", group: 0 },
  { word: "gull", group: 0 },
  { word: "hammer", group: 1 },
  { word: "wrench", group: 1 },
  { word: "saw", group: 1 },
  { word: "pliers", group: 1 },
  { word: "apple", group: 2 },
  { word: "pear", group: 2 },
  { word: "plum", group: 2 },
  { word: "cherry", group: 2 },
  { word: "canoe", group: 3 },
  { word: "bus", group: 3 },
  { word: "train", group: 3 },
  { word: "bicycle", group: 3 },
];

function groupName(language: "en" | "fr", group: number): string {
  return batchThreeCopy(`group.${GROUPS[group] ?? "birds"}` as BatchThreeCopyKey, language);
}

export const groupFinder: BatchThreeGame<State> = {
  meta: batchThreeMeta("group-finder", "grouping"),
  start(seed) {
    const rng = mulberry32(seed);
    // Four different words, one from each group, in a mixed order.
    const words = mixed(rng, [0, 1, 2, 3]).map((group) => {
      const inGroup = GROUP_WORDS.map((item, index) => ({ item, index })).filter((entry) => entry.item.group === group);
      return mixed(rng, inGroup)[0]?.index ?? 0;
    });
    const trials: GroupTrial[] = words.slice(0, ROUNDS).map((word) => {
      const own = GROUP_WORDS[word]?.group ?? 0;
      const others = mixed(rng, [0, 1, 2, 3].filter((group) => group !== own)).slice(0, 2);
      return { word, options: mixed(rng, [own, ...others]) };
    });
    return { game: "group-finder", index: 0, trials };
  },
  step(state, choiceId) {
    const trial = state.trials[state.index];
    if (!trial || !/^group-[0-3]$/.test(choiceId)) return null;
    const value = Number(choiceId.slice(6));
    if (!trial.options.includes(value)) return null;
    return answerStep(state, value === GROUP_WORDS[trial.word]?.group);
  },
  describe(state, language) {
    const trial = state.trials[state.index];
    const entry = trial ? GROUP_WORDS[trial.word] : undefined;
    if (!trial || !entry) return { prompt: "", detail: "", choices: [] };
    return {
      prompt: batchThreePhrase("group.prompt", language, {
        round: roundLabel(language, state.index, state.trials.length),
        word: batchThreeCopy(`word.${entry.word}` as BatchThreeCopyKey, language),
      }),
      detail: batchThreeCopy("group.detail", language),
      choices: trial.options.map((group) => ({ id: `group-${group}`, label: groupName(language, group) })),
    };
  },
  solution(state) {
    const trial = state.trials[state.index];
    const entry = trial ? GROUP_WORDS[trial.word] : undefined;
    return entry ? [`group-${entry.group}`] : [];
  },
};
