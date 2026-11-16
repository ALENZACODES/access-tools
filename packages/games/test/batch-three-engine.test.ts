import { describe, expect, it } from "vitest";
import { BATCH_THREE_COPY } from "../src/batch3/copy.js";
import { CLOCK_ADDS, CLOCK_TURN, clockAfter, clockParts } from "../src/batch3/clockHop.js";
import { compassEnd, placeId } from "../src/batch3/compassSteps.js";
import { dayAfter } from "../src/batch3/dayHop.js";
import { cellId, gridCell } from "../src/batch3/gridGap.js";
import { GROUPS, GROUP_WORDS } from "../src/batch3/groupFinder.js";
import { tallyCount } from "../src/batch3/tallyRow.js";
import { frenchColonViolations } from "../src/i18n.js";
import {
  BATCH_THREE_CATALOG,
  BATCH_TWO_CATALOG,
  CATALOG,
  GAME_LIBRARY,
  TASK_FAMILY_LABEL,
  buildDailySet,
  choose,
  createSession,
  filterGames,
  healthClaimHits,
  metaById,
  pauseSession,
  playPerfect,
  searchGames,
  solutionIds,
  surpriseGame,
  viewSession,
  type BatchThreeState,
  type GameSession,
  type Language,
} from "../src/index.js";

const NEW_NAMES = ["Tally Row", "Day Hop", "Compass Steps", "Grid Gap", "Group Finder", "Clock Hop"];
const SEEDS = Array.from({ length: 30 }, (_, index) => index + 1);
const LANGUAGES: Language[] = ["en", "fr"];

function start(id: string, seed = 7, language: Language = "en", practice = false): GameSession {
  return createSession(id, { seed, pace: "relaxed", language, timerEnabled: false, practice });
}

function stateOf<G extends BatchThreeState["game"]>(session: GameSession, game: G): Extract<BatchThreeState, { game: G }> {
  if (session.data.kind !== "batch-three" || session.data.state.game !== game) throw new Error(`Not a ${game} round`);
  return session.data.state as Extract<BatchThreeState, { game: G }>;
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

describe("third batch catalogue", () => {
  it("adds six games after the first nineteen, with original names and the shared notes", () => {
    expect(BATCH_THREE_CATALOG.map((game) => game.name)).toEqual(NEW_NAMES);
    expect(GAME_LIBRARY.map((game) => game.id)).toEqual([...CATALOG, ...BATCH_TWO_CATALOG, ...BATCH_THREE_CATALOG].map((game) => game.id));
    expect(GAME_LIBRARY).toHaveLength(25);
    expect(new Set(GAME_LIBRARY.map((game) => game.id)).size).toBe(25);
    expect(new Set(GAME_LIBRARY.map((game) => game.name)).size).toBe(25);
    expect(new Set(GAME_LIBRARY.map((game) => game.taskFamily)).size).toBe(25);
    for (const game of BATCH_THREE_CATALOG) {
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
      expect(game.summary.en.length).toBeLessThanOrEqual(120);
      expect(game.summary.fr).not.toBe(game.summary.en);
      expect(TASK_FAMILY_LABEL[game.taskFamily].en).toBeTruthy();
      expect(TASK_FAMILY_LABEL[game.taskFamily].fr).toBeTruthy();
      expect(game.estimatedMinutes).toBeLessThanOrEqual(3);
    }
    expect(() => metaById("no-such-game")).toThrow(/Unknown game/);
    expect(() => start("no-such-game")).toThrow(/Unknown game/);
  });

  it("registers the new games in the hub list, search, filters, Surprise me, and the daily set", () => {
    expect(filterGames("all", []).map((game) => game.name)).toEqual(GAME_LIBRARY.map((game) => game.name));
    expect(filterGames("short", []).length).toBe(25);
    expect(filterGames("favourites", ["grid-gap"]).map((game) => game.name)).toEqual(["Grid Gap"]);
    expect(searchGames("tally").map((game) => game.id)).toEqual(["tally-row"]);
    expect(searchGames("jour de la semaine").map((game) => game.id)).toEqual(["day-hop"]);
    expect(surpriseGame(["clock-hop"], 5).id).toBe("clock-hop");
    const surprises = new Set(Array.from({ length: 200 }, (_, index) => surpriseGame([], index + 1).id));
    expect(BATCH_THREE_CATALOG.some((game) => surprises.has(game.id))).toBe(true);
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
    expect(frenchColonViolations(BATCH_THREE_COPY)).toEqual([]);
    expect(healthClaimHits(BATCH_THREE_COPY)).toEqual([]);
    expect(healthClaimHits()).toEqual([]);
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
    for (const [key, row] of Object.entries(BATCH_THREE_COPY)) {
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

  it("keeps game names in English in both languages, as the hub says it does", () => {
    for (const game of BATCH_THREE_CATALOG) {
      const row = BATCH_THREE_COPY[`name.${game.id}` as keyof typeof BATCH_THREE_COPY];
      expect(row.fr).toBe(row.en);
      expect(game.name).toBe(row.en);
    }
  });
});

describe("third batch rounds", () => {
  it("plays every game to the end without a clock, in both languages, from many seeds", () => {
    for (const game of BATCH_THREE_CATALOG) {
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
            expect(view.choices.length, where).toBe(3);
            expect(new Set(view.choices.map((choice) => choice.id)).size, where).toBe(view.choices.length);
            expect(new Set(view.choices.map((choice) => choice.label)).size, where).toBe(view.choices.length);
            for (const choice of view.choices) {
              expect(choice.label.trim(), where).not.toBe("");
              expect(choice.label, where).not.toMatch(/[{}]|undefined|NaN/);
            }
            const step = solutionIds(session)[0];
            expect(view.choices.map((choice) => choice.id), where).toContain(step);
            session = choose(session, step ?? "");
          }
          const done = viewSession(session);
          expect(done.status, game.id).toBe("complete");
          expect(done.choices).toEqual([]);
          expect(done.trialCount, game.id).toBeGreaterThanOrEqual(3);
          expect(done.correctCount, game.id).toBe(done.trialCount);
          expect(done.points, game.id).toBe(done.trialCount);
          expect(done.scoreVisible).toBe(true);
          expect(choose(session, "anything")).toBe(session);
        }
      }
    }
  });

  it("gives the same round for the same seed, and the two languages ask the same questions", () => {
    for (const game of BATCH_THREE_CATALOG) {
      expect(start(game.id, 12).data, game.id).toEqual(start(game.id, 12).data);
      expect(start(game.id, 12, "fr").data, game.id).toEqual(start(game.id, 12, "en").data);
      expect(solutionIds(start(game.id, 12, "fr"))).toEqual(solutionIds(start(game.id, 12, "en")));
    }
  });

  it("keeps practice unscored, ignores unknown choices, and holds still while paused", () => {
    for (const game of BATCH_THREE_CATALOG) {
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
    for (const game of BATCH_THREE_CATALOG) {
      const finished = viewSession(playWrong(start(game.id, 9)));
      expect(finished.status, game.id).toBe("complete");
      expect(finished.correctCount, game.id).toBe(0);
      expect(finished.trialCount, game.id).toBeGreaterThanOrEqual(3);
      expect(finished.announcement).toMatch(/Round finished/);
    }
  });

  it("refuses a choice that is well formed but not on the screen", () => {
    const cases: Array<[string, string[]]> = [
      ["tally-row", ["n-99"]],
      ["day-hop", ["day-7", "day-x"]],
      ["compass-steps", ["at_9_9"]],
      ["grid-gap", ["cell-9-9"]],
      ["group-finder", ["group-4"]],
      ["clock-hop", ["t-9999"]],
    ];
    for (const [id, choices] of cases) {
      const session = start(id, 3);
      for (const choice of choices) expect(choose(session, choice), `${id} ${choice}`).toBe(session);
    }
  });
});

describe("Tally Row", () => {
  it("lists a row of seven to ten shapes and asks for a count that is on the screen", () => {
    for (const seed of SEEDS) {
      const state = stateOf(start("tally-row", seed), "tally-row");
      expect(state.trials).toHaveLength(4);
      for (const trial of state.trials) {
        expect(trial.row.length).toBeGreaterThanOrEqual(7);
        expect(trial.row.length).toBeLessThanOrEqual(10);
        expect(trial.answer).toBe(tallyCount(trial.row, trial.target));
        expect(trial.answer).toBeGreaterThanOrEqual(2);
        expect(trial.options).toContain(trial.answer);
        expect(new Set(trial.options).size).toBe(3);
        for (const option of trial.options) expect(option).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("writes every shape of the row into the question", () => {
    const session = start("tally-row", 5);
    const trial = stateOf(session, "tally-row").trials[0];
    const prompt = viewSession(session).prompt;
    const listed = prompt.slice(prompt.indexOf("in order: ") + 10, prompt.indexOf(". How many")).split(", ");
    expect(listed).toHaveLength(trial?.row.length ?? 0);
    for (const word of listed) expect(["circle", "square", "triangle"]).toContain(word);
  });
});

describe("Day Hop", () => {
  it("goes round the week in both directions", () => {
    expect(dayAfter(0, 2)).toBe(2);
    expect(dayAfter(6, 1)).toBe(0);
    expect(dayAfter(5, 4)).toBe(2);
    expect(dayAfter(0, -1)).toBe(6);
    expect(dayAfter(1, -4)).toBe(4);
  });

  it("asks forward and backward questions whose answer is among three different days", () => {
    for (const seed of SEEDS) {
      const state = stateOf(start("day-hop", seed), "day-hop");
      expect(state.trials.map((trial) => trial.direction)).toEqual(["after", "before", "after", "before"]);
      for (const trial of state.trials) {
        expect(trial.distance).toBeGreaterThanOrEqual(2);
        expect(trial.distance).toBeLessThanOrEqual(4);
        expect(trial.answer).toBe(dayAfter(trial.start, trial.direction === "after" ? trial.distance : -trial.distance));
        expect(trial.answer).not.toBe(trial.start);
        expect(new Set(trial.options).size).toBe(3);
        expect(trial.options).toContain(trial.answer);
      }
    }
  });

  it("names the days in French without capitals", () => {
    const view = viewSession(start("day-hop", 2, "fr"));
    for (const choice of view.choices) expect(["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]).toContain(choice.label);
  });
});

describe("Compass Steps", () => {
  it("adds up moves on the grid", () => {
    expect(compassEnd([])).toEqual([0, 0]);
    expect(
      compassEnd([
        { direction: "north", steps: 2 },
        { direction: "east", steps: 1 },
        { direction: "south", steps: 3 },
      ]),
    ).toEqual([1, -1]);
    expect(compassEnd([{ direction: "west", steps: 2 }])).toEqual([-2, 0]);
  });

  it("gives three moves that never repeat a direction back to back, and three different places to choose from", () => {
    for (const seed of SEEDS) {
      const state = stateOf(start("compass-steps", seed), "compass-steps");
      expect(state.trials).toHaveLength(3);
      for (const trial of state.trials) {
        expect(trial.moves).toHaveLength(3);
        for (let index = 1; index < trial.moves.length; index += 1) expect(trial.moves[index]?.direction).not.toBe(trial.moves[index - 1]?.direction);
        for (const move of trial.moves) {
          expect(move.steps).toBeGreaterThanOrEqual(1);
          expect(move.steps).toBeLessThanOrEqual(3);
        }
        expect(trial.answer).toEqual(compassEnd(trial.moves));
        expect(new Set(trial.options.map(placeId)).size).toBe(3);
        expect(trial.options.map(placeId)).toContain(placeId(trial.answer));
      }
    }
  });

  it("says the grid is made up, and words a place with no steps one way", () => {
    expect(viewSession(start("compass-steps", 1)).prompt).toMatch(/Made-up grid, not a real place/);
    expect(viewSession(start("compass-steps", 1, "fr")).prompt).toMatch(/Grille inventée, pas un lieu réel/);
    const labels = new Set<string>();
    for (const seed of Array.from({ length: 120 }, (_, index) => index + 1)) {
      let session = start("compass-steps", seed);
      while (!session.done) {
        for (const choice of viewSession(session).choices) labels.add(choice.label);
        session = choose(session, solutionIds(session)[0] ?? "");
      }
    }
    expect([...labels].some((label) => label.includes("no steps north or south"))).toBe(true);
    expect([...labels].some((label) => label.includes("no steps east or west"))).toBe(true);
    expect([...labels].some((label) => /^\d north, \d west$/.test(label))).toBe(true);
  });
});

describe("Grid Gap", () => {
  it("keeps one shape in each row and one size in each column, and leaves out one cell", () => {
    for (const seed of SEEDS) {
      const state = stateOf(start("grid-gap", seed), "grid-gap");
      expect(state.trials).toHaveLength(3);
      for (const trial of state.trials) {
        expect([...trial.rowShapes].sort()).toEqual([0, 1, 2]);
        expect([...trial.columnSizes].sort()).toEqual([0, 1, 2]);
        const answer = gridCell(trial, trial.gap[0], trial.gap[1]);
        expect(trial.options.map(cellId)).toContain(cellId(answer));
        expect(new Set(trial.options.map(cellId)).size).toBe(3);
        const wrong = trial.options.filter((cell) => cellId(cell) !== cellId(answer));
        expect(wrong.filter((cell) => cell.shape !== answer.shape && cell.size === answer.size)).toHaveLength(1);
        expect(wrong.filter((cell) => cell.shape === answer.shape && cell.size !== answer.size)).toHaveLength(1);
      }
    }
  });

  it("writes eight cells and one gap, and never shows the answer in the grid", () => {
    const session = start("grid-gap", 6);
    const view = viewSession(session);
    const answer = view.choices.find((choice) => choice.id === solutionIds(session)[0])?.label ?? "";
    expect(view.prompt.match(/\bgap\b/g)).toHaveLength(2);
    const grid = view.prompt.slice(view.prompt.indexOf("Row 1"), view.prompt.indexOf("What goes"));
    expect(grid.split(/, |\. Row \d: |Row 1: /).filter((cell) => cell.trim() !== "" && !cell.includes("gap")).length).toBe(8);
    expect(grid).not.toContain(answer);
    expect(viewSession(start("grid-gap", 6, "fr")).prompt).toMatch(/Rangée 1\u00A0: /);
  });
});

describe("Group Finder", () => {
  it("has four words in each of four groups, each word with English and French", () => {
    expect(GROUPS).toHaveLength(4);
    for (let group = 0; group < GROUPS.length; group += 1) expect(GROUP_WORDS.filter((item) => item.group === group)).toHaveLength(4);
    expect(new Set(GROUP_WORDS.map((item) => item.word)).size).toBe(GROUP_WORDS.length);
    for (const item of GROUP_WORDS) {
      const row = BATCH_THREE_COPY[`word.${item.word}` as keyof typeof BATCH_THREE_COPY];
      expect(row.en, item.word).toBe(item.word);
      expect(row.fr.trim(), item.word).not.toBe("");
    }
  });

  it("asks about one word from each group, with the right group among three", () => {
    for (const seed of SEEDS) {
      const state = stateOf(start("group-finder", seed), "group-finder");
      expect(state.trials).toHaveLength(4);
      expect(new Set(state.trials.map((trial) => GROUP_WORDS[trial.word]?.group)).size).toBe(4);
      for (const trial of state.trials) {
        expect(new Set(trial.options).size).toBe(3);
        expect(trial.options).toContain(GROUP_WORDS[trial.word]?.group);
      }
    }
  });
});

describe("Clock Hop", () => {
  it("goes round a twelve-hour clock", () => {
    expect(CLOCK_TURN).toBe(720);
    expect(clockParts(0)).toEqual({ hour: 12, minute: 0 });
    expect(clockParts(45)).toEqual({ hour: 12, minute: 45 });
    expect(clockParts(60)).toEqual({ hour: 1, minute: 0 });
    expect(clockParts(clockAfter(45, 30))).toEqual({ hour: 1, minute: 15 });
    expect(clockParts(clockAfter(11 * 60 + 45, 90))).toEqual({ hour: 1, minute: 15 });
    expect(clockParts(clockAfter(0, -15))).toEqual({ hour: 11, minute: 45 });
  });

  it("starts on a quarter hour, adds a listed number of minutes, and offers three different times", () => {
    for (const seed of SEEDS) {
      const state = stateOf(start("clock-hop", seed), "clock-hop");
      expect(state.trials).toHaveLength(4);
      for (const trial of state.trials) {
        expect(trial.start % 15).toBe(0);
        expect(trial.start).toBeLessThan(CLOCK_TURN);
        expect(CLOCK_ADDS).toContain(trial.add);
        expect(trial.answer).toBe(clockAfter(trial.start, trial.add));
        expect(new Set(trial.options).size).toBe(3);
        expect(trial.options).toContain(trial.answer);
      }
    }
  });

  it("writes times as 3:05 in English and 3 h 05 in French, and says no clock is timing the person", () => {
    const en = viewSession(start("clock-hop", 8));
    const fr = viewSession(start("clock-hop", 8, "fr"));
    for (const choice of en.choices) expect(choice.label).toMatch(/^(1[0-2]|[1-9]):[0-5]\d$/);
    for (const choice of fr.choices) expect(choice.label).toMatch(/^(1[0-2]|[1-9]) h [0-5]\d$/);
    expect(en.detail).toMatch(/No clock is timing you/);
    expect(fr.detail).toMatch(/Aucune horloge ne vous minute/);
    expect(en.timerVisible).toBe(false);
  });
});
