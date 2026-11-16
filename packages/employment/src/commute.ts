import { UNKNOWN, isCalendarDate } from "./record.js";
import type { ListingRecord, Unknown } from "./record.js";

/**
 * Commute check built only from what the person enters, and optionally from a
 * journey-plan result handed in as data. It compares the person's own numbers
 * with each other and repeats what a plan result states. It never states that a
 * route works, and anything not supplied stays Unknown.
 */
export type CommuteMode = "paratransit" | "transit" | "drive" | "roll-or-walk" | "other";

export interface CommuteInputs {
  mode: CommuteMode | Unknown;
  /** The person's own door-to-door estimate, in minutes. */
  travelMinutes: number | Unknown;
  /** The longest one-way travel time the person is willing to accept. */
  maxMinutes: number | Unknown;
  /** 24-hour HH:MM. */
  shiftStart: string | Unknown;
  shiftEnd: string | Unknown;
  /** Service hours the person has for their mode, as they understand them. */
  serviceStart: string | Unknown;
  serviceEnd: string | Unknown;
  /** Whether the person has tried or checked the trip in winter conditions. */
  winterChecked: boolean | Unknown;
}

/** A journey-plan result supplied by the caller. This package computes none. */
export interface PlanResult {
  outcome: "route-found" | "no-route-found" | Unknown;
  durationMinutes: number | Unknown;
  stepFreeThroughout: boolean | Unknown;
  winterAssessed: boolean | Unknown;
  source: string;
  computedOn: string;
}

export const EMPTY_COMMUTE_INPUTS: CommuteInputs = {
  mode: UNKNOWN, travelMinutes: UNKNOWN, maxMinutes: UNKNOWN, shiftStart: UNKNOWN, shiftEnd: UNKNOWN,
  serviceStart: UNKNOWN, serviceEnd: UNKNOWN, winterChecked: UNKNOWN,
};

export type CommuteItem =
  | { key: "mode"; state: "known"; mode: CommuteMode }
  | { key: "travelTime"; state: "known"; finding: "within-your-limit" | "over-your-limit"; travelMinutes: number; maxMinutes: number }
  | { key: "serviceHours"; state: "known"; finding: "shift-inside-hours" | "shift-outside-hours"; shiftStart: string; shiftEnd: string; serviceStart: string; serviceEnd: string }
  | { key: "winter"; state: "known"; finding: "you-checked" | "you-have-not-checked" }
  | { key: "workplaceEntry"; state: "known"; stepFree: boolean; source: string; date: string; tier: string }
  | { key: "planOutcome"; state: "known"; outcome: "route-found" | "no-route-found"; source: string; computedOn: string }
  | { key: "planDuration"; state: "known"; durationMinutes: number; source: string; computedOn: string }
  | { key: "planStepFree"; state: "known"; stepFree: boolean; source: string; computedOn: string }
  | { key: "planWinter"; state: "known"; assessed: boolean; source: string; computedOn: string }
  | { key: CommuteItemKey; state: "unknown"; missing: CommuteMissing };

export type CommuteItemKey =
  | "mode" | "travelTime" | "serviceHours" | "winter" | "workplaceEntry"
  | "planOutcome" | "planDuration" | "planStepFree" | "planWinter";

export type CommuteMissing = "not-entered" | "no-access-record" | "not-recorded" | "no-plan-result" | "not-in-plan-result";

export interface CommuteReport {
  items: CommuteItem[];
  knownCount: number;
  unknownCount: number;
  /** This check never confirms that a route works. */
  routeConfirmed: false;
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseTime(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = TIME.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** Reads a typed number of minutes; blank, negative or malformed input is Unknown. */
export function parseMinutes(text: string): number | Unknown {
  const trimmed = text.trim();
  if (!/^\d{1,4}$/.test(trimmed)) return UNKNOWN;
  return Number(trimmed);
}

function minutes(value: number | Unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

/** Service hours that run past midnight (end at or before start) wrap to the next day. */
function insideHours(shiftStart: number, shiftEnd: number, serviceStart: number, serviceEnd: number): boolean {
  const day = 24 * 60;
  const span = (start: number, end: number) => (end > start ? end - start : end + day - start);
  const serviceLength = span(serviceStart, serviceEnd);
  const shiftLength = span(shiftStart, shiftEnd);
  const offset = (shiftStart - serviceStart + day) % day;
  return offset + shiftLength <= serviceLength;
}

export function checkCommute(inputs: CommuteInputs, record?: ListingRecord, plan?: PlanResult | null): CommuteReport {
  const items: CommuteItem[] = [];
  const unknown = (key: CommuteItemKey, missing: CommuteMissing) => { items.push({ key, state: "unknown", missing }); };

  if (inputs.mode === UNKNOWN) unknown("mode", "not-entered");
  else items.push({ key: "mode", state: "known", mode: inputs.mode });

  const travel = minutes(inputs.travelMinutes);
  const limit = minutes(inputs.maxMinutes);
  if (travel === null || limit === null) unknown("travelTime", "not-entered");
  else items.push({ key: "travelTime", state: "known", finding: travel <= limit ? "within-your-limit" : "over-your-limit", travelMinutes: travel, maxMinutes: limit });

  const times = [inputs.shiftStart, inputs.shiftEnd, inputs.serviceStart, inputs.serviceEnd].map(parseTime);
  const [shiftStart, shiftEnd, serviceStart, serviceEnd] = times;
  if (shiftStart == null || shiftEnd == null || serviceStart == null || serviceEnd == null) unknown("serviceHours", "not-entered");
  else {
    items.push({
      key: "serviceHours", state: "known",
      finding: insideHours(shiftStart, shiftEnd, serviceStart, serviceEnd) ? "shift-inside-hours" : "shift-outside-hours",
      shiftStart: inputs.shiftStart, shiftEnd: inputs.shiftEnd, serviceStart: inputs.serviceStart, serviceEnd: inputs.serviceEnd,
    });
  }

  if (typeof inputs.winterChecked !== "boolean") unknown("winter", "not-entered");
  else items.push({ key: "winter", state: "known", finding: inputs.winterChecked ? "you-checked" : "you-have-not-checked" });

  const entry = record?.accessRecord?.stepFreeEntry;
  if (!entry) unknown("workplaceEntry", "no-access-record");
  else if (typeof entry.value !== "boolean") unknown("workplaceEntry", "not-recorded");
  else items.push({ key: "workplaceEntry", state: "known", stepFree: entry.value, source: entry.source, date: entry.date, tier: entry.tier });

  const cited = plan && typeof plan.source === "string" && plan.source.trim().length >= 3 && isCalendarDate(plan.computedOn)
    ? { source: plan.source, computedOn: plan.computedOn }
    : null;
  if (!plan || !cited) {
    // A plan result without a source and date is not repeated.
    for (const key of ["planOutcome", "planDuration", "planStepFree", "planWinter"] as const) unknown(key, "no-plan-result");
  } else {
    if (plan.outcome === "route-found" || plan.outcome === "no-route-found") items.push({ key: "planOutcome", state: "known", outcome: plan.outcome, ...cited });
    else unknown("planOutcome", "not-in-plan-result");
    const duration = minutes(plan.durationMinutes);
    if (duration === null) unknown("planDuration", "not-in-plan-result");
    else items.push({ key: "planDuration", state: "known", durationMinutes: duration, ...cited });
    if (typeof plan.stepFreeThroughout === "boolean") items.push({ key: "planStepFree", state: "known", stepFree: plan.stepFreeThroughout, ...cited });
    else unknown("planStepFree", "not-in-plan-result");
    if (typeof plan.winterAssessed === "boolean") items.push({ key: "planWinter", state: "known", assessed: plan.winterAssessed, ...cited });
    else unknown("planWinter", "not-in-plan-result");
  }

  const knownCount = items.filter((item) => item.state === "known").length;
  return { items, knownCount, unknownCount: items.length - knownCount, routeConfirmed: false };
}
