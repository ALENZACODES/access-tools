import type { HoursWindow } from "./types.js";

export interface CivilClock {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Minutes from midnight, 0 to 1439. */
  minutes: number;
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function toMinutes(hhmm: string): number | null {
  const match = TIME.exec(hhmm);
  if (!match || match[1] === undefined || match[2] === undefined) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Open-now uses the civil clock the caller supplies.
 * It is not a live feed and it does not read the device clock unless the caller passes that clock.
 */
export function isOpenAt(hours: HoursWindow[] | null, at: CivilClock | null): "open" | "closed" | "unknown" {
  if (!at || !hours || hours.length === 0) return "unknown";
  const windows = hours.filter((window) => window.day === at.day);
  if (windows.length === 0) return "closed";
  let sawInvalid = false;
  for (const window of windows) {
    const open = toMinutes(window.open);
    const close = toMinutes(window.close);
    if (open === null || close === null || close <= open) {
      sawInvalid = true;
      continue;
    }
    if (at.minutes >= open && at.minutes < close) return "open";
  }
  if (sawInvalid && windows.every((window) => toMinutes(window.open) === null || toMinutes(window.close) === null)) {
    return "unknown";
  }
  return "closed";
}
