/**
 * Volunteer auditor programme: a training checklist, an audit task queue and
 * plain progress counts. There are no points, ranks or standings. A count goes
 * up for a completed task and for a field recorded once; recording Unknown
 * counts the same as recording a measurement, and repeating an entry adds nothing.
 */
import type { Field } from "./model.js";
import type { FieldAssessment, FieldObservation } from "./observations.js";
import { isDay } from "./tiers.js";

export const TRAINING_STEPS = ["method", "tools", "unknown", "photos", "conflict", "practice"] as const;
export type TrainingStep = (typeof TRAINING_STEPS)[number];
/** Step id to the date it was ticked on this device. Self-declared; it is not a certificate. */
export interface TrainingState {
  completed: Partial<Record<TrainingStep, string>>;
}

export function blankTraining(): TrainingState {
  return { completed: {} };
}
export function setTrainingStep(state: TrainingState, step: TrainingStep, done: boolean, date: string): TrainingState {
  if (!TRAINING_STEPS.includes(step)) throw new Error("Unknown training step");
  if (done && !isDay(date)) throw new Error("Invalid date");
  const completed = { ...state.completed };
  if (done) completed[step] = completed[step] ?? date;
  else delete completed[step];
  return { completed };
}
export function trainingProgress(state: TrainingState): { done: number; total: number } {
  return { done: TRAINING_STEPS.filter((step) => isDay(state.completed[step])).length, total: TRAINING_STEPS.length };
}
export function trainingComplete(state: TrainingState): boolean {
  const progress = trainingProgress(state);
  return progress.done === progress.total;
}

export type TaskKind = "first-audit" | "re-check" | "freshness";
export type TaskStatus = "open" | "claimed" | "done" | "cancelled";
export interface AuditTask {
  id: string;
  placeId: string;
  /** Null means the whole place. */
  field: Field | null;
  kind: TaskKind;
  createdOn: string;
  status: TaskStatus;
  claimedBy?: string;
  claimedOn?: string;
  completedOn?: string;
  observationIds: string[];
  /** Correction case this task re-checks, when there is one. */
  caseId?: string;
  /** Venue response that asked for the re-check, when there is one. */
  responseId?: string;
  origin: "fixture" | "device";
}

export function createTask(input: {
  id: string; placeId: string; field: Field | null; kind: TaskKind; createdOn: string;
  caseId?: string; responseId?: string; origin?: "fixture" | "device";
}): AuditTask {
  if (!input.id.trim() || !input.placeId.trim() || !isDay(input.createdOn)) throw new Error("Invalid task");
  return {
    id: input.id, placeId: input.placeId, field: input.field, kind: input.kind, createdOn: input.createdOn,
    status: "open", observationIds: [], origin: input.origin ?? "device",
    ...(input.caseId ? { caseId: input.caseId } : {}),
    ...(input.responseId ? { responseId: input.responseId } : {}),
  };
}

/** Only an auditor who has finished every training step can take a task. */
export function claimTask(task: AuditTask, auditorId: string, training: TrainingState, date: string): AuditTask {
  if (task.status !== "open") throw new Error("Task is not open");
  if (!trainingComplete(training)) throw new Error("Training is not complete");
  if (!auditorId.trim() || !isDay(date)) throw new Error("Invalid claim");
  return { ...task, status: "claimed", claimedBy: auditorId, claimedOn: date };
}

export function releaseTask(task: AuditTask): AuditTask {
  if (task.status !== "claimed") throw new Error("Task is not claimed");
  const { claimedBy: _claimedBy, claimedOn: _claimedOn, ...rest } = task;
  return { ...rest, status: "open" };
}

/** Observations that can close a task: by the claimant, for the task's place and field, on or after the claim date. */
export function observationsForTask(task: AuditTask, observations: readonly FieldObservation[]): FieldObservation[] {
  if (task.status !== "claimed" || !task.claimedBy || !task.claimedOn) return [];
  return observations.filter(
    (o) =>
      o.placeId === task.placeId &&
      (task.field === null || o.field === task.field) &&
      o.observerId === task.claimedBy &&
      o.observedOn >= (task.claimedOn as string),
  );
}

/** A task closes only with at least one observation behind it. Recording Unknown is a valid result. */
export function completeTask(task: AuditTask, observations: readonly FieldObservation[], date: string): AuditTask {
  if (task.status !== "claimed") throw new Error("Task is not claimed");
  if (!isDay(date)) throw new Error("Invalid date");
  const evidence = observationsForTask(task, observations);
  if (evidence.length === 0) throw new Error("No observation recorded for this task");
  return { ...task, status: "done", completedOn: date, observationIds: evidence.map((o) => o.id) };
}

export function cancelTask(task: AuditTask): AuditTask {
  if (task.status === "done") throw new Error("Task is already done");
  return { ...task, status: "cancelled" };
}

const KIND_ORDER: Record<TaskKind, number> = { "re-check": 0, freshness: 1, "first-audit": 2 };
/** Open and claimed tasks. Re-checks first, then ageing records, then first audits; oldest first within each. */
export function taskQueue(tasks: readonly AuditTask[], placeId?: string): AuditTask[] {
  return tasks
    .filter((task) => (task.status === "open" || task.status === "claimed") && (placeId === undefined || task.placeId === placeId))
    .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.createdOn.localeCompare(b.createdOn) || a.id.localeCompare(b.id));
}

/** One freshness task per field that is ageing, stale or has dropped a tier, unless a task for it is already waiting. */
export function freshnessTasks(
  assessments: readonly FieldAssessment[],
  placeId: string,
  existing: readonly AuditTask[],
  today: string,
): AuditTask[] {
  const waiting = new Set(
    existing
      .filter((task) => task.placeId === placeId && (task.status === "open" || task.status === "claimed"))
      .map((task) => task.field),
  );
  return assessments
    .filter((a) => (a.freshness === "ageing" || a.freshness === "stale" || a.lapsedTier !== null) && !waiting.has(a.field))
    .map((a) => createTask({ id: `task-fresh-${placeId}-${a.field}-${today}`, placeId, field: a.field, kind: "freshness", createdOn: today }));
}

export interface Recognition {
  auditsCompleted: number;
  recheckCompleted: number;
  /** Distinct place, field and day combinations recorded for completed tasks. Rejected entries are left out. */
  fieldsRecorded: number;
  /** How many of those were recorded as Unknown. Shown so that honest Unknowns are visible, not penalised. */
  fieldsRecordedUnknown: number;
}

/** Progress for one auditor, from tasks completed on this device. Sample records are never counted. */
export function recognition(
  tasks: readonly AuditTask[],
  observations: readonly FieldObservation[],
  auditorId: string,
): Recognition {
  const done = tasks.filter((task) => task.status === "done" && task.claimedBy === auditorId && task.origin === "device");
  const ids = new Set(done.flatMap((task) => task.observationIds));
  const slots = new Map<string, boolean>();
  for (const o of observations) {
    if (!ids.has(o.id) || o.observerId !== auditorId || o.origin !== "device" || o.review?.outcome === "rejected") continue;
    const key = `${o.placeId}|${o.field}|${o.observedOn}`;
    slots.set(key, (slots.get(key) ?? true) && o.value === null);
  }
  return {
    auditsCompleted: done.length,
    recheckCompleted: done.filter((task) => task.kind === "re-check").length,
    fieldsRecorded: slots.size,
    fieldsRecordedUnknown: [...slots.values()].filter(Boolean).length,
  };
}
