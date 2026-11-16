/**
 * Venue-owner fix-it workflow. A venue sees the barriers reported for its
 * place and can acknowledge, report a fix with its date, or dispute with a
 * reason. A response is a statement by the venue. It never edits an
 * observation or a tier: "fixed" and "dispute" only create a pending re-check
 * task, and the record changes when a re-check observation is recorded.
 */
import { createTask } from "./programme.js";
import type { AuditTask } from "./programme.js";
import { isDay } from "./tiers.js";
import { currentState, isClock, isClosed } from "./workflow.js";
import type { CorrectionCase } from "./workflow.js";

export type ResponseKind = "acknowledge" | "fixed" | "dispute";
export interface VenueResponse {
  id: string;
  caseId: string;
  placeId: string;
  kind: ResponseKind;
  at: string;
  /** Required for "fixed": the day the venue says the work was done. */
  fixedOn?: string;
  /** Required for "dispute". */
  reason?: string;
  origin: "fixture" | "device";
}

export type ResponseProblem = "not-a-barrier" | "wrong-place" | "closed" | "time" | "fixed-date" | "fixed-date-in-future" | "reason";

export interface ResponseInput {
  id: string;
  placeId: string;
  kind: ResponseKind;
  at: string;
  fixedOn?: string;
  reason?: string;
}

/** Barrier reports for one place, newest first. A venue never sees another place's reports. */
export function barriersForPlace(cases: readonly CorrectionCase[], placeId: string): CorrectionCase[] {
  return cases
    .filter((item) => item.kind === "barrier" && item.placeId === placeId)
    .sort((a, b) => (b.history[0]?.at ?? "").localeCompare(a.history[0]?.at ?? "") || a.id.localeCompare(b.id));
}

export function responseProblems(item: CorrectionCase, input: ResponseInput): ResponseProblem[] {
  const out: ResponseProblem[] = [];
  if (item.kind !== "barrier") out.push("not-a-barrier");
  if (item.placeId !== input.placeId) out.push("wrong-place");
  if (isClosed(item)) out.push("closed");
  if (!isClock(input.at)) out.push("time");
  if (input.kind === "fixed") {
    if (!isDay(input.fixedOn)) out.push("fixed-date");
    else if (isClock(input.at) && input.fixedOn > input.at.slice(0, 10)) out.push("fixed-date-in-future");
  }
  if (input.kind === "dispute" && !(input.reason ?? "").trim()) out.push("reason");
  return out;
}

export interface ResponseResult {
  response: VenueResponse;
  /** The re-check task this response is waiting on. Null for an acknowledgement. */
  recheckTaskId: string | null;
  /** A task to add to the queue, when one was not already waiting for this case. */
  newTask: AuditTask | null;
}

/**
 * Records a venue response. The observations are not an input, so a response
 * cannot change the record. "fixed" and "dispute" return a pending re-check
 * task, reusing one already waiting for the same case.
 */
export function respondToBarrier(item: CorrectionCase, tasks: readonly AuditTask[], input: ResponseInput): ResponseResult {
  const problems = responseProblems(item, input);
  if (problems.length > 0) throw new Error(`Invalid response: ${problems.join(", ")}`);
  if (!input.id.trim()) throw new Error("Invalid response: id");
  const response: VenueResponse = {
    id: input.id, caseId: item.id, placeId: item.placeId, kind: input.kind, at: input.at, origin: "device",
    ...(input.kind === "fixed" ? { fixedOn: input.fixedOn } : {}),
    ...(input.kind === "dispute" ? { reason: (input.reason ?? "").trim() } : {}),
  };
  if (input.kind === "acknowledge") return { response, recheckTaskId: null, newTask: null };
  const waiting = tasks.find(
    (task) => task.caseId === item.id && task.kind === "re-check" && (task.status === "open" || task.status === "claimed"),
  );
  if (waiting) return { response, recheckTaskId: waiting.id, newTask: null };
  const newTask = createTask({
    id: `task-recheck-${input.id}`, placeId: item.placeId, field: item.field, kind: "re-check",
    createdOn: input.at.slice(0, 10), caseId: item.id, responseId: input.id,
  });
  return { response, recheckTaskId: newTask.id, newTask };
}

export type BarrierStatus =
  | "reported" | "acknowledged" | "fix-awaiting-recheck" | "dispute-awaiting-recheck" | "rechecked" | "resolved" | "declined";

/** Where a barrier report stands for the venue, from its case, responses and re-check tasks. */
export function barrierStatus(
  item: CorrectionCase,
  responses: readonly VenueResponse[],
  tasks: readonly AuditTask[],
): BarrierStatus {
  const state = currentState(item);
  if (state === "resolved" || state === "declined") return state;
  const mine = responses.filter((response) => response.caseId === item.id).sort((a, b) => a.at.localeCompare(b.at));
  const claim = [...mine].reverse().find((response) => response.kind !== "acknowledge");
  if (claim) {
    const pending = tasks.some(
      (task) => task.caseId === item.id && task.kind === "re-check" && (task.status === "open" || task.status === "claimed"),
    );
    if (pending) return claim.kind === "fixed" ? "fix-awaiting-recheck" : "dispute-awaiting-recheck";
    if (tasks.some((task) => task.caseId === item.id && task.kind === "re-check" && task.status === "done")) return "rechecked";
  }
  return mine.length > 0 ? "acknowledged" : "reported";
}
