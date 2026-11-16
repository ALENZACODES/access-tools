import { useEffect, useState, type CSSProperties, type RefObject } from "react";
import { batchCopy, batchPhrase } from "../batch2/copy.js";
import {
  DWELL_MAX_MS,
  DWELL_MIN_MS,
  DWELL_TICK_MS,
  changeHoldMs,
  dwellActivate,
  dwellConfig,
  dwellKind,
  dwellName,
  dwellPercent,
  dwellTarget,
  holdSeconds,
  nextListOption,
  type DwellConfig,
} from "../dwell.js";
import { DWELL_CSS } from "../dwellCss.js";
import type { GamesSettings, Language } from "../types.js";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface Hold {
  control: HTMLElement;
  /** "switch" is a hold on the control the switch bar's Next has highlighted. */
  source: "pointer" | "focus" | "switch";
  elapsed: number;
}

/**
 * Where the pointer was last seen, shared by every dwell layer on the page.
 * When the screen changes under a pointer that has not moved, the browser
 * still reports the pointer as arriving on whatever is now beneath it. That
 * is not a person resting on a control, so it must not start a hold: a hold
 * starts only once the pointer has really moved. The hub and a game screen
 * each have their own layer, which is why this is kept outside them.
 */
let lastPoint: { x: number; y: number } | null = null;

/** Records the pointer's place and says whether it differs from the place last seen. */
function pointerMoved(event: PointerEvent): boolean {
  const moved = lastPoint === null || Math.abs(event.clientX - lastPoint.x) >= 1 || Math.abs(event.clientY - lastPoint.y) >= 1;
  lastPoint = { x: event.clientX, y: event.clientY };
  return moved;
}

interface Shown {
  name: string;
  percent: number;
  kind: "press" | "list" | "text";
  /** For a list: the choice it will move to. */
  next: string;
}

function describeHold(control: HTMLElement, percent: number): Shown {
  const kind = dwellKind(control);
  const next = control instanceof HTMLSelectElement ? (nextListOption(control)?.textContent ?? "").replace(/\s+/g, " ").trim() : "";
  return { name: dwellName(control), percent, kind, next };
}

/**
 * Dwell select for every control inside the root: rest the pointer on a button,
 * or move keyboard focus to it and wait, and it is chosen after the hold time.
 * A list moves to its next choice, and a text box receives the cursor.
 * It is tied to the switch bar as well: when Next moves the highlight to a
 * control, that control is held and chosen after the hold time, so one switch is enough.
 * It renders nothing and listens to nothing while dwell select is off.
 * Tap, keyboard, and switch are untouched, so dwell is never the only way to play.
 */
export function DwellLayer({
  rootRef,
  config,
  language,
  colors,
}: {
  rootRef: RefObject<HTMLElement | null>;
  config: DwellConfig;
  language: Language;
  colors: { background: string; color: string; border: string };
}) {
  const [shown, setShown] = useState<Shown | null>(null);
  const { enabled, holdMs } = config;
  const reduceMotion = config.reduceMotion || prefersReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root) return;
    let hold: Hold | null = null;
    /** A control that was just chosen or cancelled. It cannot be held again until the pointer or focus leaves it. */
    let spent: HTMLElement | null = null;
    let keyboardMove = false;
    let timer: number | null = null;

    const stop = (): void => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
      hold?.control.removeAttribute("data-dwell-target");
      hold = null;
      setShown(null);
    };

    const tick = (): void => {
      if (!hold) return;
      const control = hold.control;
      if (!control.isConnected || dwellTarget(control, root) !== control) {
        stop();
        return;
      }
      hold.elapsed += DWELL_TICK_MS;
      if (hold.elapsed >= holdMs) {
        stop();
        spent = control;
        dwellActivate(control);
        return;
      }
      const percent = dwellPercent(hold.elapsed, holdMs, reduceMotion);
      setShown((current) => (current && current.percent === percent ? current : describeHold(control, percent)));
    };

    const start = (control: HTMLElement, source: Hold["source"]): void => {
      if (hold?.control === control) return;
      stop();
      if (spent === control) return;
      spent = null;
      hold = { control, source, elapsed: 0 };
      control.setAttribute("data-dwell-target", "true");
      setShown(describeHold(control, 0));
      timer = window.setInterval(tick, DWELL_TICK_MS);
    };

    const onPointerOver = (event: PointerEvent): void => {
      if (event.pointerType === "touch") return;
      const moved = pointerMoved(event);
      const control = dwellTarget(event.target, root);
      if (control && moved) start(control, "pointer");
    };
    /** A pointer that was already over a control when the screen changed starts its hold with its first real movement. */
    const onPointerMove = (event: PointerEvent): void => {
      if (event.pointerType === "touch") return;
      if (!pointerMoved(event)) return;
      const control = dwellTarget(event.target, root);
      if (control) start(control, "pointer");
    };
    const onPointerOut = (event: PointerEvent): void => {
      const leaving = dwellTarget(event.target, root);
      if (!leaving) return;
      const into = event.relatedTarget instanceof Node ? event.relatedTarget : null;
      if (into && leaving.contains(into)) return;
      if (spent === leaving) spent = null;
      if (hold?.control === leaving && hold.source === "pointer") stop();
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && hold) {
        spent = hold.control;
        stop();
        return;
      }
      keyboardMove = event.key === "Tab" || event.key.startsWith("Arrow");
    };
    const onFocusIn = (event: FocusEvent): void => {
      const moved = keyboardMove;
      keyboardMove = false;
      if (!moved) return;
      const control = dwellTarget(event.target, root);
      if (control) start(control, "focus");
    };
    const onFocusOut = (event: FocusEvent): void => {
      const leaving = dwellTarget(event.target, root);
      if (!leaving) return;
      if (spent === leaving) spent = null;
      if (hold?.control === leaving && hold.source === "focus") stop();
    };
    /** A tap, a key press, or a switch choice on the held control ends the hold, so one action never counts twice. */
    const onClick = (event: MouseEvent): void => {
      const control = dwellTarget(event.target, root);
      if (!control || hold?.control !== control) return;
      spent = control;
      stop();
    };

    /** The switch bar marks the control it has reached with data-switch-current. That mark starts a hold. */
    const onScan = (records: MutationRecord[]): void => {
      for (const record of records) {
        const node = record.target;
        if (!(node instanceof HTMLElement)) continue;
        if (node.hasAttribute("data-switch-current")) {
          const control = dwellTarget(node, root);
          if (control === node) start(control, "switch");
        } else {
          if (spent === node) spent = null;
          if (hold?.control === node && hold.source === "switch") stop();
        }
      }
    };
    const scan = typeof MutationObserver === "function" ? new MutationObserver(onScan) : null;
    scan?.observe(root, { attributes: true, attributeFilter: ["data-switch-current"], subtree: true });

    root.addEventListener("pointerover", onPointerOver);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerout", onPointerOut);
    root.addEventListener("keydown", onKeyDown);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    root.addEventListener("click", onClick, true);
    return () => {
      stop();
      scan?.disconnect();
      root.removeEventListener("pointerover", onPointerOver);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerout", onPointerOut);
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      root.removeEventListener("click", onClick, true);
    };
  }, [enabled, holdMs, reduceMotion, rootRef]);

  if (!enabled) return null;

  const panel: CSSProperties = {
    position: "sticky",
    bottom: 0,
    padding: "0.5rem 0.75rem",
    background: colors.background,
    color: colors.color,
    border: `3px solid ${colors.border}`,
    display: "grid",
    gap: "0.25rem",
  };
  /** Room for two lines, so the strip keeps its height when a hold starts or ends. */
  const line: CSSProperties = { margin: 0, minHeight: "3em", lineHeight: 1.5 };

  return (
    <>
      <p style={{ margin: 0 }} data-dwell-help>
        {batchPhrase("dwell.help", language, { seconds: holdSeconds(holdMs, language) })}
      </p>
      {/*
        The strip stays at the bottom of the window. Its three rows are always there and keep the same
        height, so it never grows over the control that is being held.
      */}
      <div data-dwell-layer data-dwell-motion={reduceMotion ? "stepped" : "smooth"} style={panel}>
        <style>{DWELL_CSS}</style>
        {shown ? (
          <>
            <p style={{ ...line, fontWeight: 700 }} data-dwell-holding data-dwell-kind={shown.kind}>
              {shown.kind === "list"
                ? batchPhrase("dwell.holding-list", language, { name: shown.name, next: shown.next })
                : shown.kind === "text"
                  ? batchPhrase("dwell.holding-text", language, { name: shown.name })
                  : batchPhrase("dwell.holding", language, { name: shown.name })}
            </p>
            <progress max={100} value={shown.percent} aria-label={batchPhrase("dwell.progress", language, { name: shown.name })} />
            <p style={{ margin: 0, lineHeight: 1.5 }} data-dwell-percent>
              {batchPhrase("dwell.percent", language, { percent: shown.percent })}
            </p>
          </>
        ) : (
          <>
            <p style={line} data-dwell-idle>
              {batchCopy("dwell.idle", language)}
            </p>
            <div data-dwell-bar-space aria-hidden="true" />
            <p style={{ margin: 0, lineHeight: 1.5 }} aria-hidden="true">
              {"\u00A0"}
            </p>
          </>
        )}
      </div>
    </>
  );
}

/** Dwell controls for the settings group. They are buttons, so dwell select can adjust or turn off itself. */
export function DwellSettings({
  settings,
  onSettings,
  button,
}: {
  settings: GamesSettings;
  onSettings: (settings: GamesSettings) => void;
  button: CSSProperties;
}) {
  const language = settings.language;
  const config = dwellConfig(settings);
  const setHold = (direction: "shorter" | "longer"): void => onSettings({ ...settings, dwellMs: changeHoldMs(config.holdMs, direction) });
  return (
    <div role="group" aria-labelledby="dwell-settings-title" data-dwell-settings style={{ display: "grid", gap: "0.5rem", marginTop: "0.75rem" }}>
      <h3 id="dwell-settings-title" style={{ margin: 0 }}>
        {batchCopy("dwell.title", language)}
      </h3>
      <p style={{ margin: 0 }}>{batchCopy("dwell.about", language)}</p>
      <p style={{ margin: 0 }} data-dwell-state>
        {batchCopy(config.enabled ? "dwell.state-on" : "dwell.state-off", language)}{" "}
        {batchPhrase("dwell.hold", language, { seconds: holdSeconds(config.holdMs, language) })}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <button type="button" style={button} onClick={() => onSettings({ ...settings, dwellEnabled: !config.enabled, dwellMs: config.holdMs })}>
          {batchCopy(config.enabled ? "dwell.turn-off" : "dwell.turn-on", language)}
        </button>
        <button type="button" style={button} disabled={config.holdMs <= DWELL_MIN_MS} onClick={() => setHold("shorter")}>
          {batchCopy("dwell.shorter", language)}
        </button>
        <button type="button" style={button} disabled={config.holdMs >= DWELL_MAX_MS} onClick={() => setHold("longer")}>
          {batchCopy("dwell.longer", language)}
        </button>
      </div>
    </div>
  );
}
