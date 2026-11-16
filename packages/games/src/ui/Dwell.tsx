import { useEffect, useState, type CSSProperties, type RefObject } from "react";
import { batchCopy, batchPhrase } from "../batch2/copy.js";
import {
  DWELL_MAX_MS,
  DWELL_MIN_MS,
  DWELL_TICK_MS,
  changeHoldMs,
  dwellConfig,
  dwellName,
  dwellPercent,
  dwellTarget,
  holdSeconds,
  type DwellConfig,
} from "../dwell.js";
import { DWELL_CSS } from "../dwellCss.js";
import type { GamesSettings, Language } from "../types.js";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface Hold {
  control: HTMLElement;
  source: "pointer" | "focus";
  elapsed: number;
}

/**
 * Dwell select for every control inside the root: rest the pointer on a button,
 * or move keyboard focus to it and wait, and it is chosen after the hold time.
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
  const [shown, setShown] = useState<{ name: string; percent: number } | null>(null);
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
        control.click();
        return;
      }
      const percent = dwellPercent(hold.elapsed, holdMs, reduceMotion);
      setShown((current) => (current && current.percent === percent ? current : { name: dwellName(control), percent }));
    };

    const start = (control: HTMLElement, source: Hold["source"]): void => {
      if (hold?.control === control) return;
      stop();
      if (spent === control) return;
      spent = null;
      hold = { control, source, elapsed: 0 };
      control.setAttribute("data-dwell-target", "true");
      setShown({ name: dwellName(control), percent: 0 });
      timer = window.setInterval(tick, DWELL_TICK_MS);
    };

    const onPointerOver = (event: PointerEvent): void => {
      if (event.pointerType === "touch") return;
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

    root.addEventListener("pointerover", onPointerOver);
    root.addEventListener("pointerout", onPointerOut);
    root.addEventListener("keydown", onKeyDown);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    root.addEventListener("click", onClick, true);
    return () => {
      stop();
      root.removeEventListener("pointerover", onPointerOver);
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

  return (
    <div data-dwell-layer data-dwell-motion={reduceMotion ? "stepped" : "smooth"} style={panel}>
      <style>{DWELL_CSS}</style>
      <p style={{ margin: 0 }}>{batchPhrase("dwell.help", language, { seconds: holdSeconds(holdMs, language) })}</p>
      {shown ? (
        <>
          <p style={{ margin: 0, fontWeight: 700 }} data-dwell-holding>
            {batchPhrase("dwell.holding", language, { name: shown.name })}
          </p>
          <progress max={100} value={shown.percent} aria-label={batchPhrase("dwell.progress", language, { name: shown.name })} />
          <p style={{ margin: 0 }} data-dwell-percent>
            {batchPhrase("dwell.percent", language, { percent: shown.percent })}
          </p>
        </>
      ) : (
        <p style={{ margin: 0 }} data-dwell-idle>
          {batchCopy("dwell.idle", language)}
        </p>
      )}
    </div>
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
