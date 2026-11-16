import { mulberry32, shuffle } from "../rng.js";
import { batchCopy, batchPhrase, type BatchCopyKey } from "./copy.js";
import { batchMeta } from "./helpers.js";
import type { BatchGame, BatchTwoState } from "./types.js";

type State = Extract<BatchTwoState, { game: "trail-recall" }>;

export const TRAIL_STOPS = ["loon", "pine", "canoe", "maple", "lighthouse", "trillium"] as const;
const LENGTH = 4;

function stopName(language: "en" | "fr", stop: string): string {
  return batchCopy(`stop.${stop}` as BatchCopyKey, language);
}

function numbered(language: "en" | "fr", stops: readonly string[]): string {
  return stops.map((stop, index) => `${index + 1}. ${stopName(language, stop)}`).join(", ");
}

export const trailRecall: BatchGame<State> = {
  meta: batchMeta("trail-recall", "sequence_recall"),
  start(seed) {
    const trail = shuffle(mulberry32(seed), TRAIL_STOPS).slice(0, LENGTH);
    return { game: "trail-recall", phase: "study", trail, picks: [], replayed: false };
  },
  step(state, choiceId) {
    if (state.phase === "study") {
      return choiceId === "ready" ? { state: { ...state, phase: "recall" } } : null;
    }
    if (choiceId === "undo") {
      return state.picks.length > 0 ? { state: { ...state, picks: state.picks.slice(0, -1) } } : null;
    }
    if (choiceId === "replay") {
      return state.replayed ? null : { state: { ...state, phase: "study", picks: [], replayed: true } };
    }
    if (!choiceId.startsWith("stop-")) return null;
    const stop = choiceId.slice(5);
    if (!(TRAIL_STOPS as readonly string[]).includes(stop)) return null;
    const picks = [...state.picks, stop];
    if (picks.length < state.trail.length) return { state: { ...state, picks } };
    const correct = state.trail.filter((item, index) => picks[index] === item).length;
    return { state: { ...state, picks }, scored: { correct, answered: state.trail.length }, finished: true };
  },
  describe(state, language) {
    if (state.phase === "study") {
      return {
        prompt: batchPhrase("trail.study", language, { stops: numbered(language, state.trail) }),
        detail: batchCopy("trail.study.detail", language),
        choices: [{ id: "ready", label: batchCopy("trail.hide", language) }],
      };
    }
    const choices = TRAIL_STOPS.map((stop) => ({ id: `stop-${stop}`, label: stopName(language, stop) }));
    if (state.picks.length > 0) choices.push({ id: "undo", label: batchCopy("trail.undo", language) });
    if (!state.replayed) choices.push({ id: "replay", label: batchCopy("trail.replay", language) });
    return {
      prompt: batchPhrase("trail.recall", language, {
        picked: state.picks.length > 0 ? numbered(language, state.picks) : batchCopy("trail.none", language),
        n: Math.min(state.picks.length + 1, state.trail.length),
        total: state.trail.length,
      }),
      detail: batchCopy("trail.recall.detail", language),
      choices,
    };
  },
  solution(state) {
    if (state.phase === "study") return ["ready"];
    const next = state.trail[state.picks.length];
    const onTrack = state.picks.every((pick, index) => state.trail[index] === pick);
    if (!onTrack) return ["undo"];
    return next ? [`stop-${next}`] : [];
  },
};
