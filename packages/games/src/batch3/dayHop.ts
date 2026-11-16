import { answerStep } from "../batch2/helpers.js";
import { mulberry32 } from "../rng.js";
import { batchThreeCopy, batchThreePhrase, type BatchThreeCopyKey } from "./copy.js";
import { batchThreeMeta, mixed, roundLabel, whole } from "./helpers.js";
import type { BatchThreeGame, BatchThreeState, DayTrial } from "./types.js";

type State = Extract<BatchThreeState, { game: "day-hop" }>;

const ROUNDS = 4;
export const DAYS_IN_WEEK = 7;

/** The day reached from a start day, 0 (Monday) to 6 (Sunday), going round the week. */
export function dayAfter(start: number, days: number): number {
  return (((start + days) % DAYS_IN_WEEK) + DAYS_IN_WEEK) % DAYS_IN_WEEK;
}

function dayName(language: "en" | "fr", day: number): string {
  return batchThreeCopy(`day.${dayAfter(day, 0)}` as BatchThreeCopyKey, language);
}

export const dayHop: BatchThreeGame<State> = {
  meta: batchThreeMeta("day-hop", "calendar_order"),
  start(seed) {
    const rng = mulberry32(seed);
    const trials: DayTrial[] = [];
    for (let round = 0; round < ROUNDS; round += 1) {
      const start = whole(rng, 0, 6);
      const distance = whole(rng, 2, 4);
      const direction = round % 2 === 0 ? "after" : "before";
      const answer = dayAfter(start, direction === "after" ? distance : -distance);
      // The two wrong days are the ones next to the answer, so all three differ.
      trials.push({ start, distance, direction, answer, options: mixed(rng, [answer, dayAfter(answer, 1), dayAfter(answer, -1)]) });
    }
    return { game: "day-hop", index: 0, trials };
  },
  step(state, choiceId) {
    const trial = state.trials[state.index];
    if (!trial || !/^day-[0-6]$/.test(choiceId)) return null;
    const value = Number(choiceId.slice(4));
    if (!trial.options.includes(value)) return null;
    return answerStep(state, value === trial.answer);
  },
  describe(state, language) {
    const trial = state.trials[state.index];
    if (!trial) return { prompt: "", detail: "", choices: [] };
    return {
      prompt: batchThreePhrase(trial.direction === "after" ? "day.prompt.after" : "day.prompt.before", language, {
        round: roundLabel(language, state.index, state.trials.length),
        day: dayName(language, trial.start),
        n: trial.distance,
      }),
      detail: batchThreeCopy("day.detail", language),
      choices: trial.options.map((day) => ({ id: `day-${day}`, label: dayName(language, day) })),
    };
  },
  solution(state) {
    const trial = state.trials[state.index];
    return trial ? [`day-${trial.answer}`] : [];
  },
};
