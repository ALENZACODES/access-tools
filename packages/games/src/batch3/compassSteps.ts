import { answerStep } from "../batch2/helpers.js";
import { mulberry32 } from "../rng.js";
import { batchThreeCopy, batchThreePhrase } from "./copy.js";
import { batchThreeMeta, mixed, roundLabel, whole } from "./helpers.js";
import type { BatchThreeGame, BatchThreeState, CompassMove, CompassTrial, GridPlace } from "./types.js";

type State = Extract<BatchThreeState, { game: "compass-steps" }>;

const ROUNDS = 3;
const MOVES = 3;
export const COMPASS_DIRECTIONS = ["north", "east", "south", "west"] as const;

/** Where a list of moves ends, counted from the start. */
export function compassEnd(moves: readonly CompassMove[]): GridPlace {
  let east = 0;
  let north = 0;
  for (const move of moves) {
    if (move.direction === "north") north += move.steps;
    if (move.direction === "south") north -= move.steps;
    if (move.direction === "east") east += move.steps;
    if (move.direction === "west") east -= move.steps;
  }
  return [east, north];
}

export function placeId(place: GridPlace): string {
  return `at_${place[0]}_${place[1]}`;
}

function placeLabel(language: "en" | "fr", place: GridPlace): string {
  const [east, north] = place;
  const ns =
    north === 0
      ? batchThreeCopy("compass.at.level-ns", language)
      : batchThreePhrase(north > 0 ? "compass.at.north" : "compass.at.south", language, { n: Math.abs(north) });
  const ew =
    east === 0
      ? batchThreeCopy("compass.at.level-ew", language)
      : batchThreePhrase(east > 0 ? "compass.at.east" : "compass.at.west", language, { n: Math.abs(east) });
  return batchThreePhrase("compass.at", language, { ns, ew });
}

export const compassSteps: BatchThreeGame<State> = {
  meta: batchThreeMeta("compass-steps", "path_following"),
  start(seed) {
    const rng = mulberry32(seed);
    const trials: CompassTrial[] = [];
    for (let round = 0; round < ROUNDS; round += 1) {
      const moves: CompassMove[] = [];
      let last = -1;
      for (let step = 0; step < MOVES; step += 1) {
        // A move never repeats the direction before it, so each move is its own step to follow.
        let direction = whole(rng, 0, 3);
        if (direction === last) direction = (direction + 1) % 4;
        last = direction;
        moves.push({ direction: COMPASS_DIRECTIONS[direction] ?? "north", steps: whole(rng, 1, 3) });
      }
      const answer = compassEnd(moves);
      const wrongEast: GridPlace = [answer[0] + (whole(rng, 0, 1) === 0 ? 1 : -1), answer[1]];
      const wrongNorth: GridPlace = [answer[0], answer[1] + (whole(rng, 0, 1) === 0 ? 1 : -1)];
      trials.push({ moves, answer, options: mixed(rng, [answer, wrongEast, wrongNorth]) });
    }
    return { game: "compass-steps", index: 0, trials };
  },
  step(state, choiceId) {
    const trial = state.trials[state.index];
    if (!trial || !trial.options.some((place) => placeId(place) === choiceId)) return null;
    return answerStep(state, choiceId === placeId(trial.answer));
  },
  describe(state, language) {
    const trial = state.trials[state.index];
    if (!trial) return { prompt: "", detail: "", choices: [] };
    const moves = trial.moves
      .map((move) => batchThreePhrase("compass.move", language, { direction: batchThreeCopy(`compass.${move.direction}`, language), steps: move.steps }))
      .join(batchThreeCopy("compass.then", language));
    return {
      prompt: batchThreePhrase("compass.prompt", language, { round: roundLabel(language, state.index, state.trials.length), moves }),
      detail: batchThreeCopy("compass.detail", language),
      choices: trial.options.map((place) => ({ id: placeId(place), label: placeLabel(language, place) })),
    };
  },
  solution(state) {
    const trial = state.trials[state.index];
    return trial ? [placeId(trial.answer)] : [];
  },
};
