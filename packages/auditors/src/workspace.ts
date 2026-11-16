/**
 * Everything the audit screens keep, in one value that lives in this browser's
 * local storage. Nothing is sent anywhere.
 */
import { FIELDS } from "./model.js";
import { fixtureCases, fixtureObservations, fixtureTasks } from "./fixtures.js";
import { isObservation } from "./observations.js";
import type { FieldObservation } from "./observations.js";
import { TRAINING_STEPS, blankTraining } from "./programme.js";
import type { AuditTask, TrainingState } from "./programme.js";
import { isDay } from "./tiers.js";
import type { VenueResponse } from "./venue.js";
import { CASE_STATES, isClock } from "./workflow.js";
import type { CorrectionCase } from "./workflow.js";

/** Local identifier for the person using this device. It is not a name and is the same on every device. */
export const DEVICE_AUDITOR = "device-auditor";
export const WORKSPACE_KEY = "access-auditors-workspace-v1";

export interface Workspace {
  version: 1;
  training: TrainingState;
  observations: FieldObservation[];
  tasks: AuditTask[];
  cases: CorrectionCase[];
  responses: VenueResponse[];
}

/** A new workspace: labelled fixtures, no training ticked, no records of the user's own. */
export function seedWorkspace(today: string): Workspace {
  return {
    version: 1, training: blankTraining(), observations: fixtureObservations(today),
    tasks: fixtureTasks(today), cases: fixtureCases(today), responses: [],
  };
}

type Loose = Record<string, unknown>;
const obj = (value: unknown): value is Loose => value !== null && typeof value === "object" && !Array.isArray(value);
const str = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const origin = (value: unknown) => value === "fixture" || value === "device";
const fieldOrNull = (value: unknown) => value === null || (FIELDS as readonly unknown[]).includes(value);
const unique = (items: Loose[]) => new Set(items.map((item) => item.id)).size === items.length;

function isTask(value: unknown): boolean {
  return obj(value) && str(value.id) && str(value.placeId) && fieldOrNull(value.field) &&
    ["first-audit", "re-check", "freshness"].includes(value.kind as string) && isDay(value.createdOn) &&
    ["open", "claimed", "done", "cancelled"].includes(value.status as string) &&
    Array.isArray(value.observationIds) && value.observationIds.every(str) && origin(value.origin) &&
    (value.status !== "claimed" || (str(value.claimedBy) && isDay(value.claimedOn))) &&
    (value.status !== "done" || (isDay(value.completedOn) && value.observationIds.length > 0));
}
function isCase(value: unknown): boolean {
  if (!obj(value) || !str(value.id) || !str(value.placeId) || !fieldOrNull(value.field) || !str(value.description)) return false;
  if ((value.kind !== "correction" && value.kind !== "barrier") || !origin(value.origin)) return false;
  const history = value.history;
  if (!Array.isArray(history) || history.length === 0 || !history.every(obj)) return false;
  return history.every((event, index) =>
    (CASE_STATES as readonly unknown[]).includes(event.state) && isClock(event.at) && str(event.actor) &&
    typeof event.note === "string" && (index === 0 ? event.state === "received" : event.state !== "received") &&
    (index === 0 || (event.at as string) >= ((history[index - 1] as Loose).at as string)));
}
function isResponse(value: unknown): boolean {
  return obj(value) && str(value.id) && str(value.caseId) && str(value.placeId) && isClock(value.at) && origin(value.origin) &&
    (value.kind === "acknowledge" || (value.kind === "fixed" && isDay(value.fixedOn)) || (value.kind === "dispute" && str(value.reason)));
}

export function isWorkspace(input: unknown, today: string): input is Workspace {
  if (!obj(input) || input.version !== 1) return false;
  const { training, observations, tasks, cases, responses } = input;
  if (!obj(training) || !obj(training.completed)) return false;
  if (!Object.entries(training.completed).every(([step, date]) => (TRAINING_STEPS as readonly string[]).includes(step) && isDay(date))) return false;
  if (![observations, tasks, cases, responses].every(Array.isArray)) return false;
  return (observations as unknown[]).every((item) => isObservation(item, today)) && unique(observations as Loose[]) &&
    (tasks as unknown[]).every(isTask) && unique(tasks as Loose[]) &&
    (cases as unknown[]).every(isCase) && unique(cases as Loose[]) &&
    (responses as unknown[]).every(isResponse) && unique(responses as Loose[]);
}

type Store = Pick<Storage, "getItem" | "setItem">;
/** Reads the saved workspace. Missing, unreadable or malformed data gives a fresh seed; nothing is repaired by guessing. */
export function loadWorkspace(store: Store | null, today: string): Workspace {
  try {
    const raw = store?.getItem(WORKSPACE_KEY);
    if (raw) {
      const value: unknown = JSON.parse(raw);
      if (isWorkspace(value, today)) return value;
    }
  } catch { /* Storage unavailable or corrupt: start again from the labelled fixtures. */ }
  return seedWorkspace(today);
}
export function saveWorkspace(store: Store | null, workspace: Workspace): boolean {
  try {
    store?.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
    return store !== null;
  } catch {
    return false;
  }
}
