import { describe, expect, it } from "vitest";
import { BATCH_COPY } from "../src/batch2/copy.js";
import { JUG_MOVES, JUG_PUZZLES, jugMove, jugPlan } from "../src/batch2/jugMeasure.js";
import { mirrorAnswer } from "../src/batch2/mirrorMoves.js";
import { oddItem } from "../src/batch2/oddOneOut.js";
import { scaleAnswer } from "../src/batch2/scaleSense.js";
import { WORD_POOL_SIZE, mixWord, scrambleWord } from "../src/batch2/wordGames.js";
import { frenchColonViolations } from "../src/i18n.js";
import {
  BATCH_TWO_CATALOG,
  CATALOG,
  GAME_LIBRARY,
  TASK_FAMILY_LABEL,
  buildDailySet,
  choose,
  createSession,
  filterGames,
  metaById,
  pauseSession,
  playPerfect,
  searchGames,
  solutionIds,
  surpriseGame,
  viewSession,
  type BatchTwoState,
  type GameSession,
  type Language,
} from "../src/index.js";

const NEW_NAMES = [
  "Odd One Out",
  "Trail Recall",
  "Mirror Moves",
  "Scale Sense",
  "Jug Measure",
  "Sentence Gap",
  "Letter Mix",
  "Sum Check",
  "Number Steps",
];
const SEEDS = Array.from({ length: 30 }, (_, index) => index + 1);
const LANGUAGES: Language[] = ["en", "fr"];

function start(id: string, seed = 7, language: Language = "en", practice = false): GameSession {
  return createSession(id, { seed, pace: "relaxed", language, timerEnabled: false, practice });
}

function stateOf<G extends BatchTwoState["game"]>(session: GameSession, game: G): Extract<BatchTwoState, { game: G }> {
  if (session.data.kind !== "batch-two" || session.data.state.game !== game) throw new Error(`Not a ${game} round`);
  return session.data.state as Extract<BatchTwoState, { game: G }>;
}

function sortedLetters(word: string): string {
  return [...word].sort().join("");
}

/** Plays a round, answering every scored question with a choice that is not the solution. */
function playWrong(session: GameSession): GameSession {
  let current = session;
  for (let guard = 0; guard < 80 && !current.done; guard += 1) {
    const right = solutionIds(current);
    const wrong = viewSession(current).choices.find((choice) => !right.includes(choice.id));
    if (!wrong) break;
    current = choose(current, wrong.id);
  }
  return current;
}

describe("second batch catalogue", () => {
  it("adds nine games after the first ten, with original names and the shared notes", () => {
    expect(BATCH_TWO_CATALOG.map((game) => game.name)).toEqual(NEW_NAMES);
    // A third batch now follows these nineteen in the library.
    expect(GAME_LIBRARY.slice(0, 19).map((game) => game.id)).toEqual([...CATALOG, ...BATCH_TWO_CATALOG].map((game) => game.id));
    expect(new Set(GAME_LIBRARY.map((game) => game.id)).size).toBe(GAME_LIBRARY.length);
    expect(new Set(GAME_LIBRARY.map((game) => game.name)).size).toBe(GAME_LIBRARY.length);
    expect(new Set(GAME_LIBRARY.map((game) => game.taskFamily)).size).toBe(GAME_LIBRARY.length);
    for (const game of BATCH_TWO_CATALOG) {
      expect(metaById(game.id)).toBe(game);
      expect(game.timingNote.en).toMatch(/Untimed/);
      expect(game.timingNote.fr).toMatch(/Sans minuterie/);
      expect(game.inputNote.en).toMatch(/tap/i);
      expect(game.inputNote.en).toMatch(/keyboard/i);
      expect(game.inputNote.en).toMatch(/switch/i);
      expect(game.inputNote.en).toMatch(/dwell/i);
      expect(game.inputNote.fr).toMatch(/maintien/i);
      expect(game.summary.en.length).toBeGreaterThan(20);
      expect(game.summary.fr.length).toBeGreaterThan(20);
      expect(game.summary.fr).not.toBe(game.summary.en);
      expect(TASK_FAMILY_LABEL[game.taskFamily].en).toBeTruthy();
      expect(TASK_FAMILY_LABEL[game.taskFamily].fr).toBeTruthy();
    }
    expect(() => metaById("no-such-game")).toThrow(/Unknown game/);
    expect(() => start("no-such-game")).toThrow(/Unknown game/);
  });

  it("registers the new games in the hub list, search, filters, Surprise me, and the daily set", () => {
    expect(filterGames("all", []).map((game) => game.name)).toEqual(GAME_LIBRARY.map((game) => game.name));
    expect(filterGames("short", []).length).toBe(GAME_LIBRARY.length);
    expect(filterGames("favourites", ["jug-measure"]).map((game) => game.name)).toEqual(["Jug Measure"]);
    expect(searchGames("jug").map((game) => game.id)).toEqual(["jug-measure"]);
    expect(searchGames("cruches").map((game) => game.id)).toEqual(["jug-measure"]);
    expect(surpriseGame(["letter-mix"], 5).id).toBe("letter-mix");
    const surprises = new Set(SEEDS.map((seed) => surpriseGame([], seed).id));
    expect(BATCH_TWO_CATALOG.some((game) => surprises.has(game.id))).toBe(true);
    const seen = new Set<string>();
    for (let offset = 0; offset < GAME_LIBRARY.length; offset += 1) {
      const date = new Date(Date.UTC(2026, 10, 1 + offset)).toISOString().slice(0, 10);
      const set = buildDailySet(date);
      expect(set).toHaveLength(3);
      expect(new Set(set.map((game) => game.id)).size).toBe(3);
      for (const game of set) seen.add(game.id);
    }
    expect([...seen].sort()).toEqual(GAME_LIBRARY.map((game) => game.id).sort());
  });

  it("has English and French for every string, with French colons spaced and no health or benefit claim", () => {
    expect(frenchColonViolations(BATCH_COPY)).toEqual([]);
    const banned = [
      /brain/i,
      /cerveau/i,
      /th[ée]rap/i,
      /rehab|r[ée]adaptation/i,
      /clinical|clinique/i,
      /\btreat|traitement/i,
      /diagnos/i,
      /\b(improv|boost|sharpen|strengthen|am[ée]lior|renforc)\w*/i,
      /\bproven\b|prouv[ée]/i,
      /recover|gu[ée]ri/i,
      /cogniti/i,
    ];
    for (const [key, row] of Object.entries(BATCH_COPY)) {
      expect(row.en.trim(), key).not.toBe("");
      expect(row.fr.trim(), key).not.toBe("");
      for (const pattern of banned) {
        expect(row.en, key).not.toMatch(pattern);
        expect(row.fr, key).not.toMatch(pattern);
      }
      const holes = (text: string) => (text.match(/\{[a-zA-Z]+\}/g) ?? []).sort();
      expect(holes(row.fr), key).toEqual(holes(row.en));
    }
  });
});

describe("second batch rounds", () => {
  it("plays every game to the end without a clock, in both languages, from many seeds", () => {
    for (const game of BATCH_TWO_CATALOG) {
      for (const language of LANGUAGES) {
        for (const seed of SEEDS) {
          let session = start(game.id, seed, language);
          for (let guard = 0; guard < 80 && !session.done; guard += 1) {
            const view = viewSession(session);
            const where = `${game.id} ${language} seed ${seed}`;
            expect(view.timerVisible, where).toBe(false);
            expect(view.title).toBe(game.name);
            expect(view.prompt.length, where).toBeGreaterThan(10);
            expect(`${view.prompt} ${view.detail}`, where).not.toMatch(/[{}]|undefined|NaN/);
            expect(view.choices.length, where).toBeGreaterThan(0);
            expect(new Set(view.choices.map((choice) => choice.id)).size, where).toBe(view.choices.length);
            expect(new Set(view.choices.map((choice) => choice.label)).size, where).toBe(view.choices.length);
            for (const choice of view.choices) expect(choice.label.trim(), where).not.toBe("");
            const step = solutionIds(session)[0];
            expect(view.choices.map((choice) => choice.id), where).toContain(step);
            session = choose(session, step ?? "");
          }
          const done = viewSession(session);
          expect(done.status, game.id).toBe("complete");
          expect(done.choices).toEqual([]);
          expect(done.trialCount, game.id).toBeGreaterThan(0);
          expect(done.correctCount, game.id).toBe(done.trialCount);
          expect(done.points, game.id).toBe(done.trialCount);
          expect(done.scoreVisible).toBe(true);
          expect(choose(session, "anything")).toBe(session);
        }
      }
    }
  });

  it("keeps practice unscored, ignores unknown choices, and holds still while paused", () => {
    for (const game of BATCH_TWO_CATALOG) {
      const practice = viewSession(playPerfect(start(game.id, 4, "en", true)));
      expect(practice.status, game.id).toBe("complete");
      expect(practice.points, game.id).toBe(0);
      expect(practice.scoreVisible, game.id).toBe(false);
      expect(practice.announcement).toMatch(/No score is kept/);
      const session = start(game.id, 4);
      expect(choose(session, "not-a-choice"), game.id).toBe(session);
      const paused = pauseSession(session);
      expect(solutionIds(paused)).toEqual([]);
      expect(choose(paused, solutionIds(session)[0] ?? ""), game.id).toBe(paused);
      expect(viewSession(paused).announcement).toBe("Paused.");
      expect(choose(paused, "resume").paused).toBe(false);
    }
  });

  it("scores a wrong answer as wrong and still lets the round finish", () => {
    for (const id of ["odd-one-out", "mirror-moves", "scale-sense", "sentence-gap", "letter-mix", "sum-check", "number-steps"]) {
      const finished = viewSession(playWrong(start(id, 9)));
      expect(finished.status, id).toBe("complete");
      expect(finished.correctCount, id).toBe(0);
      expect(finished.trialCount, id).toBeGreaterThanOrEqual(3);
      expect(finished.announcement).toMatch(/Round finished/);
    }
  });
});

describe("Odd One Out", () => {
  it("shows four matching items and one that differs in exactly one attribute", () => {
    for (const seed of SEEDS) {
      const session = start("odd-one-out", seed);
      const state = stateOf(session, "odd-one-out");
      expect(state.trials).toHaveLength(4);
      expect(new Set(state.trials.map((trial) => trial.dimension)).size).toBe(3);
      for (const trial of state.trials) {
        const items = [0, 1, 2, 3, 4].map((position) => oddItem(trial, position));
        const same = items.filter((item) => item.join() === trial.base.join());
        expect(same).toHaveLength(4);
        const odd = items[trial.odd] ?? trial.base;
        expect(odd.filter((value, index) => value !== trial.base[index])).toHaveLength(1);
      }
      for (const language of LANGUAGES) {
        const labels = viewSession(start("odd-one-out", seed, language)).choices.map((choice) => choice.label.replace(/^[^:]+:\s*/, ""));
        const counts = labels.map((label) => labels.filter((other) => other === label).length).sort();
        expect(counts).toEqual([1, 4, 4, 4, 4]);
      }
    }
  });
});

describe("Trail Recall", () => {
  it("hides the stops, takes them back in order, and scores each position", () => {
    const session = start("trail-recall", 3);
    const trail = stateOf(session, "trail-recall").trail;
    expect(trail).toHaveLength(4);
    expect(new Set(trail).size).toBe(4);
    for (const stop of trail) expect(viewSession(session).prompt).toContain(stop);
    expect(choose(session, `stop-${trail[0]}`)).toBe(session);
    const recall = choose(session, "ready");
    for (const stop of trail) expect(viewSession(recall).prompt).not.toContain(stop);
    expect(viewSession(recall).choices.map((choice) => choice.id)).not.toContain("undo");
    expect(choose(recall, "undo")).toBe(recall);
    const swapped = [trail[1], trail[0], trail[2], trail[3]];
    let wrong = recall;
    for (const stop of swapped) wrong = choose(wrong, `stop-${stop}`);
    expect(viewSession(wrong).status).toBe("complete");
    expect(viewSession(wrong).correctCount).toBe(2);
    expect(viewSession(wrong).trialCount).toBe(4);
  });

  it("offers undo with no penalty and one more look at the trail", () => {
    const session = start("trail-recall", 5);
    const trail = stateOf(session, "trail-recall").trail;
    const other = ["loon", "pine", "canoe", "maple", "lighthouse", "trillium"].find((stop) => stop !== trail[0]) ?? "loon";
    let current = choose(choose(session, "ready"), `stop-${other}`);
    expect(solutionIds(current)).toEqual(["undo"]);
    expect(viewSession(current).prompt).toContain(`1. ${other}`);
    current = choose(current, "undo");
    expect(stateOf(current, "trail-recall").picks).toEqual([]);
    current = choose(choose(current, `stop-${trail[0]}`), "replay");
    expect(stateOf(current, "trail-recall").phase).toBe("study");
    expect(stateOf(current, "trail-recall").picks).toEqual([]);
    current = choose(current, "ready");
    expect(viewSession(current).choices.map((choice) => choice.id)).not.toContain("replay");
    expect(choose(current, "replay")).toBe(current);
    const done = viewSession(playPerfect(current));
    expect(done.correctCount).toBe(4);
  });
});

describe("Mirror Moves", () => {
  it("uses both written rules and accepts the same or the opposite direction", () => {
    expect(mirrorAnswer({ cue: "same", sign: "up" })).toBe("up");
    expect(mirrorAnswer({ cue: "opposite", sign: "up" })).toBe("down");
    expect(mirrorAnswer({ cue: "opposite", sign: "left" })).toBe("right");
    for (const seed of SEEDS) {
      const state = stateOf(start("mirror-moves", seed), "mirror-moves");
      expect(state.trials).toHaveLength(5);
      expect(state.trials.filter((trial) => trial.cue === "same")).toHaveLength(2);
      expect(state.trials.filter((trial) => trial.cue === "opposite")).toHaveLength(3);
    }
    const session = start("mirror-moves", 2);
    const first = stateOf(session, "mirror-moves").trials[0];
    expect(viewSession(session).prompt).toContain(first?.cue === "same" ? "same way" : "opposite way");
    expect(viewSession(session).prompt).toContain(`The sign says: ${first?.sign}`);
    expect(viewSession(start("mirror-moves", 2, "fr")).prompt).toMatch(/même sens|sens opposé/);
  });
});

describe("Scale Sense", () => {
  it("asks a question that the two statements answer", () => {
    for (const seed of SEEDS) {
      let session = start("scale-sense", seed);
      const trials = stateOf(session, "scale-sense").trials;
      expect(trials.map((trial) => trial.ask)).toEqual(["heaviest", "lightest", "heaviest"]);
      for (const trial of trials) {
        expect(new Set(trial.ranked).size).toBe(3);
        const view = viewSession(session);
        const [top, middle, bottom] = trial.ranked;
        expect(view.prompt).toContain(`the ${top} is heavier than the ${middle}`);
        expect(view.prompt).toContain(`the ${middle} is heavier than the ${bottom}`);
        expect(view.choices.map((choice) => choice.id).sort()).toEqual(trial.ranked.map((thing) => `thing-${thing}`).sort());
        expect(scaleAnswer(trial)).toBe(trial.ask === "heaviest" ? top : bottom);
        expect(view.detail).toMatch(/made up/);
        session = choose(session, `thing-${scaleAnswer(trial)}`);
      }
      expect(session.done).toBe(true);
    }
  });
});

describe("Jug Measure", () => {
  it("can solve every puzzle, and each move keeps the water inside the jugs", () => {
    for (const [capA, capB, target] of JUG_PUZZLES) {
      const plan = jugPlan([0, 0], [capA, capB], target);
      expect(plan, `${capA},${capB},${target}`).not.toBeNull();
      let level: [number, number] = [0, 0];
      for (const move of plan ?? []) {
        const before = level[0] + level[1];
        level = jugMove(level, [capA, capB], move);
        expect(level[0]).toBeGreaterThanOrEqual(0);
        expect(level[1]).toBeGreaterThanOrEqual(0);
        expect(level[0]).toBeLessThanOrEqual(capA);
        expect(level[1]).toBeLessThanOrEqual(capB);
        if (move.startsWith("pour")) expect(level[0] + level[1]).toBe(before);
      }
      expect(level.includes(target)).toBe(true);
    }
    expect(jugPlan([0, 0], [2, 4], 3)).toBeNull();
    expect(jugMove([3, 4], [3, 5], "pour-ab")).toEqual([2, 5]);
    expect(jugMove([0, 5], [3, 5], "pour-ba")).toEqual([3, 2]);
  });

  it("ignores a step that changes nothing, and offers undo and start over", () => {
    const session = start("jug-measure", 6);
    expect(viewSession(session).choices.map((choice) => choice.id)).toEqual([...JUG_MOVES]);
    expect(choose(session, "empty-a")).toBe(session);
    expect(choose(session, "pour-ab")).toBe(session);
    expect(choose(session, "undo")).toBe(session);
    const filled = choose(session, "fill-a");
    const state = stateOf(filled, "jug-measure");
    expect(state.level).toEqual([state.capacity[0], 0]);
    expect(viewSession(filled).prompt).toMatch(/Steps so far: 1\./);
    expect(viewSession(filled).choices.map((choice) => choice.id)).toEqual([...JUG_MOVES, "undo", "reset"]);
    expect(choose(filled, "fill-a")).toBe(filled);
    expect(stateOf(choose(filled, "undo"), "jug-measure").level).toEqual([0, 0]);
    const poured = choose(filled, "pour-ab");
    expect(stateOf(choose(poured, "reset"), "jug-measure")).toMatchObject({ level: [0, 0], history: [] });
    const done = viewSession(playPerfect(poured));
    expect(done.status).toBe("complete");
    expect(done.correctCount).toBe(1);
    expect(done.trialCount).toBe(1);
  });
});

describe("Sentence Gap and Letter Mix", () => {
  it("draws four different items and lists the answer among three words", () => {
    for (const id of ["sentence-gap", "letter-mix"] as const) {
      for (const seed of SEEDS) {
        const state = stateOf(start(id, seed), id);
        expect(state.trials).toHaveLength(4);
        expect(new Set(state.trials.map((trial) => trial.item)).size).toBe(4);
        for (const trial of state.trials) expect([...trial.order].sort()).toEqual([0, 1, 2]);
      }
    }
    const french = viewSession(start("sentence-gap", 1, "fr"));
    expect(french.prompt).toMatch(/\[blanc\]/);
    expect(viewSession(start("sentence-gap", 1)).prompt).toMatch(/\[blank\]/);
  });

  it("mixes the letters of the answer, never shows the word unmixed, and has no second anagram among the options", () => {
    for (const language of LANGUAGES) {
      for (let item = 0; item < WORD_POOL_SIZE; item += 1) {
        const word = mixWord(item, language);
        const decoys = (["b", "c"] as const).map((letter) => BATCH_COPY[`mix.${item}.${letter}` as keyof typeof BATCH_COPY][language]);
        for (const decoy of decoys) expect(sortedLetters(decoy), `${word} ${decoy}`).not.toBe(sortedLetters(word));
        expect(word).toMatch(/^[A-Z]+$/);
        for (const seed of SEEDS) {
          const mixed = scrambleWord(word, seed);
          expect(mixed).not.toBe(word);
          expect(sortedLetters(mixed)).toBe(sortedLetters(word));
        }
      }
      for (const seed of SEEDS) {
        let session = start("letter-mix", seed, language);
        while (!session.done) {
          const view = viewSession(session);
          const shown = (view.prompt.match(/: ([A-Z](?:, [A-Z])+)\./)?.[1] ?? "").replace(/, /g, "");
          const answer = view.choices.find((choice) => choice.id === "opt-0")?.label ?? "";
          expect(sortedLetters(shown)).toBe(sortedLetters(answer));
          expect(view.choices.filter((choice) => sortedLetters(choice.label) === sortedLetters(shown))).toHaveLength(1);
          session = choose(session, "opt-0");
        }
      }
    }
    expect(scrambleWord("AA", 1)).toBe("AA");
  });
});

describe("Sum Check and Number Steps", () => {
  it("builds sums with a correct answer among three different whole numbers", () => {
    for (const seed of SEEDS) {
      const state = stateOf(start("sum-check", seed), "sum-check");
      expect(state.trials.map((trial) => trial.operator)).toEqual(["+", "-", "+", "-"]);
      for (const trial of state.trials) {
        const [a = 0, b = 0] = trial.terms;
        expect(trial.answer).toBe(trial.operator === "+" ? a + b : a - b);
        expect(trial.answer).toBeGreaterThanOrEqual(0);
        expect(trial.options).toHaveLength(3);
        expect(new Set(trial.options).size).toBe(3);
        expect(trial.options).toContain(trial.answer);
        for (const option of trial.options) expect(option).toBeGreaterThanOrEqual(0);
      }
    }
    const session = start("sum-check", 1);
    const first = stateOf(session, "sum-check").trials[0];
    expect(viewSession(session).prompt).toContain(`What is ${first?.terms[0]} plus ${first?.terms[1]}?`);
    expect(choose(session, "n-9999")).toBe(session);
  });

  it("builds number patterns with one steady step and the next number as the answer", () => {
    for (const seed of SEEDS) {
      const state = stateOf(start("number-steps", seed), "number-steps");
      expect(state.trials).toHaveLength(4);
      for (const trial of state.trials) {
        const [a = 0, b = 0, c = 0, d = 0] = trial.terms;
        const step = b - a;
        expect(step).not.toBe(0);
        expect(c - b).toBe(step);
        expect(d - c).toBe(step);
        expect(trial.answer).toBe(d + step);
        expect(trial.answer).toBeGreaterThanOrEqual(0);
        expect(new Set(trial.options).size).toBe(3);
        expect(trial.options).toContain(trial.answer);
      }
    }
  });
});
