import { formatDateTime } from "./format.js";
import { safetyCopy } from "./i18n.js";
import type { TripShare } from "./tripShare.js";
import type { Language } from "./types.js";

/** On-device only. Nothing here sends, calls, texts or alerts anyone. */
export type CheckInStatus = "idle" | "active" | "ok" | "needs-help";

export interface CheckInState {
  status: CheckInStatus;
  startedAt: string | null;
  dueAt: string | null;
  resolvedAt: string | null;
}

export const IDLE_CHECKIN: CheckInState = { status: "idle", startedAt: null, dueAt: null, resolvedAt: null };
export const CHECKIN_MINUTE_OPTIONS: readonly number[] = [15, 30, 60, 120];

export function startCheckIn(now: Date, minutes: number): CheckInState {
  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 720) {
    throw new RangeError("Check-in window must be a whole number of minutes from 5 to 720.");
  }
  return {
    status: "active",
    startedAt: now.toISOString(),
    dueAt: new Date(now.getTime() + minutes * 60_000).toISOString(),
    resolvedAt: null,
  };
}

export function markOk(state: CheckInState, now: Date): CheckInState {
  return state.status === "active" ? { ...state, status: "ok", resolvedAt: now.toISOString() } : state;
}

export function markNeedHelp(state: CheckInState, now: Date): CheckInState {
  return state.status === "active" ? { ...state, status: "needs-help", resolvedAt: now.toISOString() } : state;
}

export function closeCheckIn(): CheckInState {
  return IDLE_CHECKIN;
}

export function isCheckInOverdue(state: CheckInState, now: Date): boolean {
  return state.status === "active" && state.dueAt !== null && now.getTime() >= new Date(state.dueAt).getTime();
}

export function isCheckInState(value: unknown): value is CheckInState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const dateOrNull = (x: unknown) => x === null || (typeof x === "string" && !Number.isNaN(Date.parse(x)));
  return (
    (v.status === "idle" || v.status === "active" || v.status === "ok" || v.status === "needs-help") &&
    dateOrNull(v.startedAt) &&
    dateOrNull(v.dueAt) &&
    dateOrNull(v.resolvedAt)
  );
}

/** A local summary the person may copy. The App does not send it anywhere. */
export function buildHelpSummary(state: CheckInState, share: TripShare | null, language: Language): string {
  const t = (key: Parameters<typeof safetyCopy>[0], vars?: Record<string, string | number>) => safetyCopy(key, language, vars);
  const lines = [t("summary.title")];
  if (state.startedAt) lines.push(t("summary.started", { time: formatDateTime(state.startedAt, language) }));
  if (state.dueAt) lines.push(t("summary.due", { time: formatDateTime(state.dueAt, language) }));
  lines.push(t("summary.status"));
  if (share) {
    lines.push(t("summary.trip", { origin: share.originLabel, destination: share.destinationLabel }));
    lines.push(
      t("summary.window", { start: formatDateTime(share.windowStart, language), end: formatDateTime(share.windowEnd, language) }),
    );
    if (share.notes) lines.push(t("summary.notes", { notes: share.notes }));
  }
  lines.push(t("summary.footer"));
  return lines.join("\n");
}
