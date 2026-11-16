import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BATCH_TWO_CATALOG,
  GAME_LIBRARY,
  GamesApp,
  choose,
  createSession,
  defaultSettings,
  parseRound,
  solutionIds,
  viewSession,
  type GameMeta,
  type GameSession,
  type GamesRound,
  type GamesSettings,
} from "../src/index.js";
import { pointerOut, pointerOver } from "./pointer.js";

vi.setConfig({ testTimeout: 30_000 });

const SEED = 11;
const HOLD_MS = 1000;
const DONE = "Round finished. You can stop here. Nothing else in the App changes.";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function Harness(props: { initial?: Partial<GamesSettings>; onRound?: (round: GamesRound) => void }) {
  const [settings, setSettings] = useState<GamesSettings>({ ...defaultSettings("player-12345678"), ...props.initial });
  const [rounds, setRounds] = useState<GamesRound[]>([]);
  return (
    <GamesApp
      settings={settings}
      rounds={rounds}
      seed={SEED}
      now={new Date("2026-11-13T15:00:00.000Z")}
      onSettings={setSettings}
      onRound={(item) => {
        props.onRound?.(item);
        setRounds((current) => [...current, item]);
      }}
      onResetStreak={() => setRounds([])}
    />
  );
}

/** The same round the screen starts, so the test knows which answer comes next. */
function mirror(game: GameMeta, language: "en" | "fr" = "en"): GameSession {
  return createSession(game.id, { seed: SEED, pace: "relaxed", language, timerEnabled: false, practice: false });
}

function answers(game: GameMeta): HTMLElement {
  return screen.getByRole("group", { name: game.name });
}

/** Plays one full round. `press` activates the answer button with the given label. */
async function playRound(game: GameMeta, press: (label: string) => Promise<void> | void, language: "en" | "fr" = "en"): Promise<GameSession> {
  let session = mirror(game, language);
  for (let guard = 0; guard < 80 && !session.done; guard += 1) {
    const view = viewSession(session);
    const step = solutionIds(session)[0] ?? "";
    const label = view.choices.find((choice) => choice.id === step)?.label ?? "";
    expect(label, `${game.id} step ${guard}`).not.toBe("");
    expect(screen.getAllByText(view.prompt.replace(/\s+/g, " ")).length, `${game.id} prompt`).toBeGreaterThan(0);
    expect(within(answers(game)).getAllByRole("button").map((button) => button.textContent)).toEqual(view.choices.map((choice) => choice.label));
    await press(label);
    session = choose(session, step);
  }
  expect(session.done, game.id).toBe(true);
  return session;
}

function expectSaved(game: GameMeta, session: GameSession, rounds: GamesRound[]): void {
  expect(screen.getAllByText(DONE).length).toBeGreaterThan(0);
  expect(rounds).toHaveLength(1);
  const round = parseRound(rounds[0]);
  expect(round).toMatchObject({
    gameId: game.id,
    completed: true,
    timerEnabled: false,
    points: session.correct,
    correctCount: session.correct,
    trialCount: session.answered,
  });
  expect(round.correctCount).toBe(round.trialCount);
  expect(round.trialCount).toBeGreaterThan(0);
  expect(screen.getByText(new RegExp(`Points inside this exercise: ${session.correct}\\.`))).toBeInTheDocument();
}

async function tabTo(user: UserEvent, target: HTMLElement): Promise<void> {
  for (let presses = 0; presses < 200 && document.activeElement !== target; presses += 1) await user.tab();
  expect(target).toHaveFocus();
}

/** Switch access: press Next until the control is highlighted, then press Choose. */
function scanChoose(label: string): void {
  const bar = document.querySelector<HTMLElement>("[data-switch-bar]");
  if (!bar) throw new Error("No switch bar");
  for (let presses = 0; presses < 200; presses += 1) {
    fireEvent.click(within(bar).getByRole("button", { name: "Next" }));
    const current = document.querySelector("[data-switch-current]");
    if (current?.textContent === label) {
      fireEvent.click(within(bar).getByRole("button", { name: "Choose" }));
      return;
    }
  }
  throw new Error(`Switch scan did not reach ${label}`);
}

describe("second batch on the hub", () => {
  it("lists every game in the library with the same card parts, and passes the automated accessibility check", async () => {
    const { container } = render(<Harness />);
    for (const game of GAME_LIBRARY) {
      const card = screen.getByRole("heading", { level: 2, name: game.name }).closest("li");
      expect(card, game.id).not.toBeNull();
      const inside = within(card as HTMLElement);
      expect(inside.getByText(game.summary.en)).toBeInTheDocument();
      expect(inside.getByText(game.timingNote.en)).toBeInTheDocument();
      expect(inside.getByText(game.inputNote.en)).toBeInTheDocument();
      expect(inside.getByRole("button", { name: `Play ${game.name}` })).toBeInTheDocument();
      expect(inside.getByRole("button", { name: `Practice ${game.name}` })).toBeInTheDocument();
    }
    expect(container.querySelectorAll("input[type='text'], textarea, [contenteditable='true'], [draggable='true']")).toHaveLength(0);
    for (const button of container.querySelectorAll<HTMLElement>("li button")) expect(button.style.minHeight).toBe("48px");
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    expect(results.violations).toEqual([]);
  });

  it("finds a new game by search in English or French and shows its French card", async () => {
    render(<Harness initial={{ language: "fr" }} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Chercher un jeu"), "cruches");
    expect(screen.getAllByRole("button", { name: /^Jouer / }).map((button) => button.textContent)).toEqual(["Jouer Jug Measure"]);
    expect(screen.getByText("Casse-tête par étapes")).toBeInTheDocument();
    expect(screen.getByText(/la sélection par maintien quand elle est activée/)).toBeInTheDocument();
  });
});

describe.each(BATCH_TWO_CATALOG.map((game) => [game.name, game] as const))("%s on the screen", (_name, game) => {
  it("plays a full round by single tap", async () => {
    const rounds: GamesRound[] = [];
    const { container } = render(<Harness onRound={(round) => rounds.push(round)} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: `Play ${game.name}` }));
    expect(screen.getByRole("heading", { level: 1, name: game.name })).toHaveFocus();
    expect(container.querySelector("[aria-live='polite']")?.textContent).toBe(viewSession(mirror(game)).prompt);
    const session = await playRound(game, (label) => user.click(within(answers(game)).getByRole("button", { name: label })));
    expectSaved(game, session, rounds);
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    expect(results.violations).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Back to games" }));
    expect(screen.getByRole("button", { name: `Play ${game.name}` })).toHaveFocus();
  });

  it("plays a full round from the keyboard alone", async () => {
    const rounds: GamesRound[] = [];
    render(<Harness onRound={(round) => rounds.push(round)} />);
    const user = userEvent.setup();
    await tabTo(user, screen.getByRole("button", { name: `Play ${game.name}` }));
    await user.keyboard("{Enter}");
    let useSpace = false;
    const session = await playRound(game, async (label) => {
      await tabTo(user, within(answers(game)).getByRole("button", { name: label }));
      await user.keyboard(useSpace ? " " : "{Enter}");
      useSpace = !useSpace;
    });
    expectSaved(game, session, rounds);
    await tabTo(user, screen.getByRole("button", { name: "Back to games" }));
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: `Play ${game.name}` })).toHaveFocus();
  });

  it("plays a full round with the switch: Next, then Choose", async () => {
    const rounds: GamesRound[] = [];
    render(<Harness onRound={(round) => rounds.push(round)} />);
    scanChoose(`Play ${game.name}`);
    expect(screen.getByRole("heading", { level: 1, name: game.name })).toBeInTheDocument();
    const session = await playRound(game, (label) => scanChoose(label));
    expectSaved(game, session, rounds);
    scanChoose("Back to games");
    expect(screen.getByRole("button", { name: `Play ${game.name}` })).toBeInTheDocument();
  });

  it("plays a full round by dwell select alone, in French", async () => {
    vi.useFakeTimers();
    const rounds: GamesRound[] = [];
    render(<Harness initial={{ dwellEnabled: true, dwellMs: HOLD_MS, language: "fr" }} onRound={(round) => rounds.push(round)} />);
    const dwell = (control: HTMLElement): void => {
      pointerOver(control);
      expect(control).toHaveAttribute("data-dwell-target", "true");
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(HOLD_MS - 100);
      });
      expect(control).toHaveAttribute("data-dwell-target", "true");
      act(() => {
        vi.advanceTimersByTime(100);
      });
      if (control.isConnected) pointerOut(control);
    };
    dwell(screen.getByRole("button", { name: `Jouer ${game.name}` }));
    expect(screen.getByRole("heading", { level: 1, name: game.name })).toBeInTheDocument();
    const session = await playRound(game, (label) => dwell(within(answers(game)).getByRole("button", { name: label })), "fr");
    expect(screen.getAllByText("Manche terminée. Vous pouvez vous arrêter ici. Rien d'autre dans l'application ne change.").length).toBeGreaterThan(0);
    expect(rounds).toHaveLength(1);
    expect(rounds[0]).toMatchObject({ gameId: game.id, correctCount: session.answered, trialCount: session.answered });
    act(() => {
      vi.advanceTimersByTime(10 * HOLD_MS);
    });
    expect(rounds).toHaveLength(1);
    dwell(screen.getByRole("button", { name: "Retour aux jeux" }));
    expect(screen.getByRole("button", { name: `Jouer ${game.name}` })).toHaveFocus();
  });
});
