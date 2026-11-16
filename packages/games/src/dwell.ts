import type { GamesSettings } from "./types.js";

export const DWELL_MIN_MS = 500;
export const DWELL_MAX_MS = 5000;
export const DWELL_STEP_MS = 500;
export const DWELL_DEFAULT_MS = 1500;
/** How often the hold bar is redrawn. */
export const DWELL_TICK_MS = 100;

export interface DwellConfig {
  enabled: boolean;
  holdMs: number;
  reduceMotion: boolean;
}

/** Keeps a hold time inside the allowed range and on a half-second step. */
export function clampHoldMs(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return DWELL_DEFAULT_MS;
  const stepped = Math.round(value / DWELL_STEP_MS) * DWELL_STEP_MS;
  return Math.min(DWELL_MAX_MS, Math.max(DWELL_MIN_MS, stepped));
}

/** Dwell select is off unless the saved settings turn it on. */
export function dwellConfig(settings: Pick<GamesSettings, "dwellEnabled" | "dwellMs" | "reduceMotion">): DwellConfig {
  return {
    enabled: settings.dwellEnabled === true,
    holdMs: clampHoldMs(settings.dwellMs),
    reduceMotion: settings.reduceMotion,
  };
}

export function changeHoldMs(current: number, direction: "shorter" | "longer"): number {
  return clampHoldMs(clampHoldMs(current) + (direction === "longer" ? DWELL_STEP_MS : -DWELL_STEP_MS));
}

/**
 * Percent of the hold that has passed, 0 to 100.
 * With reduced motion the bar moves in four plain steps and does not glide.
 */
export function dwellPercent(elapsedMs: number, holdMs: number, reduceMotion: boolean): number {
  if (holdMs <= 0) return 100;
  const raw = Math.min(100, Math.max(0, (elapsedMs / holdMs) * 100));
  return reduceMotion ? Math.floor(raw / 25) * 25 : Math.round(raw);
}

/** Hold time in seconds for display: 1.5 in English, 1,5 in French. */
export function holdSeconds(holdMs: number, language: "en" | "fr"): string {
  return new Intl.NumberFormat(language === "fr" ? "fr-CA" : "en-CA", { maximumFractionDigits: 1 }).format(holdMs / 1000);
}

const TEXT_BOX = "input[type='text'], input[type='search'], input:not([type])";
const TARGET = `button, input[type='checkbox'], input[type='radio'], a[href], select, ${TEXT_BOX}`;

/**
 * The control a dwell can choose for an event target, or null.
 * Disabled controls, the switch bar's own buttons, and anything marked data-dwell-ignore are left out.
 */
export function dwellTarget(node: EventTarget | null, root: HTMLElement): HTMLElement | null {
  if (!(node instanceof Element)) return null;
  const control = node.closest<HTMLElement>(TARGET);
  if (!control || !root.contains(control)) return null;
  if (control.closest("[data-switch-bar], [data-dwell-ignore]")) return null;
  if (control.matches(":disabled") || control.getAttribute("aria-disabled") === "true") return null;
  return control;
}

/** What a finished hold does to a control. */
export type DwellKind = "press" | "list" | "text";

export function dwellKind(control: HTMLElement): DwellKind {
  if (control instanceof HTMLSelectElement) return "list";
  if (control instanceof HTMLInputElement && control.matches(TEXT_BOX)) return "text";
  return "press";
}

/** The choice a list moves to when its hold ends: the next enabled one, going back to the first after the last. */
export function nextListOption(list: HTMLSelectElement): HTMLOptionElement | null {
  const options = [...list.options];
  if (options.length === 0) return null;
  for (let step = 1; step <= options.length; step += 1) {
    const option = options[(Math.max(list.selectedIndex, 0) + step) % options.length];
    if (option && !option.disabled && option.index !== list.selectedIndex) return option;
  }
  return null;
}

/**
 * Carries out a finished hold. A button, link, checkbox or radio is pressed.
 * A list moves to its next choice and reports the change as a person's own
 * choice would. A text box receives the cursor, so an on-screen keyboard can type in it.
 */
export function dwellActivate(control: HTMLElement): void {
  const kind = dwellKind(control);
  if (kind === "list") {
    const list = control as HTMLSelectElement;
    const next = nextListOption(list);
    if (!next) return;
    list.selectedIndex = next.index;
    list.dispatchEvent(new Event("input", { bubbles: true }));
    list.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }
  if (kind === "text") {
    control.focus();
    return;
  }
  control.click();
}

/** Visible name of a control, for the hold bar's label. */
export function dwellName(control: HTMLElement): string {
  const aria = control.getAttribute("aria-label");
  if (aria) return aria.trim();
  if ((control instanceof HTMLInputElement || control instanceof HTMLSelectElement) && control.labels && control.labels.length > 0) {
    return [...control.labels]
      .map((label) => {
        const copy = label.cloneNode(true) as HTMLElement;
        copy.querySelectorAll("select, input, textarea").forEach((field) => field.remove());
        return copy.textContent ?? "";
      })
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return (control.textContent ?? "").replace(/\s+/g, " ").trim();
}
