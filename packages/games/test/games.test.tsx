import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { GAME_COPY, frenchColonViolations } from "../src/i18n.js";
import {
  CATALOG,
  GAMES_BOUNDARY,
  GAMES_DATABASE_NAME,
  GamesApp,
  buildDailySet,
  createSession,
  defaultSettings,
  deleteGamesData,
  expireTrial,
  openGamesDatabase,
  parseRound,
  pauseSession,
  playPerfect,
  streakFromDates,
  viewSession,
  writeSettings,
  type GamesRound,
  type GamesSettings,
} from "../src/index.js";

const NAMES = [
  "Grid Recall",
  "Pair Sequence",
  "Route Planner",
  "Pattern Rules",
  "Word Roots Builder",
  "Number Compare",
  "Focus Flankers",
  "Switch Rules",
  "Shape Assembly",
  "Order Keeper",
];

describe("games catalog", () => {
  it("uses the ten scope-lock names and no proprietary game name", () => {
    const blob = JSON.stringify(CATALOG).toLowerCase();
    expect(blob).not.toContain("lumosity");
    expect(blob).not.toContain("brisk");
    expect(CATALOG.map((game) => game.name)).toEqual(NAMES);
    for (const game of CATALOG) {
      expect(game.timingNote.en).toMatch(/Untimed/);
      expect(game.inputNote.en).toMatch(/switch/i);
    }
  });

  it("can finish every game untimed, including practice with no score", () => {
    for (const game of CATALOG) {
      const started = createSession(game.id, { seed: 7, pace: "relaxed", language: "en", timerEnabled: false });
      expect(viewSession(started).timerVisible).toBe(false);
      const finished = playPerfect(started);
      const view = viewSession(finished);
      expect(view.status, game.id).toBe("complete");
      expect(view.points, game.id).toBeGreaterThan(0);
      expect(view.scoreVisible, game.id).toBe(true);
      expect(view.announcement).toMatch(/Round finished/i);
      const practice = viewSession(playPerfect(createSession(game.id, { seed: 7, pace: "relaxed", language: "en", timerEnabled: true, practice: true })));
      expect(practice.scoreVisible, game.id).toBe(false);
      expect(practice.points, game.id).toBe(0);
      expect(practice.announcement).toMatch(/No score is kept/i);
    }
  });

  it("plays Pair Sequence in French with a text label, and ignores a timer call", () => {
    const session = createSession("pair-sequence", { seed: 3, pace: "relaxed", language: "fr", timerEnabled: true });
    expect(viewSession(session).prompt).toMatch(/Maintenant/);
    expect(viewSession(session).detail).toMatch(/couleur/i);
    expect(expireTrial(session)).toBe(session);
    const finished = playPerfect(createSession("focus-flankers", { seed: 2, pace: "brisk", language: "en", timerEnabled: true }));
    expect(viewSession(finished).status).toBe("complete");
    expect(viewSession(finished).timerVisible).toBe(false);
  });

  it("keeps Route Planner going after a wrong direction and can undo", () => {
    const session = createSession("route-planner", { seed: 1, pace: "relaxed", language: "en", timerEnabled: false });
    const moved = playPerfect(session);
    expect(viewSession(moved).status).toBe("complete");
    const paused = pauseSession(session);
    expect(viewSession(paused).paused).toBe(true);
  });
});

describe("games hub rules", () => {
  it("builds three games for a date, rotates, and applies two grace days", () => {
    const first = buildDailySet("2026-11-01").map((game) => game.name);
    const same = buildDailySet("2026-11-01").map((game) => game.name);
    const later = buildDailySet("2026-11-02").map((game) => game.name);
    expect(first).toHaveLength(3);
    expect(same).toEqual(first);
    expect(later).not.toEqual(first);
    expect(streakFromDates(["2026-11-01", "2026-11-04"], "2026-11-04")).toEqual({ streak: 2, graceRemaining: 0 });
    expect(streakFromDates(["2026-11-01", "2026-11-05"], "2026-11-05")).toEqual({ streak: 1, graceRemaining: 2 });
    expect(streakFromDates(["2026-11-01"], "2026-11-04").streak).toBe(1);
    expect(streakFromDates(["2026-11-01"], "2026-11-05").streak).toBe(0);
  });
});

describe("games store", () => {
  it("uses its own database and refuses health fields", async () => {
    expect(GAMES_DATABASE_NAME).toBe("the-app-games");
    const db = await openGamesDatabase();
    const settings = defaultSettings("player-12345678");
    expect(settings.timerEnabled).toBe(false);
    await writeSettings(db, settings);
    await expect(writeSettings(db, { ...settings, diagnosis: "x" })).rejects.toThrow(/health/i);
    expect(() => parseRound({ ...round("2026-11-13T12:00:00.000Z"), catheter: "x" })).toThrow(/health|catheter/i);
    await deleteGamesData(db);
    db.close();
  });
});

function round(endedAt: string): GamesRound {
  return {
    schemaVersion: "games-round-1.0.0",
    roundId: `round-${endedAt}`,
    playerId: "player-12345678",
    gameId: "grid-recall",
    pace: "relaxed",
    timerEnabled: false,
    startedAt: endedAt,
    endedAt,
    completed: true,
    points: 1,
    correctCount: 1,
    trialCount: 1,
  };
}

function Harness() {
  const [settings, setSettings] = useState<GamesSettings>(defaultSettings("player-12345678"));
  const [rounds, setRounds] = useState<GamesRound[]>([]);
  return (
    <GamesApp
      settings={settings}
      rounds={rounds}
      seed={11}
      now={new Date("2026-11-13T15:00:00.000Z")}
      onSettings={setSettings}
      onRound={(item) => setRounds((current) => [...current, item])}
      onResetStreak={() => setRounds([])}
    />
  );
}

describe("games catalogue", () => {
  it("puts a no-break space before every French colon", () => {
    expect(frenchColonViolations(GAME_COPY)).toEqual([]);
  });
});

describe("games screen", () => {
  it("supports keyboard, switch, practice, and a screen-reader prompt", async () => {
    const { container } = render(<Harness />);
    expect(screen.getByRole("note").textContent).toBe(GAMES_BOUNDARY.en);
    expect(screen.getByText(/Two missed days do not break the streak/i)).toBeInTheDocument();
    expect(screen.getByText(/not a prescription/i)).toBeInTheDocument();
    expect(screen.queryByText(/brisk/i)).not.toBeInTheDocument();
    for (const name of NAMES) expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Practice Grid Recall" }));
    expect(screen.getByRole("status").textContent).toMatch(/No score is shown/i);
    const live = container.querySelector("[aria-live='polite']");
    expect(live?.textContent).toMatch(/star/i);
    headingFocus(container);
    await user.click(screen.getByRole("button", { name: "Back to games" }));
    expect(screen.getByRole("button", { name: "Play Grid Recall" })).toHaveFocus();
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

function headingFocus(container: HTMLElement): void {
  const heading = container.querySelector("h1");
  expect(heading).toHaveFocus();
}
