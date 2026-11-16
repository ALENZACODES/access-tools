import { answerStep } from "../batch2/helpers.js";
import { mulberry32, pick } from "../rng.js";
import { batchThreeCopy, batchThreePhrase } from "./copy.js";
import { batchThreeMeta, mixed, roundLabel, whole } from "./helpers.js";
import type { BatchThreeGame, BatchThreeState, ClockTrial } from "./types.js";

type State = Extract<BatchThreeState, { game: "clock-hop" }>;

const ROUNDS = 4;
/** Minutes in one turn of a twelve-hour clock. */
export const CLOCK_TURN = 720;
export const CLOCK_ADDS: readonly number[] = [15, 30, 45, 60, 75, 90];

/** A time on the twelve-hour clock, as minutes after twelve, going round after 12:59. */
export function clockAfter(start: number, minutes: number): number {
  return (((start + minutes) % CLOCK_TURN) + CLOCK_TURN) % CLOCK_TURN;
}

/** Hour 1 to 12 and minute 0 to 59 for a time held as minutes after twelve. */
export function clockParts(time: number): { hour: number; minute: number } {
  const turned = clockAfter(time, 0);
  const hour = Math.floor(turned / 60);
  return { hour: hour === 0 ? 12 : hour, minute: turned % 60 };
}

function timeLabel(language: "en" | "fr", time: number): string {
  const { hour, minute } = clockParts(time);
  return batchThreePhrase("clock.time", language, { hour, minute: String(minute).padStart(2, "0") });
}

export const clockHop: BatchThreeGame<State> = {
  meta: batchThreeMeta("clock-hop", "clock_arithmetic"),
  start(seed) {
    const rng = mulberry32(seed);
    const trials: ClockTrial[] = [];
    for (let round = 0; round < ROUNDS; round += 1) {
      const start = whole(rng, 0, 11) * 60 + whole(rng, 0, 3) * 15;
      const add = pick(rng, CLOCK_ADDS);
      const answer = clockAfter(start, add);
      // The wrong times are a quarter hour early and a quarter hour late.
      trials.push({ start, add, answer, options: mixed(rng, [answer, clockAfter(answer, 15), clockAfter(answer, -15)]) });
    }
    return { game: "clock-hop", index: 0, trials };
  },
  step(state, choiceId) {
    const trial = state.trials[state.index];
    if (!trial || !/^t-\d+$/.test(choiceId)) return null;
    const value = Number(choiceId.slice(2));
    if (!trial.options.includes(value)) return null;
    return answerStep(state, value === trial.answer);
  },
  describe(state, language) {
    const trial = state.trials[state.index];
    if (!trial) return { prompt: "", detail: "", choices: [] };
    return {
      prompt: batchThreePhrase("clock.prompt", language, {
        round: roundLabel(language, state.index, state.trials.length),
        time: timeLabel(language, trial.start),
        n: trial.add,
      }),
      detail: batchThreeCopy("clock.detail", language),
      choices: trial.options.map((time) => ({ id: `t-${time}`, label: timeLabel(language, time) })),
    };
  },
  solution(state) {
    const trial = state.trials[state.index];
    return trial ? [`t-${trial.answer}`] : [];
  },
};
