import { gameCopy } from "../i18n.js";
import { batchPair } from "../batch2/copy.js";
import type { GameMeta, Language } from "../types.js";
import { batchThreePair, batchThreePhrase, type BatchThreeCopyKey } from "./copy.js";
import type { BatchThreeFamily } from "./types.js";

const UNTIMED: Record<Language, string> = { en: gameCopy("note.untimed", "en"), fr: gameCopy("note.untimed", "fr") };
/** The same input note as the second batch: tap, keyboard, switch, or dwell select. */
const INPUT = batchPair("note.input");

export function batchThreeMeta(id: string, family: BatchThreeFamily): GameMeta {
  return {
    id,
    name: batchThreePair(`name.${id}` as BatchThreeCopyKey).en,
    taskFamily: family,
    summary: batchThreePair(`summary.${id}` as BatchThreeCopyKey),
    timingNote: UNTIMED,
    inputNote: INPUT,
    estimatedMinutes: 3,
  };
}

export function roundLabel(language: Language, index: number, total: number): string {
  return batchThreePhrase("round.of", language, { n: Math.min(index + 1, total), total });
}

/** A whole number from low to high, both included. */
export function whole(rng: () => number, low: number, high: number): number {
  return low + Math.floor(rng() * (high - low + 1));
}

/** The items in a new order. The list given is not changed. */
export function mixed<T>(rng: () => number, items: readonly T[]): T[] {
  return items
    .map((value) => ({ value, key: rng() }))
    .sort((a, b) => a.key - b.key)
    .map((item) => item.value);
}
