import { mulberry32, pick, shuffle } from "../rng.js";
import { batchCopy, batchPhrase, type BatchCopyKey } from "./copy.js";
import { answerStep, batchMeta, roundLabel } from "./helpers.js";
import type { BatchGame, BatchTwoState, MirrorTrial } from "./types.js";

type State = Extract<BatchTwoState, { game: "mirror-moves" }>;
type Direction = MirrorTrial["sign"];

export const DIRECTIONS: readonly Direction[] = ["up", "down", "left", "right"];
const OPPOSITE: Record<Direction, Direction> = { up: "down", down: "up", left: "right", right: "left" };
const CUES: ReadonlyArray<MirrorTrial["cue"]> = ["same", "opposite", "opposite", "same", "opposite"];

export function mirrorAnswer(trial: MirrorTrial): Direction {
  return trial.cue === "same" ? trial.sign : OPPOSITE[trial.sign];
}

export const mirrorMoves: BatchGame<State> = {
  meta: batchMeta("mirror-moves", "response_reversal"),
  start(seed) {
    const rng = mulberry32(seed);
    const trials = shuffle(rng, CUES).map((cue) => ({ cue, sign: pick(rng, DIRECTIONS) }));
    return { game: "mirror-moves", index: 0, trials };
  },
  step(state, choiceId) {
    const trial = state.trials[state.index];
    if (!trial || !choiceId.startsWith("dir-")) return null;
    const direction = choiceId.slice(4);
    if (!(DIRECTIONS as readonly string[]).includes(direction)) return null;
    return answerStep(state, direction === mirrorAnswer(trial));
  },
  describe(state, language) {
    const trial = state.trials[state.index];
    if (!trial) return { prompt: "", detail: "", choices: [] };
    const word = (direction: Direction) => batchCopy(`dir.${direction}` as BatchCopyKey, language);
    return {
      prompt: batchPhrase("mirror.prompt", language, {
        round: roundLabel(language, state.index, state.trials.length),
        cue: batchCopy(`mirror.cue.${trial.cue}` as BatchCopyKey, language),
        sign: word(trial.sign),
      }),
      detail: batchCopy("mirror.detail", language),
      choices: DIRECTIONS.map((direction) => ({ id: `dir-${direction}`, label: batchPhrase("mirror.go", language, { direction: word(direction) }) })),
    };
  },
  solution(state) {
    const trial = state.trials[state.index];
    return trial ? [`dir-${mirrorAnswer(trial)}`] : [];
  },
};
