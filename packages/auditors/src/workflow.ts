/**
 * Correction and report workflow with service levels.
 *
 * received → triaged → re-check → resolved, with declined possible from any
 * open state. A case is resolved only on the strength of re-check observations.
 * Target times are configuration. Due dates, overdue flags and the summary are
 * computed from the case history alone; nothing is estimated or filled in.
 */
import type { Field } from "./model.js";

export const CASE_STATES = ["received", "triaged", "recheck", "resolved", "declined"] as const;
export type CaseState = (typeof CASE_STATES)[number];
export type CaseKind = "correction" | "barrier";
export type CaseActor = "reporter" | "coordinator" | "auditor" | "venue-owner";

export interface CaseEvent {
  state: CaseState;
  /** Clock time in ISO 8601 with Z. */
  at: string;
  actor: CaseActor;
  note: string;
  taskId?: string;
  observationIds?: string[];
}
export interface CorrectionCase {
  id: string;
  placeId: string;
  field: Field | null;
  kind: CaseKind;
  description: string;
  /** First entry is always "received". Entries are never edited or removed. */
  history: CaseEvent[];
  /** "fixture" is a labelled sample and is left out of every published figure. */
  origin: "fixture" | "device";
}

/** Target calendar days for each stage, counted from the moment the stage starts. */
export interface ServiceLevels {
  triageDays: number;
  recheckStartDays: number;
  closeDays: number;
}
/** Proposed targets. They are configuration and not an operating commitment. */
export const DEFAULT_SERVICE_LEVELS: ServiceLevels = { triageDays: 5, recheckStartDays: 10, closeDays: 30 };

const DAY_MS = 86_400_000;
const CLOCK = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
export function isClock(value: unknown): value is string {
  return typeof value === "string" && CLOCK.test(value) && !Number.isNaN(Date.parse(value));
}

/** Milliseconds to the clock format used in case histories. */
export function toClock(ms: number): string {
  return new Date(ms).toISOString().replace(/\.\d+Z$/, "Z");
}

export function openCase(input: {
  id: string; placeId: string; field: Field | null; kind: CaseKind; description: string; at: string;
  actor?: CaseActor; origin?: "fixture" | "device";
}): CorrectionCase {
  if (!input.id.trim() || !input.placeId.trim() || !input.description.trim() || !isClock(input.at)) throw new Error("Invalid case");
  return {
    id: input.id, placeId: input.placeId, field: input.field, kind: input.kind, description: input.description.trim(),
    history: [{ state: "received", at: input.at, actor: input.actor ?? "reporter", note: "" }],
    origin: input.origin ?? "device",
  };
}

export function currentEvent(item: CorrectionCase): CaseEvent {
  const last = item.history[item.history.length - 1];
  if (!last) throw new Error("Case has no history");
  return last;
}
export function currentState(item: CorrectionCase): CaseState {
  return currentEvent(item).state;
}
export function isClosed(item: CorrectionCase): boolean {
  const state = currentState(item);
  return state === "resolved" || state === "declined";
}

const NEXT: Record<CaseState, readonly CaseState[]> = {
  received: ["triaged", "declined"],
  triaged: ["recheck", "declined"],
  recheck: ["resolved", "declined"],
  resolved: [],
  declined: [],
};
export function allowedTransitions(item: CorrectionCase): readonly CaseState[] {
  return NEXT[currentState(item)];
}

export interface TransitionInput {
  at: string;
  actor: CaseActor;
  note?: string;
  taskId?: string;
  observationIds?: string[];
}
/**
 * Moves a case one step. Declining needs a reason. Starting a re-check needs
 * the re-check task. Resolving needs the observations the re-check produced.
 */
export function transition(item: CorrectionCase, to: CaseState, input: TransitionInput): CorrectionCase {
  const from = currentEvent(item);
  if (!NEXT[from.state].includes(to)) throw new Error(`Cannot move from ${from.state} to ${to}`);
  if (!isClock(input.at) || Date.parse(input.at) < Date.parse(from.at)) throw new Error("Invalid time");
  const note = (input.note ?? "").trim();
  if (to === "declined" && !note) throw new Error("A reason is required to decline");
  if (to === "recheck" && !input.taskId?.trim()) throw new Error("A re-check task is required");
  const observationIds = (input.observationIds ?? []).filter((id) => id.trim());
  if (to === "resolved" && observationIds.length === 0) throw new Error("Re-check observations are required to resolve");
  const event: CaseEvent = {
    state: to, at: input.at, actor: input.actor, note,
    ...(to === "recheck" ? { taskId: input.taskId } : {}),
    ...(to === "resolved" ? { observationIds } : {}),
  };
  return { ...item, history: [...item.history, event] };
}

export type Stage = "triage" | "recheckStart" | "close";
export const STAGES: readonly Stage[] = ["triage", "recheckStart", "close"];
const STAGE_STATE: Record<Stage, CaseState> = { triage: "received", recheckStart: "triaged", close: "recheck" };
function targetDays(stage: Stage, levels: ServiceLevels): number {
  return stage === "triage" ? levels.triageDays : stage === "recheckStart" ? levels.recheckStartDays : levels.closeDays;
}

export interface StageTiming {
  stage: Stage;
  enteredAt: string;
  dueAt: string;
  /** Null while the case is still in this stage. */
  leftAt: string | null;
  /** Left the stage on or before the due time. */
  met: boolean;
  /** Left the stage after the due time. */
  missed: boolean;
  /** Still in the stage and past the due time. */
  overdue: boolean;
  days: number | null;
}

/** One entry per stage the case has entered, with its computed due time. */
export function stageTimings(item: CorrectionCase, levels: ServiceLevels, asOf: string): StageTiming[] {
  const now = Date.parse(asOf);
  const out: StageTiming[] = [];
  item.history.forEach((event, index) => {
    const stage = STAGES.find((name) => STAGE_STATE[name] === event.state);
    if (!stage) return;
    const entered = Date.parse(event.at);
    const due = entered + targetDays(stage, levels) * DAY_MS;
    const next = item.history[index + 1];
    const left = next ? Date.parse(next.at) : null;
    out.push({
      stage, enteredAt: event.at, dueAt: toClock(due), leftAt: next ? next.at : null,
      met: left !== null && left <= due, missed: left !== null && left > due,
      overdue: left === null && now > due, days: left === null ? null : (left - entered) / DAY_MS,
    });
  });
  return out;
}

/** Due time for the stage the case is in now. Null once the case is closed. */
export function dueAt(item: CorrectionCase, levels: ServiceLevels, asOf: string): string | null {
  const open = stageTimings(item, levels, asOf).find((timing) => timing.leftAt === null);
  return open ? open.dueAt : null;
}
export function isOverdue(item: CorrectionCase, levels: ServiceLevels, asOf: string): boolean {
  return stageTimings(item, levels, asOf).some((timing) => timing.overdue);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 === 1 ? (sorted[mid] as number) : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
  return Math.round(value * 10) / 10;
}

export interface StageSummary {
  stage: Stage;
  targetDays: number;
  completed: number;
  met: number;
  missed: number;
  inProgress: number;
  overdue: number;
  /** Null when no case has finished this stage. */
  medianDays: number | null;
}
export interface ServiceSummary {
  /** True when there is no workflow record to report on. Nothing is shown in place of data. */
  noData: boolean;
  asOf: string;
  total: number;
  open: number;
  resolved: number;
  declined: number;
  overdue: number;
  stages: StageSummary[];
  /** Received to closed, in days. Null when no case has closed. */
  medianDaysToClose: number | null;
}

/**
 * Service-level summary from workflow records. Sample cases are excluded, so a
 * device with no cases of its own reports "no data". Misses and overdue cases
 * are counted, never dropped.
 */
export function serviceSummary(cases: readonly CorrectionCase[], levels: ServiceLevels, asOf: string): ServiceSummary {
  if (!isClock(asOf)) throw new Error("Invalid time");
  const counted = cases.filter((item) => item.origin === "device");
  const timings = counted.map((item) => stageTimings(item, levels, asOf));
  const stages = STAGES.map((stage): StageSummary => {
    const rows = timings.flatMap((list) => list.filter((timing) => timing.stage === stage));
    const finished = rows.filter((row) => row.leftAt !== null);
    return {
      stage, targetDays: targetDays(stage, levels), completed: finished.length,
      met: finished.filter((row) => row.met).length, missed: finished.filter((row) => row.missed).length,
      inProgress: rows.length - finished.length, overdue: rows.filter((row) => row.overdue).length,
      medianDays: median(finished.map((row) => row.days as number)),
    };
  });
  const closed = counted.filter(isClosed);
  return {
    noData: counted.length === 0, asOf, total: counted.length, open: counted.length - closed.length,
    resolved: closed.filter((item) => currentState(item) === "resolved").length,
    declined: closed.filter((item) => currentState(item) === "declined").length,
    overdue: timings.filter((list) => list.some((timing) => timing.overdue)).length,
    stages,
    medianDaysToClose: median(
      closed.map((item) => (Date.parse(currentEvent(item).at) - Date.parse((item.history[0] as CaseEvent).at)) / DAY_MS),
    ),
  };
}
