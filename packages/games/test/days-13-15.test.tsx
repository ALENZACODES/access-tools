import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GAME_COPY } from "../src/i18n.js";
import {
  CATALOG,
  GAMES_BOUNDARY,
  GamesApp,
  MOTION_CSS,
  OPTIONAL_TIMER_GAME_ID,
  buildDailySet,
  choose,
  createSession,
  defaultSettings,
  healthClaimHits,
  solutionIds,
  viewSession,
  type GameSession,
  type GamesRound,
  type GamesSettings,
  type Language,
} from "../src/index.js";

/**
 * One block per master-plan day, one test per pass sentence the unit level can
 * decide. Visible focus, offline play, and the device's own reduced-motion
 * request need a real browser and are in e2e/games-days.spec.ts.
 */

const SEED = 11;
const DAY_14 = ["grid-recall", "pair-sequence", "route-planner", "pattern-rules", "word-roots-builder"] as const;
const DAY_15 = ["number-compare", "focus-flankers", "switch-rules", "shape-assembly", "order-keeper"] as const;
const DEVICE_ONLY = "Scores stay on this device. Nothing is uploaded.";

function name(id: string): string {
  const game = CATALOG.find((item) => item.id === id);
  if (!game) throw new Error(`No game ${id}`);
  return game.name;
}

function Harness(props: { rounds: GamesRound[]; initial?: Partial<GamesSettings>; onRound?: (round: GamesRound) => void }) {
  const [settings, setSettings] = useState<GamesSettings>({ ...defaultSettings("player-12345678"), ...props.initial });
  return (
    <GamesApp
      settings={settings}
      rounds={props.rounds}
      seed={SEED}
      now={new Date("2026-11-13T15:00:00.000Z")}
      onSettings={setSettings}
      onRound={(round) => {
        props.rounds.push(round);
        props.onRound?.(round);
      }}
      onResetStreak={() => undefined}
    />
  );
}

function start(id: string, language: Language = "en", options: { practice?: boolean; timerEnabled?: boolean } = {}): GameSession {
  return createSession(id, { seed: SEED, pace: "relaxed", language, timerEnabled: options.timerEnabled === true, practice: options.practice === true });
}

/** Moves focus with Tab only, then activates with Enter. No pointer is used. */
async function keyboardPress(user: UserEvent, label: string): Promise<void> {
  const target = screen.getByRole("button", { name: label });
  for (let guard = 0; guard < 200 && document.activeElement !== target; guard += 1) await user.tab();
  expect(target, label).toHaveFocus();
  await user.keyboard("{Enter}");
}

type Press = (label: string) => Promise<void>;

/** Plays the round on screen by following the engine's own solution, one visible button at a time. */
async function playOnScreen(id: string, press: Press, options: { practice?: boolean; timerEnabled?: boolean } = {}): Promise<GameSession> {
  let session = start(id, "en", options);
  for (let guard = 0; guard < 80 && !session.done; guard += 1) {
    const step = solutionIds(session)[0];
    const label = viewSession(session).choices.find((choice) => choice.id === step)?.label;
    if (!step || !label) throw new Error(`${id} has no next step on screen`);
    await press(label);
    session = choose(session, step);
  }
  return session;
}

function noTypingOrDragOnScreen(container: HTMLElement): void {
  expect(container.querySelectorAll("input[type='text'], input:not([type]), textarea, [contenteditable='true']")).toHaveLength(0);
  expect(container.querySelectorAll("[draggable='true']")).toHaveLength(0);
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Day 13: games hub", () => {
  it("lists the ten scope-lock names, each with a one-line description, a timing note, and an input note", () => {
    render(<Harness rounds={[]} />);
    const cards = screen.getAllByRole("listitem").filter((item) => within(item).queryByRole("button", { name: /^Play / }));
    expect(cards).toHaveLength(10);
    for (const game of CATALOG) {
      const card = cards.find((item) => within(item).queryByRole("heading", { name: game.name }));
      expect(card, game.name).toBeDefined();
      if (!card) continue;
      expect(game.summary.en).not.toMatch(/\n/);
      expect(game.summary.en.length).toBeLessThanOrEqual(120);
      expect(within(card).getByText(game.summary.en)).toBeInTheDocument();
      expect(within(card).getByText(game.timingNote.en)).toBeInTheDocument();
      expect(within(card).getByText(game.inputNote.en)).toBeInTheDocument();
      expect(game.timingNote.en).toMatch(/^Untimed/);
      expect(game.inputNote.en).toMatch(/keyboard/);
    }
  });

  it("shows the practice banner and never a score, and saves nothing", async () => {
    const rounds: GamesRound[] = [];
    const user = userEvent.setup();
    render(<Harness rounds={rounds} />);
    await keyboardPress(user, "Practice Number Compare");
    expect(screen.getByRole("status").textContent).toBe("Practice. No score is shown, and this round is not saved.");
    const finished = await playOnScreen("number-compare", (label) => keyboardPress(user, label), { practice: true });
    expect(finished.done).toBe(true);
    expect(viewSession(finished).scoreVisible).toBe(false);
    expect(screen.getByText("Practice finished. No score is kept and no record changes.")).toBeInTheDocument();
    expect(screen.queryByText(/Points inside this exercise/)).not.toBeInTheDocument();
    expect(rounds).toEqual([]);
  });

  it("reaches every Play and Practice button with Tab alone", async () => {
    const user = userEvent.setup();
    render(<Harness rounds={[]} />);
    const wanted = CATALOG.flatMap((game) => [`Play ${game.name}`, `Practice ${game.name}`]);
    const reached = new Set<string>();
    for (let guard = 0; guard < 120 && reached.size < wanted.length; guard += 1) {
      await user.tab();
      const text = (document.activeElement?.textContent ?? "").trim();
      if (wanted.includes(text)) reached.add(text);
    }
    expect([...reached]).toEqual(wanted);
  });

  it("has no health claim and no Lumosity name in English or French copy", () => {
    expect(healthClaimHits()).toEqual([]);
    expect(JSON.stringify(GAME_COPY).toLowerCase()).not.toContain("lumosity");
    expect(JSON.stringify(CATALOG).toLowerCase()).not.toContain("lumosity");
  });

  it("would catch a planted claim, so an empty scan means something", () => {
    const planted = {
      a: { en: "Improve your memory in ten minutes a day.", fr: "Jeu." },
      b: { en: "Game.", fr: "Un entraînement cérébral prouvé." },
      c: { en: "Like Lumosity.", fr: "Jeu." },
      d: { en: "The App does not provide medical advice. Not a prescription.", fr: "L'application ne donne pas d'avis médical." },
    };
    const hits = healthClaimHits(planted);
    expect(hits.map((hit) => `${hit.key}:${hit.language}:${hit.rule}`)).toEqual(["a:en:improves", "b:fr:brain-training", "b:fr:clinical", "c:en:lumosity"]);
  });

  it("turns reduced motion on by default and lets the person change it", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness rounds={[]} />);
    const root = container.querySelector("[data-games-root]");
    expect(root).toHaveAttribute("data-reduce-motion", "true");
    expect(MOTION_CSS).toMatch(/prefers-reduced-motion: reduce/);
    expect(MOTION_CSS).toMatch(/animation: none !important/);
    expect(MOTION_CSS).toMatch(/transition: none !important/);
    const toggle = screen.getByRole("checkbox", { name: "Reduce motion" });
    expect(toggle).toBeChecked();
    await user.click(toggle);
    expect(root).toHaveAttribute("data-reduce-motion", "false");
    await user.click(screen.getByRole("button", { name: "Play Grid Recall" }));
    expect(container.querySelector("[data-games-root]")).toHaveAttribute("data-reduce-motion", "false");
  });

  it("uses no inline animation or transition anywhere on the hub", () => {
    const { container } = render(<Harness rounds={[]} />);
    for (const element of container.querySelectorAll<HTMLElement>("[style]")) {
      expect(element.style.animation, element.outerHTML.slice(0, 80)).toBe("");
      expect(element.style.transition, element.outerHTML.slice(0, 80)).toBe("");
    }
  });

  it("puts the no-medical-claims notice on the hub in both languages", async () => {
    const user = userEvent.setup();
    render(<Harness rounds={[]} />);
    expect(screen.getByRole("note").textContent).toBe(GAMES_BOUNDARY.en);
    expect(GAMES_BOUNDARY.en).toMatch(/does not provide medical advice/);
    await user.click(screen.getByRole("button", { name: "Français" }));
    expect(screen.getByRole("note").textContent).toBe(GAMES_BOUNDARY.fr);
    expect(GAMES_BOUNDARY.fr).toMatch(/ne donne pas d'avis médical/);
  });
});

describe("Day 14: Grid Recall, Pair Sequence, Route Planner, Pattern Rules, Word Roots Builder", () => {
  for (const id of DAY_14) {
    it(`${name(id)} plays end to end from the keyboard, untimed, with no typing`, async () => {
      const rounds: GamesRound[] = [];
      const user = userEvent.setup();
      const { container } = render(<Harness rounds={rounds} initial={{ timerEnabled: true }} />);
      await keyboardPress(user, `Play ${name(id)}`);
      expect(screen.getByRole("heading", { level: 1, name: name(id) })).toHaveFocus();
      expect(container.querySelector("[data-optional-clock]")).toBeNull();
      noTypingOrDragOnScreen(container);
      const finished = await playOnScreen(id, (label) => keyboardPress(user, label));
      expect(finished.done).toBe(true);
      expect(screen.getAllByText("Round finished. You can stop here. Nothing else in the App changes.").length).toBeGreaterThan(0);
      expect(rounds).toHaveLength(1);
      expect(rounds[0]?.gameId).toBe(id);
      expect(rounds[0]?.timerEnabled).toBe(false);
      expect(rounds[0]?.points).toBeGreaterThan(0);
    });

    it(`${name(id)} shows the notice and the device-only line, and makes no health claim`, async () => {
      const user = userEvent.setup();
      const { container } = render(<Harness rounds={[]} />);
      await user.click(screen.getByRole("button", { name: `Play ${name(id)}` }));
      expect(screen.getByRole("note").textContent).toBe(GAMES_BOUNDARY.en);
      expect(screen.getByText(DEVICE_ONLY)).toBeInTheDocument();
      expect(container.querySelector("main")).toHaveAttribute("data-game", id);
      const results = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
      expect(results.violations.map((violation) => violation.id)).toEqual([]);
    });
  }

  it("Pair Sequence gives the same score however long each answer takes", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const rounds: GamesRound[] = [];
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness rounds={rounds} />);
    await user.click(screen.getByRole("button", { name: "Play Pair Sequence" }));
    const finished = await playOnScreen("pair-sequence", async (label) => {
      await act(async () => {
        vi.advanceTimersByTime(10 * 60 * 1000);
      });
      await keyboardPress(user, label);
    });
    expect(viewSession(finished).points).toBe(4);
    expect(rounds[0]?.points).toBe(4);
    expect(rounds[0]?.correctCount).toBe(rounds[0]?.trialCount);
  });

  it("Route Planner moves by tap, undoes a step, and stops at the move budget without ending the round", async () => {
    const user = userEvent.setup();
    render(<Harness rounds={[]} />);
    await user.click(screen.getByRole("button", { name: "Play Route Planner" }));
    expect(screen.getAllByText(/Moves: 0 of 6/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Right" }));
    expect(screen.getAllByText(/Moves: 1 of 6/).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getAllByText(/Moves: 0 of 6/).length).toBeGreaterThan(0);
    for (const direction of ["Right", "Left", "Right", "Left", "Right", "Left"]) {
      await user.click(screen.getByRole("button", { name: direction }));
    }
    expect(screen.getAllByText(/Moves: 6 of 6/).length).toBeGreaterThan(0);
    for (const direction of ["Left", "Right", "Up", "Down"]) {
      expect(screen.queryByRole("button", { name: direction })).not.toBeInTheDocument();
    }
    expect(screen.queryByText(/Round finished/)).not.toBeInTheDocument();
    for (let step = 0; step < 6; step += 1) await user.click(screen.getByRole("button", { name: "Undo" }));
    for (const direction of ["Right", "Right", "Down", "Down"]) {
      await user.click(screen.getByRole("button", { name: direction }));
    }
    expect(screen.getAllByText(/Round finished/).length).toBeGreaterThan(0);
  });

  it("Route Planner never offers the blocked centre cell", () => {
    let session = start("route-planner");
    session = choose(session, "right");
    expect(viewSession(session).choices.map((choice) => choice.id)).not.toContain("down");
  });
});

describe("Day 15: Number Compare, Focus Flankers, Switch Rules, Shape Assembly, Order Keeper", () => {
  for (const id of DAY_15) {
    it(`${name(id)} plays end to end by single taps`, async () => {
      const rounds: GamesRound[] = [];
      const { container } = render(<Harness rounds={rounds} />);
      fireEvent.click(screen.getByRole("button", { name: `Play ${name(id)}` }));
      const finished = await playOnScreen(id, async (label) => {
        fireEvent.click(screen.getByRole("button", { name: label }));
      });
      expect(finished.done).toBe(true);
      expect(rounds).toHaveLength(1);
      expect(rounds[0]?.gameId).toBe(id);
      expect(screen.getByText(DEVICE_ONLY)).toBeInTheDocument();
      expect(container.querySelector("[data-optional-clock]")).toBeNull();
    });

    it(`${name(id)} plays end to end from the keyboard, with no drag and no typing`, async () => {
      const user = userEvent.setup();
      const { container } = render(<Harness rounds={[]} />);
      await keyboardPress(user, `Play ${name(id)}`);
      noTypingOrDragOnScreen(container);
      const finished = await playOnScreen(id, (label) => keyboardPress(user, label));
      expect(finished.done).toBe(true);
      noTypingOrDragOnScreen(container);
      const results = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
      expect(results.violations.map((violation) => violation.id)).toEqual([]);
    });
  }

  it("Focus Flankers is untimed by default, and timed mode is off and labelled optional", () => {
    expect(defaultSettings("player-12345678").timerEnabled).toBe(false);
    const { container } = render(<Harness rounds={[]} />);
    const option = screen.getByRole("checkbox", { name: "Timed mode for Focus Flankers (optional)" });
    expect(option).not.toBeChecked();
    expect(option).toHaveAccessibleDescription(/Off unless you turn it on\. .* no time limit, no penalty/);
    fireEvent.click(screen.getByRole("button", { name: "Play Focus Flankers" }));
    expect(container.querySelector("[data-optional-clock]")).toBeNull();
    expect(viewSession(start(OPTIONAL_TIMER_GAME_ID)).timerVisible).toBe(false);
  });

  it("the optional clock counts up, stops on Pause, sets no limit, and does not change the score", async () => {
    vi.useFakeTimers();
    const rounds: GamesRound[] = [];
    const { container } = render(<Harness rounds={rounds} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Timed mode for Focus Flankers (optional)" }));
    fireEvent.click(screen.getByRole("button", { name: "Play Focus Flankers" }));
    const clock = () => container.querySelector("[data-optional-clock]")?.textContent ?? "";
    expect(clock()).toBe("Optional clock: 0 seconds so far. No time limit. Pause stops the clock.");
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(clock()).toMatch(/^Optional clock: 3 seconds/);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });
    expect(clock()).toMatch(/^Optional clock: 3 seconds/);
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    await act(async () => {
      vi.advanceTimersByTime(30 * 60 * 1000);
    });
    expect(screen.queryByText(/Round finished/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Centre points left" })).toBeEnabled();
    const finished = await playOnScreen(
      "focus-flankers",
      async (label) => {
        fireEvent.click(screen.getByRole("button", { name: label }));
      },
      { timerEnabled: true },
    );
    expect(viewSession(finished).points).toBe(4);
    expect(rounds[0]?.points).toBe(4);
    expect(rounds[0]?.timerEnabled).toBe(true);
    expect(Object.keys(rounds[0] ?? {})).not.toContain("elapsedSeconds");
  });

  it("only Focus Flankers has a clock, even when the option is on", () => {
    for (const game of CATALOG) {
      const view = viewSession(start(game.id, "en", { timerEnabled: true }));
      expect(view.timerVisible, game.id).toBe(game.id === OPTIONAL_TIMER_GAME_ID);
    }
  });

  it("Shape Assembly places by tap and rotates by tap, and a wrong turn does not place the piece", () => {
    let session = start("shape-assembly");
    const ids = viewSession(session).choices.map((choice) => choice.id);
    expect(ids).toEqual(["piece-triangle", "piece-square", "piece-circle", "rotate", "slot-0", "slot-1", "slot-2"]);
    session = choose(session, "piece-triangle");
    const unturned = choose(session, "slot-0");
    expect(viewSession(unturned).prompt).toMatch(/slot 1 empty/);
    session = choose(session, "rotate");
    expect(viewSession(session).prompt).toMatch(/Triangle turned 0 degrees/);
    session = choose(session, "slot-0");
    expect(viewSession(session).prompt).toMatch(/Slots: triangle, slot 2 empty, slot 3 empty/);
    expect(viewSession(session).detail).toMatch(/Rotate is a button, not a drag/);
  });

  it("draws the daily set from all ten games across three dates", () => {
    const three = ["2026-11-13", "2026-11-14", "2026-11-15"].map((date) => buildDailySet(date).map((game) => game.id));
    for (const set of three) expect(new Set(set).size).toBe(3);
    const seen = new Set(three.flat());
    expect(seen.size).toBe(9);
    for (const id of seen) expect(CATALOG.map((game) => game.id)).toContain(id);
    const fourth = buildDailySet("2026-11-16").map((game) => game.id);
    expect(new Set([...seen, ...fourth]).size).toBe(10);
  });

  it("gives every game the same share of days over any ten dates in a row", () => {
    const counts = new Map<string, number>();
    for (let offset = 0; offset < 10; offset += 1) {
      const date = new Date(Date.UTC(2026, 10, 13 + offset)).toISOString().slice(0, 10);
      for (const game of buildDailySet(date)) counts.set(game.id, (counts.get(game.id) ?? 0) + 1);
    }
    expect([...counts.values()]).toEqual(Array.from({ length: 10 }, () => 3));
    expect(() => buildDailySet("not-a-date")).toThrow(/YYYY-MM-DD/);
  });

  it("makes no network call while all ten games are played", async () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error("network disabled")));
    vi.stubGlobal("fetch", fetchSpy);
    try {
      for (const game of CATALOG) {
        const view = render(<Harness rounds={[]} />);
        fireEvent.click(screen.getByRole("button", { name: `Play ${game.name}` }));
        const finished = await playOnScreen(game.id, async (label) => {
          fireEvent.click(screen.getByRole("button", { name: label }));
        });
        expect(finished.done, game.id).toBe(true);
        view.unmount();
      }
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("French game screens", () => {
  it("shows the notice, the device-only line, and the optional clock in French", () => {
    const { container } = render(<Harness rounds={[]} initial={{ language: "fr", timerEnabled: true }} />);
    expect(screen.getByRole("checkbox", { name: "Mode minuté pour Focus Flankers (facultatif)" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Réduire le mouvement" })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Jouer Focus Flankers" }));
    expect(container.querySelector("main")).toHaveAttribute("lang", "fr");
    expect(screen.getByRole("note").textContent).toBe(GAMES_BOUNDARY.fr);
    expect(screen.getByText("Les pointages restent sur cet appareil. Rien n'est téléversé.")).toBeInTheDocument();
    expect(container.querySelector("[data-optional-clock]")?.textContent).toBe(
      "Horloge facultative : 0 secondes jusqu'ici. Aucune limite de temps. Pause arrête l'horloge.",
    );
  });
});
