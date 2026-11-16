import type { Choice, GameMeta, Language } from "../types.js";

/** Task families for the second batch of games. Plain descriptions, not commercial categories. */
export type BatchTwoFamily =
  | "visual_search"
  | "sequence_recall"
  | "response_reversal"
  | "deduction"
  | "measured_steps"
  | "word_in_context"
  | "word_forming"
  | "arithmetic"
  | "number_pattern";

export interface OddTrial {
  /** Indexes into the shape, fill, and size lists for the four matching items. */
  base: [number, number, number];
  /** Which attribute differs on the odd item: 0 shape, 1 fill, 2 size. */
  dimension: 0 | 1 | 2;
  /** The odd item's value for that attribute. */
  alternate: number;
  /** Position of the odd item, 0 to 4. */
  odd: number;
}

export interface MirrorTrial {
  cue: "same" | "opposite";
  sign: "up" | "down" | "left" | "right";
}

export interface ScaleTrial {
  /** Three item ids, heaviest first. The weights are made up for the puzzle. */
  ranked: [string, string, string];
  /** Order in which the two statements are shown. */
  statementOrder: [number, number];
  /** Order in which the three answers are listed. */
  optionOrder: number[];
  ask: "heaviest" | "lightest";
}

export interface PickTrial {
  /** Index into the game's item pool. */
  item: number;
  /** Order in which the options are listed. Option 0 of the pool item is the answer. */
  order: number[];
}

export interface NumberTrial {
  /** Numbers that make up the question. */
  terms: number[];
  /** "+" or "-" for a sum; unused by a number pattern. */
  operator: "+" | "-";
  answer: number;
  options: number[];
}

export type BatchTwoState =
  | { game: "odd-one-out"; index: number; trials: OddTrial[] }
  | { game: "trail-recall"; phase: "study" | "recall"; trail: string[]; picks: string[]; replayed: boolean }
  | { game: "mirror-moves"; index: number; trials: MirrorTrial[] }
  | { game: "scale-sense"; index: number; trials: ScaleTrial[] }
  | { game: "jug-measure"; capacity: [number, number]; target: number; level: [number, number]; history: Array<[number, number]> }
  | { game: "sentence-gap"; index: number; trials: PickTrial[] }
  | { game: "letter-mix"; index: number; trials: PickTrial[]; scrambleSeed: number }
  | { game: "sum-check"; index: number; trials: NumberTrial[] }
  | { game: "number-steps"; index: number; trials: NumberTrial[] };

export type BatchTwoGameId = BatchTwoState["game"];

export interface BatchBody {
  prompt: string;
  detail: string;
  choices: Choice[];
}

export interface BatchStep<S> {
  state: S;
  /** Present when the choice answered a scored trial. */
  scored?: { correct: number; answered: number };
  finished?: boolean;
}

export interface BatchGame<S extends BatchTwoState = BatchTwoState> {
  meta: GameMeta;
  start(seed: number): S;
  /** Returns null when the choice does nothing in the current state. */
  step(state: S, choiceId: string): BatchStep<S> | null;
  describe(state: S, language: Language): BatchBody;
  /** The next choice or choices that play the round without an error. */
  solution(state: S): string[];
}
