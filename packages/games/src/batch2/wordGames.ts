import { mulberry32, shuffle } from "../rng.js";
import type { Language } from "../types.js";
import { batchCopy, batchPhrase, type BatchCopyKey } from "./copy.js";
import { answerStep, batchMeta, roundLabel, subSeed } from "./helpers.js";
import type { BatchGame, BatchTwoState, PickTrial } from "./types.js";

type GapState = Extract<BatchTwoState, { game: "sentence-gap" }>;
type MixState = Extract<BatchTwoState, { game: "letter-mix" }>;

export const WORD_POOL_SIZE = 6;
const ROUNDS = 4;
const LETTERS = ["a", "b", "c"] as const;

function pickTrials(rng: () => number): PickTrial[] {
  const items = shuffle(
    rng,
    Array.from({ length: WORD_POOL_SIZE }, (_, index) => index),
  ).slice(0, ROUNDS);
  return items.map((item) => ({ item, order: shuffle(rng, [0, 1, 2]) }));
}

function optionKey(prefix: "gap" | "mix", item: number, option: number): BatchCopyKey {
  return `${prefix}.${item}.${LETTERS[option] ?? "a"}` as BatchCopyKey;
}

function pickStep<S extends GapState | MixState>(state: S, choiceId: string) {
  const trial = state.trials[state.index];
  if (!trial || !/^opt-[0-2]$/.test(choiceId)) return null;
  return answerStep(state, choiceId === "opt-0");
}

function pickChoices(prefix: "gap" | "mix", trial: PickTrial, language: Language) {
  return trial.order.map((option) => ({ id: `opt-${option}`, label: batchCopy(optionKey(prefix, trial.item, option), language) }));
}

export const sentenceGap: BatchGame<GapState> = {
  meta: batchMeta("sentence-gap", "word_in_context"),
  start(seed) {
    return { game: "sentence-gap", index: 0, trials: pickTrials(mulberry32(seed)) };
  },
  step: pickStep,
  describe(state, language) {
    const trial = state.trials[state.index];
    if (!trial) return { prompt: "", detail: "", choices: [] };
    return {
      prompt: batchPhrase("gap.prompt", language, {
        round: roundLabel(language, state.index, state.trials.length),
        sentence: batchCopy(`gap.${trial.item}.sentence` as BatchCopyKey, language),
      }),
      detail: batchCopy("gap.detail", language),
      choices: pickChoices("gap", trial, language),
    };
  },
  solution(state) {
    return state.trials[state.index] ? ["opt-0"] : [];
  },
};

/** The answer word for a Letter Mix item in one language. */
export function mixWord(item: number, language: Language): string {
  return batchCopy(optionKey("mix", item, 0), language);
}

/** Mixes the letters of a word. The result uses the same letters and is never the word itself. */
export function scrambleWord(word: string, seed: number): string {
  const letters = [...word];
  const rng = mulberry32(seed);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const mixed = shuffle(rng, letters).join("");
    if (mixed !== word) return mixed;
  }
  return [...letters.slice(1), ...letters.slice(0, 1)].join("");
}

export const letterMix: BatchGame<MixState> = {
  meta: batchMeta("letter-mix", "word_forming"),
  start(seed) {
    const rng = mulberry32(seed);
    return { game: "letter-mix", index: 0, trials: pickTrials(rng), scrambleSeed: subSeed(rng) };
  },
  step: pickStep,
  describe(state, language) {
    const trial = state.trials[state.index];
    if (!trial) return { prompt: "", detail: "", choices: [] };
    const mixed = scrambleWord(mixWord(trial.item, language), state.scrambleSeed + trial.item);
    return {
      prompt: batchPhrase("mix.prompt", language, {
        round: roundLabel(language, state.index, state.trials.length),
        letters: [...mixed].join(", "),
      }),
      detail: batchCopy("mix.detail", language),
      choices: pickChoices("mix", trial, language),
    };
  },
  solution(state) {
    return state.trials[state.index] ? ["opt-0"] : [];
  },
};
