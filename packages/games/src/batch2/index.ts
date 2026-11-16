import type { GameMeta, GameSession, Language } from "../types.js";
import { batchPair, type BatchCopyKey } from "./copy.js";
import { jugMeasure } from "./jugMeasure.js";
import { mirrorMoves } from "./mirrorMoves.js";
import { numberSteps, sumCheck } from "./numberGames.js";
import { oddOneOut } from "./oddOneOut.js";
import { scaleSense } from "./scaleSense.js";
import { trailRecall } from "./trailRecall.js";
import type { BatchBody, BatchGame, BatchStep, BatchTwoFamily, BatchTwoGameId, BatchTwoState } from "./types.js";
import { letterMix, sentenceGap } from "./wordGames.js";

/** Type-erased view of a game, so the registry can hold games with different state shapes. */
interface Entry {
  meta: GameMeta;
  start(seed: number): BatchTwoState;
  step(state: BatchTwoState, choiceId: string): BatchStep<BatchTwoState> | null;
  describe(state: BatchTwoState, language: Language): BatchBody;
  solution(state: BatchTwoState): string[];
}

function entry<S extends BatchTwoState>(game: BatchGame<S>): Entry {
  const own = (state: BatchTwoState): S => {
    if (state.game !== game.meta.id) throw new Error(`State for ${state.game} was given to ${game.meta.id}`);
    return state as S;
  };
  return {
    meta: game.meta,
    start: (seed) => game.start(seed),
    step: (state, choiceId) => game.step(own(state), choiceId),
    describe: (state, language) => game.describe(own(state), language),
    solution: (state) => game.solution(own(state)),
  };
}

const ENTRIES: readonly Entry[] = [
  entry(oddOneOut),
  entry(trailRecall),
  entry(mirrorMoves),
  entry(scaleSense),
  entry(jugMeasure),
  entry(sentenceGap),
  entry(letterMix),
  entry(sumCheck),
  entry(numberSteps),
];

/** The second batch of games, in hub order. They follow the first ten in the full list. */
export const BATCH_TWO_CATALOG: readonly GameMeta[] = ENTRIES.map((item) => item.meta);

const FAMILIES: readonly BatchTwoFamily[] = [
  "visual_search",
  "sequence_recall",
  "response_reversal",
  "deduction",
  "measured_steps",
  "word_in_context",
  "word_forming",
  "arithmetic",
  "number_pattern",
];

export const BATCH_TWO_FAMILY_LABEL = Object.fromEntries(
  FAMILIES.map((family) => [family, batchPair(`family.${family}` as BatchCopyKey)]),
) as Record<BatchTwoFamily, Record<Language, string>>;

function find(id: string): Entry | undefined {
  return ENTRIES.find((item) => item.meta.id === id);
}

function need(id: string): Entry {
  const found = find(id);
  if (!found) throw new Error(`Unknown game ${id}`);
  return found;
}

export function isBatchTwoGame(id: string): id is BatchTwoGameId {
  return find(id) !== undefined;
}

export function batchTwoMeta(id: string): GameMeta | undefined {
  return find(id)?.meta;
}

export function startBatchTwo(id: string, seed: number): BatchTwoState {
  return need(id).start(seed);
}

export function describeBatchTwo(state: BatchTwoState, language: Language): BatchBody {
  return need(state.game).describe(state, language);
}

export function solveBatchTwo(state: BatchTwoState): string[] {
  return need(state.game).solution(state);
}

/** Applies one choice to a round. A choice that does nothing returns the same session. */
export function applyBatchTwo(session: GameSession, state: BatchTwoState, choiceId: string): GameSession {
  const result = need(state.game).step(state, choiceId);
  if (!result) return session;
  return {
    ...session,
    correct: session.correct + (result.scored?.correct ?? 0),
    answered: session.answered + (result.scored?.answered ?? 0),
    done: result.finished === true,
    data: { kind: "batch-two", state: result.state },
  };
}

export type { BatchTwoFamily, BatchTwoGameId, BatchTwoState } from "./types.js";
