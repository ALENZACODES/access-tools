import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import {
  CATALOG,
  GAMES_BOUNDARY,
  GAMES_DATABASE_NAME,
  GamesApp,
  buildDailySet,
  choose,
  createSession,
  daysPlayed,
  defaultSettings,
  deleteGamesData,
  expireTrial,
  filterGames,
  openGamesDatabase,
  parseRound,
  pauseSession,
  playPerfect,
  searchGames,
  stepScan,
  viewSession,
  writeSettings,
  type GamesRound,
  type GamesSettings,
} from "../src/index.js";

describe("games catalog", () => {
  it("ships original activities and no proprietary game name", () => {
    const blob = JSON.stringify(CATALOG).toLowerCase();
    expect(blob).not.toContain("lumosity");
    expect(CATALOG.map((game) => game.id)).toEqual([
      "same-or-different",
      "card-two-back",
      "lit-tiles",
      "odd-symbol",
      "word-or-frame",
      "which-is-larger",
      "outing-order",
      "visit-each-stop",
      "extra-word",
      "quiet-count",
    ]);
  });

  it("can finish every game in relaxed mode without a timer", () => {
    for (const game of CATALOG) {
      const started = createSession(game.id, { seed: 7, pace: "relaxed", language: "en", timerEnabled: false });
      expect(viewSession(started).timerVisible).toBe(false);
      const finished = playPerfect(started);
      const view = viewSession(finished);
      expect(view.status, game.id).toBe("complete");
      expect(view.points).toBeGreaterThan(0);
      expect(view.announcement).toMatch(/stop here|Round finished/i);
    }
  });

  it("plays in French and does not use colour as the only cue", () => {
    const session = createSession("same-or-different", { seed: 3, pace: "relaxed", language: "fr", timerEnabled: false });
    const view = viewSession(session);
    expect(view.prompt).toMatch(/Gauche/);
    expect(view.detail).toMatch(/couleur/i);
    const finished = playPerfect(createSession("extra-word", { seed: 2, pace: "relaxed", language: "fr", timerEnabled: false }));
    expect(viewSession(finished).status).toBe("complete");
  });

  it("does not let a brisk timer end a relaxed round or a quiet count", () => {
    const relaxed = createSession("same-or-different", { seed: 1, pace: "relaxed", language: "en", timerEnabled: true });
    expect(expireTrial(relaxed)).toBe(relaxed);
    const quiet = createSession("quiet-count", { seed: 1, pace: "brisk", language: "en", timerEnabled: true });
    expect(expireTrial(quiet)).toBe(quiet);
    const brisk = createSession("same-or-different", { seed: 4, pace: "brisk", language: "en", timerEnabled: true });
    const skipped = expireTrial(brisk);
    expect(viewSession(skipped).prompt).not.toBe(viewSession(brisk).prompt);
    expect(skipped.done || (skipped.data.index as number) > 0).toBe(true);
  });

  it("rejects a wrong stop without ending the puzzle", () => {
    const session = createSession("visit-each-stop", { seed: 1, pace: "relaxed", language: "en", timerEnabled: false });
    const rejected = choose(session, "cafe");
    expect(rejected.done).toBe(false);
    expect(viewSession(rejected).prompt).toMatch(/Nothing is lost/);
  });

  it("hides studied cells after the player continues", () => {
    let session = createSession("lit-tiles", { seed: 5, pace: "relaxed", language: "en", timerEnabled: false });
    const study = viewSession(session).prompt;
    expect(study).toMatch(/Row/);
    session = choose(session, "ready");
    expect(viewSession(session).prompt).not.toMatch(/Study these cells/);
  });

  it("pause does not discard the round", () => {
    const session = createSession("which-is-larger", { seed: 1, pace: "standard", language: "en", timerEnabled: false });
    const paused = pauseSession(session);
    expect(viewSession(paused).paused).toBe(true);
    const resumed = choose(paused, "resume");
    expect(viewSession(resumed).prompt).toMatch(/Which is larger/);
  });
});

describe("games hub rules", () => {
  it("filters, builds a short daily set, and treats a missed day as ordinary", () => {
    expect(filterGames("calm", []).every((game) => game.calm)).toBe(true);
    expect(searchGames("compte").map((game) => game.id)).toContain("quiet-count");
    const daily = buildDailySet({ minutes: 5, skipIds: ["quiet-count"], seed: 9 });
    expect(daily.every((game) => game.short && game.id !== "quiet-count")).toBe(true);
    expect(daily.reduce((sum, game) => sum + game.estimatedMinutes, 0)).toBeGreaterThan(0);
    const message = daysPlayed(
      [
        round("2026-11-12T12:00:00.000Z"),
        round("2026-11-12T18:00:00.000Z"),
      ],
      new Date("2026-11-13T12:00:00.000Z"),
    );
    expect(message.count).toBe(1);
    expect(message.message.en).toMatch(/not a failure/);
  });

  it("moves switch focus without a timer", () => {
    expect(stepScan(0, 4, 1)).toBe(1);
    expect(stepScan(0, 4, -1)).toBe(3);
  });
});

describe("games store", () => {
  it("uses its own database and refuses health fields", async () => {
    expect(GAMES_DATABASE_NAME).toBe("the-app-games");
    const db = await openGamesDatabase();
    const settings = defaultSettings("player-12345678");
    expect(settings.timerEnabled).toBe(false);
    expect(settings.pace).toBe("relaxed");
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
    gameId: "quiet-count",
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
    />
  );
}

describe("games screen", () => {
  it("supports keyboard, switch, and a screen-reader prompt", async () => {
    const { container } = render(<Harness />);
    expect(screen.getByRole("note").textContent).toBe(GAMES_BOUNDARY.en);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Play Quiet Count" }));
    expect(screen.getAllByText(/not a breathing treatment/i).length).toBeGreaterThan(0);
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Choose" }));
    expect(container.querySelector("[aria-live='polite']")?.textContent).toMatch(/Count 0 of/i);
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
