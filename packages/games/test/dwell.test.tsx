import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { useRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BATCH_COPY } from "../src/batch2/copy.js";
import { pointerOut, pointerOver } from "./pointer.js";
import { dwellName, dwellTarget, holdSeconds } from "../src/dwell.js";
import {
  DWELL_DEFAULT_MS,
  DwellLayer,
  GamesApp,
  changeHoldMs,
  clampHoldMs,
  defaultSettings,
  dwellConfig,
  dwellPercent,
  parseSettings,
  type GamesRound,
  type GamesSettings,
} from "../src/index.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const COLORS = { background: "#fff", color: "#1a1a1a", border: "#1a1a1a" };

function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function Bench(props: { enabled?: boolean; holdMs?: number; reduceMotion?: boolean; onPick: (name: string) => void }) {
  const rootRef = useRef<HTMLElement>(null);
  const [gone, setGone] = useState(false);
  return (
    <main ref={rootRef}>
      <button type="button" onClick={() => props.onPick("one")}>
        One
      </button>
      <button type="button" onClick={() => props.onPick("two")}>
        <span data-testid="inner">Two</span>
      </button>
      <button type="button" disabled onClick={() => props.onPick("off")}>
        Off
      </button>
      <div data-switch-bar>
        <button type="button" onClick={() => props.onPick("bar")}>
          Bar
        </button>
      </div>
      <button type="button" data-dwell-ignore onClick={() => props.onPick("ignored")}>
        Ignored
      </button>
      {gone ? null : (
        <button type="button" onClick={() => props.onPick("leaving")}>
          Leaving
        </button>
      )}
      <button type="button" data-dwell-ignore onClick={() => setGone(true)}>
        Remove
      </button>
      <label>
        <input type="checkbox" onChange={() => props.onPick("check")} />
        Check me
      </label>
      <p data-testid="text">Plain text</p>
      <DwellLayer
        rootRef={rootRef}
        config={{ enabled: props.enabled ?? true, holdMs: props.holdMs ?? 1000, reduceMotion: props.reduceMotion ?? false }}
        language="en"
        colors={COLORS}
      />
    </main>
  );
}

describe("dwell rules", () => {
  it("is off unless the settings turn it on, and keeps the hold time in range", () => {
    const settings = defaultSettings("player-12345678");
    expect(dwellConfig(settings)).toEqual({ enabled: false, holdMs: DWELL_DEFAULT_MS, reduceMotion: true });
    expect(dwellConfig({ ...settings, dwellEnabled: true, dwellMs: 3000, reduceMotion: false })).toEqual({ enabled: true, holdMs: 3000, reduceMotion: false });
    expect(clampHoldMs(100)).toBe(500);
    expect(clampHoldMs(99_999)).toBe(5000);
    expect(clampHoldMs(1260)).toBe(1500);
    expect(clampHoldMs(Number.NaN)).toBe(1500);
    expect(clampHoldMs("2000")).toBe(1500);
    expect(changeHoldMs(1500, "longer")).toBe(2000);
    expect(changeHoldMs(1500, "shorter")).toBe(1000);
    expect(changeHoldMs(500, "shorter")).toBe(500);
    expect(changeHoldMs(5000, "longer")).toBe(5000);
  });

  it("fills the bar smoothly, or in four plain steps with reduced motion", () => {
    expect(dwellPercent(0, 1000, false)).toBe(0);
    expect(dwellPercent(330, 1000, false)).toBe(33);
    expect(dwellPercent(2000, 1000, false)).toBe(100);
    expect(dwellPercent(-5, 1000, false)).toBe(0);
    expect([0, 240, 250, 490, 500, 740, 750, 990, 1000].map((elapsed) => dwellPercent(elapsed, 1000, true))).toEqual([0, 0, 25, 25, 50, 50, 75, 75, 100]);
    expect(holdSeconds(1500, "en")).toBe("1.5");
    expect(holdSeconds(1500, "fr")).toBe("1,5");
    expect(holdSeconds(2000, "fr")).toBe("2");
  });

  it("stores the dwell settings and refuses a hold time outside the range", () => {
    const settings = defaultSettings("player-12345678");
    expect(parseSettings(settings)).toEqual(settings);
    expect(parseSettings({ ...settings, dwellEnabled: true, dwellMs: 2500 })).toMatchObject({ dwellEnabled: true, dwellMs: 2500 });
    expect(() => parseSettings({ ...settings, dwellMs: 100 })).toThrow(/not valid/);
    expect(() => parseSettings({ ...settings, dwellMs: 6000 })).toThrow(/not valid/);
    expect(() => parseSettings({ ...settings, dwellEnabled: "yes" })).toThrow(/not valid/);
  });

  it("picks only enabled controls outside the switch bar", () => {
    render(<Bench onPick={() => undefined} enabled={false} />);
    const root = screen.getByRole("main");
    expect(dwellTarget(screen.getByTestId("inner"), root)).toBe(screen.getByRole("button", { name: "Two" }));
    expect(dwellTarget(screen.getByRole("button", { name: "Off" }), root)).toBeNull();
    expect(dwellTarget(screen.getByRole("button", { name: "Bar" }), root)).toBeNull();
    expect(dwellTarget(screen.getByRole("button", { name: "Ignored" }), root)).toBeNull();
    expect(dwellTarget(screen.getByTestId("text"), root)).toBeNull();
    expect(dwellTarget(null, root)).toBeNull();
    expect(dwellTarget(document.body, root)).toBeNull();
    expect(dwellName(screen.getByRole("checkbox"))).toBe("Check me");
    expect(dwellName(screen.getByRole("button", { name: "Two" }))).toBe("Two");
  });
});

describe("dwell layer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing and chooses nothing while it is off", () => {
    const onPick = vi.fn();
    const { container } = render(<Bench onPick={onPick} enabled={false} />);
    expect(container.querySelector("[data-dwell-layer]")).toBeNull();
    pointerOver(screen.getByRole("button", { name: "One" }));
    advance(10_000);
    expect(onPick).not.toHaveBeenCalled();
    expect(container.querySelector("[data-dwell-target]")).toBeNull();
  });

  it("chooses a button after the pointer rests on it for the hold time, with a visible bar", () => {
    const onPick = vi.fn();
    const { container } = render(<Bench onPick={onPick} holdMs={1000} />);
    expect(screen.getByText(/Rest on a button for 1 seconds to choose it/)).toBeInTheDocument();
    expect(screen.getByText("No button is being held.")).toBeInTheDocument();
    const one = screen.getByRole("button", { name: "One" });
    pointerOver(one);
    expect(one).toHaveAttribute("data-dwell-target", "true");
    expect(screen.getByText("Holding: One")).toBeInTheDocument();
    const bar = screen.getByRole("progressbar", { name: "Hold progress for One" });
    expect(bar).toHaveAttribute("value", "0");
    advance(500);
    expect(bar).toHaveAttribute("value", "50");
    expect(screen.getByText("50 percent")).toBeInTheDocument();
    expect(onPick).not.toHaveBeenCalled();
    advance(400);
    expect(onPick).not.toHaveBeenCalled();
    advance(100);
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith("one");
    expect(one).not.toHaveAttribute("data-dwell-target");
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(container.querySelector("[data-dwell-layer]")).toHaveAttribute("data-dwell-motion", "smooth");
  });

  it("does not repeat a choice until the pointer leaves and comes back", () => {
    const onPick = vi.fn();
    render(<Bench onPick={onPick} holdMs={500} />);
    const one = screen.getByRole("button", { name: "One" });
    pointerOver(one);
    advance(500);
    expect(onPick).toHaveBeenCalledTimes(1);
    advance(5000);
    pointerOver(one);
    advance(5000);
    expect(onPick).toHaveBeenCalledTimes(1);
    pointerOut(one);
    pointerOver(one);
    advance(500);
    expect(onPick).toHaveBeenCalledTimes(2);
  });

  it("cancels when the pointer moves away, and stays on a button while the pointer is inside it", () => {
    const onPick = vi.fn();
    render(<Bench onPick={onPick} holdMs={1000} />);
    const one = screen.getByRole("button", { name: "One" });
    const two = screen.getByRole("button", { name: "Two" });
    pointerOver(one);
    advance(900);
    pointerOut(one);
    expect(screen.getByText("No button is being held.")).toBeInTheDocument();
    advance(5000);
    expect(onPick).not.toHaveBeenCalled();
    pointerOver(two);
    advance(400);
    pointerOut(two, { relatedTarget: screen.getByTestId("inner") });
    pointerOver(screen.getByTestId("inner"));
    advance(600);
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith("two");
    pointerOver(one);
    advance(300);
    pointerOver(two);
    advance(900);
    expect(onPick).toHaveBeenCalledTimes(1);
    pointerOver(one);
    advance(999);
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it("chooses a button that keyboard focus rests on, and not one that only received focus from a script", () => {
    const onPick = vi.fn();
    render(<Bench onPick={onPick} holdMs={1000} />);
    const one = screen.getByRole("button", { name: "One" });
    const two = screen.getByRole("button", { name: "Two" });
    act(() => one.focus());
    advance(5000);
    expect(onPick).not.toHaveBeenCalled();
    fireEvent.keyDown(one, { key: "Tab" });
    act(() => two.focus());
    expect(screen.getByText("Holding: Two")).toBeInTheDocument();
    advance(1000);
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith("two");
    advance(5000);
    expect(onPick).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(two, { key: "Tab", shiftKey: true });
    act(() => one.focus());
    advance(600);
    fireEvent.keyDown(one, { key: "Tab" });
    act(() => two.focus());
    advance(600);
    expect(onPick).toHaveBeenCalledTimes(1);
    advance(400);
    expect(onPick).toHaveBeenCalledTimes(2);
  });

  it("cancels on Escape, and a tap or key press on the held button counts once", () => {
    const onPick = vi.fn();
    render(<Bench onPick={onPick} holdMs={1000} />);
    const one = screen.getByRole("button", { name: "One" });
    pointerOver(one);
    advance(500);
    fireEvent.keyDown(one, { key: "Escape" });
    expect(screen.queryByRole("progressbar")).toBeNull();
    advance(5000);
    expect(onPick).not.toHaveBeenCalled();
    pointerOut(one);
    pointerOver(one);
    advance(500);
    fireEvent.click(one);
    expect(onPick).toHaveBeenCalledTimes(1);
    advance(5000);
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it("skips disabled controls, the switch bar, touch pointers, and a button that is removed mid-hold", () => {
    const onPick = vi.fn();
    render(<Bench onPick={onPick} holdMs={500} />);
    for (const name of ["Off", "Bar", "Ignored"]) {
      pointerOver(screen.getByRole("button", { name }));
      advance(2000);
    }
    pointerOver(screen.getByRole("button", { name: "One" }), { pointerType: "touch" });
    advance(2000);
    expect(onPick).not.toHaveBeenCalled();
    pointerOver(screen.getByRole("button", { name: "Leaving" }));
    advance(200);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    advance(2000);
    expect(onPick).not.toHaveBeenCalled();
    expect(screen.getByText("No button is being held.")).toBeInTheDocument();
    pointerOver(screen.getByRole("checkbox"));
    advance(500);
    expect(onPick).toHaveBeenCalledWith("check");
  });

  it("moves the bar in four steps when reduced motion is on, or when the device asks for it", () => {
    const onPick = vi.fn();
    const first = render(<Bench onPick={onPick} holdMs={1000} reduceMotion />);
    expect(first.container.querySelector("[data-dwell-layer]")).toHaveAttribute("data-dwell-motion", "stepped");
    pointerOver(screen.getByRole("button", { name: "One" }));
    const seen = new Set<string>();
    for (let tick = 0; tick < 9; tick += 1) {
      advance(100);
      seen.add(screen.getByRole("progressbar").getAttribute("value") ?? "");
    }
    expect([...seen]).toEqual(["0", "25", "50", "75"]);
    advance(100);
    expect(onPick).toHaveBeenCalledTimes(1);
    first.unmount();

    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ matches: query.includes("reduce"), media: query })) as unknown as typeof window.matchMedia;
    try {
      const second = render(<Bench onPick={onPick} holdMs={1000} />);
      expect(second.container.querySelector("[data-dwell-layer]")).toHaveAttribute("data-dwell-motion", "stepped");
    } finally {
      window.matchMedia = original;
    }
  });

  it("stops listening when it is turned off or unmounted", () => {
    const onPick = vi.fn();
    const view = render(<Bench onPick={onPick} holdMs={500} />);
    const one = screen.getByRole("button", { name: "One" });
    pointerOver(one);
    advance(200);
    view.rerender(<Bench onPick={onPick} holdMs={500} enabled={false} />);
    expect(one).not.toHaveAttribute("data-dwell-target");
    advance(2000);
    pointerOut(one);
    pointerOver(one);
    advance(2000);
    expect(onPick).not.toHaveBeenCalled();
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

function Hub(props: { initial?: Partial<GamesSettings>; onSaved?: (settings: GamesSettings) => void }) {
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
      onRound={(item) => setRounds((current) => [...current, item])}
      onResetStreak={() => setRounds([])}
    />
  );
}

describe("dwell select in the games shell", () => {
  it("is off by default, and its controls turn it on, adjust it, and turn it off", () => {
    const saved: GamesSettings[] = [];
    const { container } = render(<Hub onSaved={(settings) => saved.push(settings)} />);
    expect(container.querySelector("[data-dwell-layer]")).toBeNull();
    const group = screen.getByRole("group", { name: "Dwell select" });
    expect(within(group).getByText(/Tap, keyboard, and switch keep working/)).toBeInTheDocument();
    expect(within(group).getByText("Dwell select is off. Hold time: 1.5 seconds.")).toBeInTheDocument();
    fireEvent.click(within(group).getByRole("button", { name: "Turn dwell select on" }));
    expect(saved.at(-1)).toMatchObject({ dwellEnabled: true, dwellMs: 1500 });
    expect(() => parseSettings(saved.at(-1))).not.toThrow();
    expect(container.querySelector("[data-dwell-layer]")).not.toBeNull();
    expect(within(group).getByText("Dwell select is on. Hold time: 1.5 seconds.")).toBeInTheDocument();
    fireEvent.click(within(group).getByRole("button", { name: "Longer hold time" }));
    expect(saved.at(-1)?.dwellMs).toBe(2000);
    for (let press = 0; press < 10; press += 1) {
      const shorter = within(group).getByRole("button", { name: "Shorter hold time" });
      if (!(shorter as HTMLButtonElement).disabled) fireEvent.click(shorter);
    }
    expect(saved.at(-1)?.dwellMs).toBe(500);
    expect(within(group).getByRole("button", { name: "Shorter hold time" })).toBeDisabled();
    expect(within(group).getByText("Dwell select is on. Hold time: 0.5 seconds.")).toBeInTheDocument();
    fireEvent.click(within(group).getByRole("button", { name: "Turn dwell select off" }));
    expect(saved.at(-1)?.dwellEnabled).toBe(false);
    expect(container.querySelector("[data-dwell-layer]")).toBeNull();
  });

  it("can open a game, go back, and turn itself off by dwell alone, in French too", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<Hub initial={{ dwellEnabled: true, dwellMs: 1000, language: "fr" }} />);
      expect(screen.getByText(/Restez sur un bouton pendant 1 secondes pour le choisir/)).toBeInTheDocument();
      pointerOver(screen.getByRole("button", { name: "Jouer Sum Check" }));
      expect(screen.getByRole("progressbar", { name: "Progression du maintien pour Jouer Sum Check" })).toBeInTheDocument();
      advance(1000);
      expect(screen.getByRole("heading", { level: 1, name: "Sum Check" })).toHaveFocus();
      expect(container.querySelector("[data-dwell-layer]")).not.toBeNull();
      advance(5000);
      expect(screen.getByRole("heading", { level: 1, name: "Sum Check" })).toBeInTheDocument();
      pointerOver(screen.getByRole("button", { name: "Retour aux jeux" }));
      advance(1000);
      expect(screen.getByRole("button", { name: "Jouer Sum Check" })).toHaveFocus();
      advance(5000);
      expect(screen.queryByRole("heading", { level: 1, name: "Sum Check" })).toBeNull();
      pointerOver(screen.getByRole("button", { name: "Désactiver la sélection par maintien" }));
      advance(1000);
      expect(container.querySelector("[data-dwell-layer]")).toBeNull();
      expect(screen.getByRole("button", { name: "Activer la sélection par maintien" })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not choose a paused game's answers, and passes the automated accessibility check while holding", async () => {
    vi.useFakeTimers();
    const { container } = render(<Hub initial={{ dwellEnabled: true, dwellMs: 1000 }} />);
    fireEvent.click(screen.getByRole("button", { name: "Play Mirror Moves" }));
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    const answer = screen.getByRole("button", { name: "Go up" });
    expect(answer).toBeDisabled();
    pointerOver(answer);
    advance(3000);
    expect(screen.getByText("No button is being held.")).toBeInTheDocument();
    pointerOver(screen.getByRole("button", { name: "Resume" }));
    advance(1000);
    expect(screen.getByRole("button", { name: "Go up" })).toBeEnabled();
    pointerOver(screen.getByRole("button", { name: "Go up" }));
    advance(500);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    vi.useRealTimers();
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    expect(results.violations).toEqual([]);
  });

  it("names every dwell string in both languages", () => {
    for (const [key, row] of Object.entries(BATCH_COPY)) {
      if (!key.startsWith("dwell.")) continue;
      expect(row.en).not.toBe(row.fr);
    }
  });
});
