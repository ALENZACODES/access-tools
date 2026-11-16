import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { useRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SwitchBar } from "../../place/src/react/SwitchBar.js";
import { dwellActivate, dwellKind, dwellName, dwellTarget, nextListOption } from "../src/dwell.js";
import {
  BATCH_TWO_CATALOG,
  DwellLayer,
  GamesApp,
  choose,
  createSession,
  defaultSettings,
  healthClaimHits,
  solutionIds,
  viewSession,
  type GamesRound,
  type GamesSettings,
} from "../src/index.js";
import { pointerMove, pointerOut, pointerOver } from "./pointer.js";

/**
 * Dwell select on the controls it used to skip: lists, the search box, and
 * the control the switch bar has highlighted. Pointer events here are
 * stand-ins; e2e/games-dwell.spec.ts repeats the pointer cases in a browser.
 */

vi.setConfig({ testTimeout: 30_000 });

const COLORS = { background: "#fff", color: "#1a1a1a", border: "#1a1a1a" };
const HOLD_MS = 1000;

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** Lets the switch bar's highlight reach the dwell layer, which hears of it after the current task. */
async function settle(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

function Bench(props: { enabled?: boolean; onPick?: (name: string) => void; onSize?: (value: string) => void }) {
  const rootRef = useRef<HTMLElement>(null);
  const [size, setSize] = useState("small");
  const [word, setWord] = useState("");
  return (
    <main ref={rootRef} data-switch-root>
      <SwitchBar rootRef={rootRef} nextLabel="Next" chooseLabel="Choose" help="Next, then Choose." />
      <button type="button" onClick={() => props.onPick?.("one")}>
        One
      </button>
      <button type="button" onClick={() => props.onPick?.("two")}>
        Two
      </button>
      <label>
        Size
        <select
          value={size}
          onChange={(event) => {
            setSize(event.target.value);
            props.onSize?.(event.target.value);
          }}
        >
          <option value="small">Small</option>
          <option value="medium" disabled>
            Medium
          </option>
          <option value="large">Large</option>
        </select>
      </label>
      <label htmlFor="bench-word">Word</label>
      <input id="bench-word" value={word} onChange={(event) => setWord(event.target.value)} />
      <label htmlFor="bench-count">Count</label>
      <input id="bench-count" type="number" defaultValue={1} />
      <DwellLayer rootRef={rootRef} config={{ enabled: props.enabled ?? true, holdMs: HOLD_MS, reduceMotion: false }} language="en" colors={COLORS} />
    </main>
  );
}

function bar(): HTMLElement {
  const found = document.querySelector<HTMLElement>("[data-switch-bar]");
  if (!found) throw new Error("No switch bar");
  return found;
}

async function pressNext(): Promise<void> {
  fireEvent.click(within(bar()).getByRole("button", { name: "Next" }));
  await settle();
}

function highlighted(): string {
  return (document.querySelector("[data-switch-current]")?.textContent ?? "").trim();
}

describe("dwell rules for lists and text boxes", () => {
  it("takes lists and text boxes as targets, and leaves other fields alone", () => {
    render(<Bench enabled={false} />);
    const root = screen.getByRole("main");
    const list = screen.getByRole("combobox", { name: "Size" });
    const word = screen.getByRole("textbox", { name: "Word" });
    expect(dwellTarget(list, root)).toBe(list);
    expect(dwellTarget(word, root)).toBe(word);
    expect(dwellTarget(screen.getByRole("spinbutton", { name: "Count" }), root)).toBeNull();
    expect(dwellKind(list)).toBe("list");
    expect(dwellKind(word)).toBe("text");
    expect(dwellKind(screen.getByRole("button", { name: "One" }))).toBe("press");
    expect(dwellName(list)).toBe("Size");
    expect(dwellName(word)).toBe("Word");
  });

  it("moves a list to its next enabled choice and wraps at the end", () => {
    const onSize = vi.fn();
    render(<Bench enabled={false} onSize={onSize} />);
    const list = screen.getByRole<HTMLSelectElement>("combobox", { name: "Size" });
    expect(nextListOption(list)?.value).toBe("large");
    act(() => dwellActivate(list));
    expect(list.value).toBe("large");
    expect(onSize).toHaveBeenLastCalledWith("large");
    expect(nextListOption(list)?.value).toBe("small");
    act(() => dwellActivate(list));
    expect(list.value).toBe("small");
    expect(onSize).toHaveBeenCalledTimes(2);
  });

  it("does nothing to a list with no other choice", () => {
    const list = document.createElement("select");
    expect(nextListOption(list)).toBeNull();
    list.append(new Option("Only", "only"));
    expect(nextListOption(list)).toBeNull();
    dwellActivate(list);
    expect(list.value).toBe("only");
  });
});

describe("dwell layer on lists, text boxes, and the switch bar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("changes a list after the pointer rests on it, and says what it will change to", () => {
    const onSize = vi.fn();
    render(<Bench onSize={onSize} />);
    const list = screen.getByRole<HTMLSelectElement>("combobox", { name: "Size" });
    pointerOver(list);
    expect(screen.getByText("Holding the list: Size. It will change to: Large")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Hold progress for Size" })).toBeInTheDocument();
    advance(HOLD_MS - 100);
    expect(onSize).not.toHaveBeenCalled();
    advance(100);
    expect(onSize).toHaveBeenCalledTimes(1);
    expect(list.value).toBe("large");
    advance(5 * HOLD_MS);
    expect(onSize).toHaveBeenCalledTimes(1);
    pointerOut(list);
    pointerOver(list);
    expect(screen.getByText("Holding the list: Size. It will change to: Small")).toBeInTheDocument();
    advance(HOLD_MS);
    expect(list.value).toBe("small");
  });

  it("puts the cursor in a text box after the pointer rests on it, and types nothing", () => {
    render(<Bench />);
    const word = screen.getByRole<HTMLInputElement>("textbox", { name: "Word" });
    expect(word).not.toHaveFocus();
    pointerOver(word);
    expect(screen.getByText("Holding the text box: Word. The cursor will move into it.")).toBeInTheDocument();
    advance(HOLD_MS);
    expect(word).toHaveFocus();
    expect(word.value).toBe("");
  });

  it("cancels a list hold when the pointer leaves", () => {
    const onSize = vi.fn();
    render(<Bench onSize={onSize} />);
    const list = screen.getByRole("combobox", { name: "Size" });
    pointerOver(list);
    advance(HOLD_MS - 100);
    pointerOut(list);
    advance(5 * HOLD_MS);
    expect(onSize).not.toHaveBeenCalled();
  });

  it("chooses the control the switch bar's Next has highlighted, with no press of Choose", async () => {
    const onPick = vi.fn();
    render(<Bench onPick={onPick} />);
    await pressNext();
    expect(highlighted()).toBe("One");
    expect(screen.getByText("Holding: One")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "One" })).toHaveAttribute("data-dwell-target", "true");
    advance(HOLD_MS - 100);
    expect(onPick).not.toHaveBeenCalled();
    advance(100);
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith("one");
    advance(5 * HOLD_MS);
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it("starts over when Next moves on before the hold ends", async () => {
    const onPick = vi.fn();
    render(<Bench onPick={onPick} />);
    await pressNext();
    advance(HOLD_MS - 100);
    await pressNext();
    expect(highlighted()).toBe("Two");
    expect(screen.getByRole("button", { name: "One" })).not.toHaveAttribute("data-dwell-target");
    advance(HOLD_MS - 100);
    expect(onPick).not.toHaveBeenCalled();
    advance(100);
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith("two");
  });

  it("counts Choose once when it is pressed during the hold, and Escape cancels the hold", async () => {
    const onPick = vi.fn();
    render(<Bench onPick={onPick} />);
    await pressNext();
    advance(HOLD_MS / 2);
    fireEvent.click(within(bar()).getByRole("button", { name: "Choose" }));
    expect(onPick).toHaveBeenCalledTimes(1);
    advance(5 * HOLD_MS);
    expect(onPick).toHaveBeenCalledTimes(1);
    await pressNext();
    expect(highlighted()).toBe("Two");
    fireEvent.keyDown(screen.getByRole("main"), { key: "Escape" });
    advance(5 * HOLD_MS);
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(screen.getByText("No button is being held.")).toBeInTheDocument();
  });

  it("lets one switch change a list and reach a text box", async () => {
    const onSize = vi.fn();
    render(<Bench onSize={onSize} />);
    await pressNext();
    await pressNext();
    await pressNext();
    expect(document.querySelector("[data-switch-current]")).toBe(screen.getByRole("combobox", { name: "Size" }));
    expect(screen.getByText("Holding the list: Size. It will change to: Large")).toBeInTheDocument();
    advance(HOLD_MS);
    expect(onSize).toHaveBeenCalledWith("large");
    await pressNext();
    advance(HOLD_MS);
    expect(screen.getByRole("textbox", { name: "Word" })).toHaveFocus();
  });

  it("leaves the switch bar as it was while dwell select is off", async () => {
    const onPick = vi.fn();
    render(<Bench onPick={onPick} enabled={false} />);
    await pressNext();
    advance(10 * HOLD_MS);
    expect(onPick).not.toHaveBeenCalled();
    fireEvent.click(within(bar()).getByRole("button", { name: "Choose" }));
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it("does not start a hold from the bar's own buttons", () => {
    const onPick = vi.fn();
    render(<Bench onPick={onPick} />);
    pointerOver(within(bar()).getByRole("button", { name: "Next" }));
    advance(5 * HOLD_MS);
    expect(document.querySelector("[data-switch-current]")).toBeNull();
    expect(onPick).not.toHaveBeenCalled();
  });
});

function Hub(props: { initial?: Partial<GamesSettings>; rounds?: GamesRound[]; onSaved?: (settings: GamesSettings) => void }) {
  const [settings, setSettings] = useState<GamesSettings>({ ...defaultSettings("player-12345678"), ...props.initial });
  const [rounds, setRounds] = useState<GamesRound[]>([]);
  return (
    <GamesApp
      settings={settings}
      rounds={rounds}
      seed={11}
      now={new Date("2026-11-13T15:00:00.000Z")}
      onSettings={(next) => {
        props.onSaved?.(next);
        setSettings(next);
      }}
      onRound={(round) => {
        props.rounds?.push(round);
        setRounds((current) => [...current, round]);
      }}
      onResetStreak={() => setRounds([])}
    />
  );
}

describe("dwell select on the games hub", () => {
  it("changes the text size list by dwell alone, through every choice and back", () => {
    vi.useFakeTimers();
    const saved: GamesSettings[] = [];
    render(<Hub initial={{ dwellEnabled: true, dwellMs: HOLD_MS }} onSaved={(settings) => saved.push(settings)} />);
    const list = screen.getByRole<HTMLSelectElement>("combobox", { name: "Text size" });
    expect(list.value).toBe("default");
    for (const expected of ["large", "extra_large", "default"]) {
      pointerOver(list);
      advance(HOLD_MS);
      expect(saved.at(-1)?.textScale).toBe(expected);
      expect(list.value).toBe(expected);
      pointerOut(list);
    }
  });

  it("puts the cursor in the search box by dwell, and offers a button that clears the search", () => {
    vi.useFakeTimers();
    render(<Hub initial={{ dwellEnabled: true, dwellMs: HOLD_MS }} />);
    const box = screen.getByRole<HTMLInputElement>("textbox", { name: "Search games" });
    expect(screen.queryByRole("button", { name: "Clear the search" })).toBeNull();
    pointerOver(box);
    expect(screen.getByText("Holding the text box: Search games. The cursor will move into it.")).toBeInTheDocument();
    advance(HOLD_MS);
    expect(box).toHaveFocus();
    fireEvent.change(box, { target: { value: "jug" } });
    expect(screen.getAllByRole("button", { name: /^Play / })).toHaveLength(1);
    pointerOut(box);
    pointerOver(screen.getByRole("button", { name: "Clear the search" }));
    advance(HOLD_MS);
    expect(box.value).toBe("");
    expect(box).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Clear the search" })).toBeNull();
    expect(screen.getAllByRole("button", { name: /^Play / }).length).toBeGreaterThan(1);
  });

  it("does not hold what appears under a pointer that has not moved, and holds it once the pointer moves", () => {
    vi.useFakeTimers();
    render(<Hub initial={{ dwellEnabled: true, dwellMs: HOLD_MS }} />);
    pointerOver(screen.getByRole("button", { name: "Play Mirror Moves" }));
    advance(HOLD_MS);
    expect(screen.getByRole("heading", { level: 1, name: "Mirror Moves" })).toBeInTheDocument();
    // The game screen replaced the hub. The browser reports the resting pointer as arriving on an answer.
    const answer = screen.getByRole("button", { name: "Go up" });
    const prompt = document.querySelector("[aria-live='polite']")?.textContent;
    pointerOver(answer, { still: true });
    expect(screen.getByText("No button is being held.")).toBeInTheDocument();
    advance(5 * HOLD_MS);
    expect(document.querySelector("[aria-live='polite']")?.textContent).toBe(prompt);
    expect(screen.getByRole("heading", { level: 1, name: "Mirror Moves" })).toBeInTheDocument();
    // A real movement inside the same button starts the hold.
    pointerMove(answer);
    expect(screen.getByText("Holding: Go up")).toBeInTheDocument();
    advance(HOLD_MS);
    expect(document.querySelector("[aria-live='polite']")?.textContent).not.toBe(prompt);
  });

  it("does not reopen a game when Back is chosen by dwell and the pointer stays where it was", () => {
    vi.useFakeTimers();
    render(<Hub initial={{ dwellEnabled: true, dwellMs: HOLD_MS }} />);
    fireEvent.click(screen.getByRole("button", { name: "Play Sum Check" }));
    pointerOver(screen.getByRole("button", { name: "Back to games" }));
    advance(HOLD_MS);
    expect(screen.getByRole("heading", { level: 1, name: "Games" })).toBeInTheDocument();
    pointerOver(screen.getByRole("button", { name: "Surprise me" }), { still: true });
    advance(5 * HOLD_MS);
    expect(screen.getByRole("heading", { level: 1, name: "Games" })).toBeInTheDocument();
    expect(screen.getByText("No button is being held.")).toBeInTheDocument();
  });

  it("names the clear button and the new hold messages in French", () => {
    vi.useFakeTimers();
    const holding = (): string => document.querySelector("[data-dwell-holding]")?.textContent ?? "";
    render(<Hub initial={{ dwellEnabled: true, dwellMs: HOLD_MS, language: "fr" }} />);
    const box = screen.getByRole("textbox", { name: "Chercher un jeu" });
    pointerOver(box);
    expect(holding()).toBe("Maintien du champ de texte\u00A0: Chercher un jeu. Le curseur y sera placé.");
    pointerOut(box);
    fireEvent.change(box, { target: { value: "sum" } });
    expect(screen.getByRole("button", { name: "Effacer la recherche" })).toBeInTheDocument();
    pointerOver(screen.getByRole("combobox", { name: "Taille du texte" }));
    expect(holding()).toBe("Maintien de la liste\u00A0: Taille du texte. Elle passera à\u00A0: Grand");
    expect(screen.getByText(/Avec la barre du contacteur, appuyez sur Suivant et attendez 1 secondes\./)).toBeInTheDocument();
  });

  it("plays a full round with one switch: Next to move, then wait", async () => {
    vi.useFakeTimers();
    const rounds: GamesRound[] = [];
    const game = BATCH_TWO_CATALOG.find((item) => item.id === "sum-check");
    if (!game) throw new Error("No Sum Check");
    render(<Hub initial={{ dwellEnabled: true, dwellMs: HOLD_MS }} rounds={rounds} />);
    fireEvent.click(screen.getByRole("button", { name: `Play ${game.name}` }));
    let session = createSession(game.id, { seed: 11, pace: "relaxed", language: "en", timerEnabled: false, practice: false });
    for (let guard = 0; guard < 40 && !session.done; guard += 1) {
      const step = solutionIds(session)[0] ?? "";
      const label = viewSession(session).choices.find((choice) => choice.id === step)?.label ?? "";
      expect(label).not.toBe("");
      let reached = false;
      for (let presses = 0; presses < 60 && !reached; presses += 1) {
        await pressNext();
        reached = highlighted() === label;
      }
      expect(reached, label).toBe(true);
      advance(HOLD_MS);
      session = choose(session, step);
    }
    expect(session.done).toBe(true);
    expect(screen.getAllByText("Round finished. You can stop here. Nothing else in the App changes.").length).toBeGreaterThan(0);
    expect(rounds).toHaveLength(1);
    expect(rounds[0]).toMatchObject({ gameId: "sum-check", completed: true, correctCount: session.correct, trialCount: session.answered });
  });

  it("passes the automated accessibility check with the clear button and a list hold on screen", async () => {
    vi.useFakeTimers();
    const { container } = render(<Hub initial={{ dwellEnabled: true, dwellMs: HOLD_MS }} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Search games" }), { target: { value: "sum" } });
    pointerOver(screen.getByRole("combobox", { name: "Text size" }));
    advance(HOLD_MS / 2);
    vi.useRealTimers();
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });

  it("adds no health or benefit claim with the new strings", () => {
    expect(healthClaimHits()).toEqual([]);
  });
});
