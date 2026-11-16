import type { GameMeta, GameSession, Language } from "../types.js";
import type { BatchBody, BatchStep } from "../batch2/types.js";
import { clockHop } from "./clockHop.js";
import { compassSteps } from "./compassSteps.js";
import { batchThreePair, type BatchThreeCopyKey } from "./copy.js";
import { dayHop } from "./dayHop.js";
import { gridGap } from "./gridGap.js";
import { groupFinder } from "./groupFinder.js";
import { tallyRow } from "./tallyRow.js";
import type { BatchThreeFamily, BatchThreeGame, BatchThreeGameId, BatchThreeState } from "./types.js";

/** Type-erased view of a game, so the registry can hold games with different state shapes. */
interface Entry {
  meta: GameMeta;
  start(seed: number): BatchThreeState;
  step(state: BatchThreeState, choiceId: string): BatchStep<BatchThreeState> | null;
  describe(state: BatchThreeState, language: Language): BatchBody;
  solution(state: BatchThreeState): string[];
}

function entry<S extends BatchThreeState>(game: BatchThreeGame<S>): Entry {
  const own = (state: BatchThreeState): S => {
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

const ENTRIES: readonly Entry[] = [entry(tallyRow), entry(dayHop), entry(compassSteps), entry(gridGap), entry(groupFinder), entry(clockHop)];

/** The third batch of games, in hub order. They follow the second batch in the full list. */
export const BATCH_THREE_CATALOG: readonly GameMeta[] = ENTRIES.map((item) => item.meta);

const FAMILIES: readonly BatchThreeFamily[] = ["counting", "calendar_order", "path_following", "grid_pattern", "grouping", "clock_arithmetic"];

export const BATCH_THREE_FAMILY_LABEL = Object.fromEntries(
  FAMILIES.map((family) => [family, batchThreePair(`family.${family}` as BatchThreeCopyKey)]),
) as Record<BatchThreeFamily, Record<Language, string>>;

function find(id: string): Entry | undefined {
  return ENTRIES.find((item) => item.meta.id === id);
}

function need(id: string): Entry {
  const found = find(id);
  if (!found) throw new Error(`Unknown game ${id}`);
  return found;
}

export function isBatchThreeGame(id: string): id is BatchThreeGameId {
  return find(id) !== undefined;
}

export function batchThreeMetaById(id: string): GameMeta | undefined {
  return find(id)?.meta;
}

export function startBatchThree(id: string, seed: number): BatchThreeState {
  return need(id).start(seed);
}

export function describeBatchThree(state: BatchThreeState, language: Language): BatchBody {
  return need(state.game).describe(state, language);
}

export function solveBatchThree(state: BatchThreeState): string[] {
  return need(state.game).solution(state);
}

/** Applies one choice to a round. A choice that does nothing returns the same session. */
export function applyBatchThree(session: GameSession, state: BatchThreeState, choiceId: string): GameSession {
  const result = need(state.game).step(state, choiceId);
  if (!result) return session;
  return {
    ...session,
    correct: session.correct + (result.scored?.correct ?? 0),
    answered: session.answered + (result.scored?.answered ?? 0),
    done: result.finished === true,
    data: { kind: "batch-three", state: result.state },
  };
}

export type { BatchThreeFamily, BatchThreeGameId, BatchThreeState } from "./types.js";
