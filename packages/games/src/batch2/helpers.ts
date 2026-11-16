import { gameCopy } from "../i18n.js";
import type { GameMeta, Language } from "../types.js";
import { batchPair, batchPhrase, type BatchCopyKey } from "./copy.js";
import type { BatchStep, BatchTwoFamily } from "./types.js";

const UNTIMED: Record<Language, string> = { en: gameCopy("note.untimed", "en"), fr: gameCopy("note.untimed", "fr") };
const INPUT = batchPair("note.input");

export function batchMeta(id: string, family: BatchTwoFamily): GameMeta {
  return {
    id,
    name: batchPair(`name.${id}` as BatchCopyKey).en,
    taskFamily: family,
    summary: batchPair(`summary.${id}` as BatchCopyKey),
    timingNote: UNTIMED,
    inputNote: INPUT,
    estimatedMinutes: 3,
  };
}

export function roundLabel(language: Language, index: number, total: number): string {
  return batchPhrase("round.of", language, { n: Math.min(index + 1, total), total });
}

/** Scores one answer in a list of questions and moves to the next one. */
export function answerStep<S extends { index: number; trials: readonly unknown[] }>(state: S, correct: boolean): BatchStep<S> {
  const index = state.index + 1;
  return {
    state: { ...state, index },
    scored: { correct: correct ? 1 : 0, answered: 1 },
    finished: index >= state.trials.length,
  };
}

/** Whole-number seed for a follow-on generator, so one seed can drive several independent draws. */
export function subSeed(rng: () => number): number {
  return Math.floor(rng() * 4294967296) >>> 0;
}

/** Wrong answers near the right one: distinct, never negative, never equal to the answer. */
export function numberOptions(rng: () => number, answer: number, offsets: readonly number[], count = 3): number[] {
  const options = [answer];
  const pool = [...offsets, 1, -1, 2, -2, 3, -3, 4, 5, 6];
  for (const offset of pool) {
    if (options.length >= count) break;
    const candidate = answer + offset;
    if (candidate < 0 || options.includes(candidate)) continue;
    options.push(candidate);
  }
  const order = options.map((value) => ({ value, key: rng() })).sort((a, b) => a.key - b.key);
  return order.map((item) => item.value);
}
