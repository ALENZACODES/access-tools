import { answerStep } from "../batch2/helpers.js";
import { mulberry32 } from "../rng.js";
import { batchThreeCopy, batchThreePhrase, type BatchThreeCopyKey } from "./copy.js";
import { batchThreeMeta, mixed, roundLabel, whole } from "./helpers.js";
import type { BatchThreeGame, BatchThreeState, GridCell, GridTrial } from "./types.js";

type State = Extract<BatchThreeState, { game: "grid-gap" }>;

const ROUNDS = 3;
export const GRID_SHAPES = ["circle", "square", "triangle"] as const;
export const GRID_SIZES = ["small", "medium", "large"] as const;

/** The cell that the row and column rules put at a place in the grid. */
export function gridCell(trial: GridTrial, row: number, column: number): GridCell {
  return { shape: trial.rowShapes[row] ?? 0, size: trial.columnSizes[column] ?? 0 };
}

export function cellId(cell: GridCell): string {
  return `cell-${cell.shape}-${cell.size}`;
}

function cellLabel(language: "en" | "fr", cell: GridCell): string {
  return batchThreePhrase("grid.cell", language, {
    shape: batchThreeCopy(`shape.${GRID_SHAPES[cell.shape] ?? "circle"}` as BatchThreeCopyKey, language),
    size: batchThreeCopy(`size.${GRID_SIZES[cell.size] ?? "small"}` as BatchThreeCopyKey, language),
  });
}

function order(rng: () => number): [number, number, number] {
  const [a, b, c] = mixed(rng, [0, 1, 2]);
  return [a ?? 0, b ?? 1, c ?? 2];
}

export const gridGap: BatchThreeGame<State> = {
  meta: batchThreeMeta("grid-gap", "grid_pattern"),
  start(seed) {
    const rng = mulberry32(seed);
    const trials: GridTrial[] = [];
    for (let round = 0; round < ROUNDS; round += 1) {
      const trial: GridTrial = { rowShapes: order(rng), columnSizes: order(rng), gap: [whole(rng, 0, 2), whole(rng, 0, 2)], options: [] };
      const answer = gridCell(trial, trial.gap[0], trial.gap[1]);
      // One wrong answer has the wrong shape and one has the wrong size.
      const wrongShape: GridCell = { shape: (answer.shape + whole(rng, 1, 2)) % 3, size: answer.size };
      const wrongSize: GridCell = { shape: answer.shape, size: (answer.size + whole(rng, 1, 2)) % 3 };
      trial.options = mixed(rng, [answer, wrongShape, wrongSize]);
      trials.push(trial);
    }
    return { game: "grid-gap", index: 0, trials };
  },
  step(state, choiceId) {
    const trial = state.trials[state.index];
    if (!trial || !trial.options.some((cell) => cellId(cell) === choiceId)) return null;
    return answerStep(state, choiceId === cellId(gridCell(trial, trial.gap[0], trial.gap[1])));
  },
  describe(state, language) {
    const trial = state.trials[state.index];
    if (!trial) return { prompt: "", detail: "", choices: [] };
    const rows = [0, 1, 2]
      .map((row) =>
        batchThreePhrase("grid.row", language, {
          n: row + 1,
          cells: [0, 1, 2]
            .map((column) =>
              row === trial.gap[0] && column === trial.gap[1] ? batchThreeCopy("grid.gap", language) : cellLabel(language, gridCell(trial, row, column)),
            )
            .join(", "),
        }),
      )
      .join(" ");
    return {
      prompt: batchThreePhrase("grid.prompt", language, { round: roundLabel(language, state.index, state.trials.length), rows }),
      detail: batchThreeCopy("grid.detail", language),
      choices: trial.options.map((cell) => ({ id: cellId(cell), label: cellLabel(language, cell) })),
    };
  },
  solution(state) {
    const trial = state.trials[state.index];
    return trial ? [cellId(gridCell(trial, trial.gap[0], trial.gap[1]))] : [];
  },
};
