import { mulberry32, pick } from "../rng.js";
import { batchCopy, batchPhrase, type BatchCopyKey } from "./copy.js";
import { batchMeta } from "./helpers.js";
import type { BatchGame, BatchTwoState } from "./types.js";

type State = Extract<BatchTwoState, { game: "jug-measure" }>;
type Level = [number, number];

/** Capacity of jug A, capacity of jug B, target. Each one can be reached. */
export const JUG_PUZZLES: ReadonlyArray<[number, number, number]> = [
  [3, 5, 4],
  [4, 7, 5],
  [5, 8, 2],
  [3, 7, 5],
  [5, 7, 6],
];

export const JUG_MOVES = ["fill-a", "fill-b", "empty-a", "empty-b", "pour-ab", "pour-ba"] as const;
export type JugMove = (typeof JUG_MOVES)[number];

export function jugMove(level: Level, capacity: Level, move: string): Level {
  const [a, b] = level;
  const [capA, capB] = capacity;
  switch (move) {
    case "fill-a":
      return [capA, b];
    case "fill-b":
      return [a, capB];
    case "empty-a":
      return [0, b];
    case "empty-b":
      return [a, 0];
    case "pour-ab": {
      const amount = Math.min(a, capB - b);
      return [a - amount, b + amount];
    }
    case "pour-ba": {
      const amount = Math.min(b, capA - a);
      return [a + amount, b - amount];
    }
    default:
      return [a, b];
  }
}

function reached(level: Level, target: number): boolean {
  return level[0] === target || level[1] === target;
}

/** Shortest list of moves from a level to the target, or null when there is none. */
export function jugPlan(level: Level, capacity: Level, target: number): JugMove[] | null {
  const key = (item: Level) => `${item[0]},${item[1]}`;
  const seen = new Set([key(level)]);
  let frontier: Array<{ level: Level; moves: JugMove[] }> = [{ level, moves: [] }];
  while (frontier.length > 0) {
    const next: typeof frontier = [];
    for (const node of frontier) {
      if (reached(node.level, target)) return node.moves;
      for (const move of JUG_MOVES) {
        const after = jugMove(node.level, capacity, move);
        if (seen.has(key(after))) continue;
        seen.add(key(after));
        next.push({ level: after, moves: [...node.moves, move] });
      }
    }
    frontier = next;
  }
  return null;
}

export const jugMeasure: BatchGame<State> = {
  meta: batchMeta("jug-measure", "measured_steps"),
  start(seed) {
    const [capA, capB, target] = pick(mulberry32(seed), JUG_PUZZLES);
    return { game: "jug-measure", capacity: [capA, capB], target, level: [0, 0], history: [] };
  },
  step(state, choiceId) {
    if (choiceId === "undo") {
      const previous = state.history[state.history.length - 1];
      return previous ? { state: { ...state, level: previous, history: state.history.slice(0, -1) } } : null;
    }
    if (choiceId === "reset") {
      return state.history.length > 0 ? { state: { ...state, level: [0, 0], history: [] } } : null;
    }
    if (!(JUG_MOVES as readonly string[]).includes(choiceId)) return null;
    const level = jugMove(state.level, state.capacity, choiceId);
    if (level[0] === state.level[0] && level[1] === state.level[1]) return null;
    const next: State = { ...state, level, history: [...state.history, state.level] };
    return reached(level, state.target) ? { state: next, scored: { correct: 1, answered: 1 }, finished: true } : { state: next };
  },
  describe(state, language) {
    const choices = JUG_MOVES.map((move) => ({ id: move as string, label: batchCopy(`jug.${move}` as BatchCopyKey, language) }));
    if (state.history.length > 0) {
      choices.push({ id: "undo", label: batchCopy("jug.undo", language) });
      choices.push({ id: "reset", label: batchCopy("jug.reset", language) });
    }
    return {
      prompt: batchPhrase("jug.prompt", language, {
        capA: state.capacity[0],
        capB: state.capacity[1],
        a: state.level[0],
        b: state.level[1],
        target: state.target,
        steps: state.history.length,
      }),
      detail: batchCopy("jug.detail", language),
      choices,
    };
  },
  solution(state) {
    const first = jugPlan(state.level, state.capacity, state.target)?.[0];
    return first ? [first] : [];
  },
};
