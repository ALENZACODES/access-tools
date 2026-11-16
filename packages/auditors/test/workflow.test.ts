import { describe, expect, it } from "vitest";
import {
  DEFAULT_SERVICE_LEVELS, allowedTransitions, currentState, dueAt, isClosed, isOverdue, openCase, serviceSummary, stageTimings, transition,
} from "../src/workflow.js";
import type { CorrectionCase, ServiceLevels } from "../src/workflow.js";

const LEVELS: ServiceLevels = { triageDays: 5, recheckStartDays: 10, closeDays: 30 };
const at = (day: number, hour = 12) => new Date(Date.UTC(2026, 10, day, hour)).toISOString().replace(".000Z", "Z");
let n = 0;
function fresh(day: number, extra: Partial<Parameters<typeof openCase>[0]> = {}): CorrectionCase {
  n += 1;
  return openCase({ id: `c-${n}`, placeId: "demo-hall", field: "stepHeightMm", kind: "correction", description: "Test case", at: at(day), ...extra });
}
const triage = (item: CorrectionCase, day: number) => transition(item, "triaged", { at: at(day), actor: "coordinator" });
const recheck = (item: CorrectionCase, day: number) => transition(item, "recheck", { at: at(day), actor: "coordinator", taskId: "task-1" });
const resolve = (item: CorrectionCase, day: number) => transition(item, "resolved", { at: at(day), actor: "coordinator", observationIds: ["o-1"] });

describe("state machine", () => {
  it("starts at received and follows received, triaged, re-check, resolved", () => {
    const item = fresh(1);
    expect(currentState(item)).toBe("received");
    expect(allowedTransitions(item)).toEqual(["triaged", "declined"]);
    const done = resolve(recheck(triage(item, 2), 3), 4);
    expect(done.history.map((event) => event.state)).toEqual(["received", "triaged", "recheck", "resolved"]);
    expect(isClosed(done)).toBe(true);
    expect(allowedTransitions(done)).toEqual([]);
    expect(item.history).toHaveLength(1);
  });
  it("refuses skipped steps and any move out of a closed case", () => {
    const item = fresh(1);
    expect(() => recheck(item, 2)).toThrow();
    expect(() => resolve(item, 2)).toThrow();
    expect(() => resolve(triage(item, 2), 3)).toThrow();
    const declined = transition(item, "declined", { at: at(2), actor: "coordinator", note: "Out of scope" });
    expect(() => triage(declined, 3)).toThrow();
    expect(() => transition(resolve(recheck(triage(item, 2), 3), 4), "declined", { at: at(5), actor: "coordinator", note: "x" })).toThrow();
  });
  it("needs a reason to decline, a task to start a re-check and observations to resolve", () => {
    const item = fresh(1);
    expect(() => transition(item, "declined", { at: at(2), actor: "coordinator", note: "  " })).toThrow(/reason/);
    const triaged = triage(item, 2);
    expect(() => transition(triaged, "recheck", { at: at(3), actor: "coordinator" })).toThrow(/task/);
    const checking = recheck(triaged, 3);
    expect(() => transition(checking, "resolved", { at: at(4), actor: "coordinator", observationIds: [] })).toThrow(/observations/);
    expect(resolve(checking, 4).history[3]?.observationIds).toEqual(["o-1"]);
    expect(transition(checking, "declined", { at: at(4), actor: "coordinator", note: "Could not reach the place" }).history[3]?.note).toBe("Could not reach the place");
  });
  it("refuses a time before the previous step or a malformed time", () => {
    const item = fresh(5);
    expect(() => triage(item, 4)).toThrow(/time/);
    expect(() => transition(item, "triaged", { at: "2026-11-06", actor: "coordinator" })).toThrow(/time/);
    expect(() => openCase({ id: "x", placeId: "demo-hall", field: null, kind: "barrier", description: " ", at: at(1) })).toThrow();
  });
});

describe("due dates and overdue flags", () => {
  it("computes each due time from the stage start and the configured target", () => {
    const item = fresh(1);
    expect(dueAt(item, LEVELS, at(2))).toBe(at(6));
    expect(dueAt(item, { ...LEVELS, triageDays: 2 }, at(2))).toBe(at(3));
    const triaged = triage(item, 3);
    expect(dueAt(triaged, LEVELS, at(3))).toBe(at(13));
    const checking = recheck(triaged, 4);
    expect(dueAt(checking, LEVELS, at(4))).toBe(new Date(Date.UTC(2026, 11, 4, 12)).toISOString().replace(".000Z", "Z"));
    expect(dueAt(resolve(checking, 5), LEVELS, at(5))).toBeNull();
  });
  it("flags a case as overdue only after the due time and only while it is still waiting", () => {
    const item = fresh(1);
    expect(isOverdue(item, LEVELS, at(6))).toBe(false);
    expect(isOverdue(item, LEVELS, at(6, 13))).toBe(true);
    const late = triage(item, 8);
    expect(isOverdue(late, LEVELS, at(9))).toBe(false);
    expect(stageTimings(late, LEVELS, at(9))[0]).toMatchObject({ stage: "triage", met: false, missed: true, overdue: false, days: 7 });
    expect(stageTimings(triage(item, 6), LEVELS, at(9))[0]).toMatchObject({ met: true, missed: false });
  });
});

describe("published service-level summary", () => {
  it("reports no data, with no figures, when there are no records", () => {
    const empty = serviceSummary([], LEVELS, at(10));
    expect(empty.noData).toBe(true);
    expect(empty).toMatchObject({ total: 0, open: 0, resolved: 0, declined: 0, overdue: 0, medianDaysToClose: null });
    for (const stage of empty.stages) expect(stage).toMatchObject({ completed: 0, met: 0, missed: 0, inProgress: 0, overdue: 0, medianDays: null });
  });
  it("leaves sample cases out of every figure", () => {
    const sample = resolve(recheck(triage(fresh(1, { origin: "fixture" }), 2), 3), 4);
    expect(serviceSummary([sample], LEVELS, at(10)).noData).toBe(true);
  });
  it("counts exactly what the records show, including misses and overdue cases", () => {
    const onTime = resolve(recheck(triage(fresh(1), 2), 4), 10);       // triage 1 d, re-check start 2 d, close 6 d, total 9 d
    const lateTriage = triage(fresh(1), 9);                              // triage 8 d: missed; now waiting on re-check start
    const waiting = fresh(1);                                            // still received on day 20: overdue
    const declined = transition(fresh(10), "declined", { at: at(13), actor: "coordinator", note: "Duplicate" }); // triage 3 d, total 3 d
    const summary = serviceSummary([onTime, lateTriage, waiting, declined], LEVELS, at(20));
    expect(summary).toMatchObject({ noData: false, total: 4, open: 2, resolved: 1, declined: 1, overdue: 2, medianDaysToClose: 6 });
    const [triageStage, recheckStage, closeStage] = summary.stages;
    expect(triageStage).toEqual({ stage: "triage", targetDays: 5, completed: 3, met: 2, missed: 1, inProgress: 1, overdue: 1, medianDays: 3 });
    expect(recheckStage).toEqual({ stage: "recheckStart", targetDays: 10, completed: 1, met: 1, missed: 0, inProgress: 1, overdue: 1, medianDays: 2 });
    expect(closeStage).toEqual({ stage: "close", targetDays: 30, completed: 1, met: 1, missed: 0, inProgress: 0, overdue: 0, medianDays: 6 });
  });
  it("uses the targets it is given and has proposed defaults", () => {
    const item = triage(fresh(1), 4);
    expect(serviceSummary([item], { ...LEVELS, triageDays: 2 }, at(5)).stages[0]).toMatchObject({ targetDays: 2, met: 0, missed: 1 });
    expect(serviceSummary([item], LEVELS, at(5)).stages[0]).toMatchObject({ met: 1, missed: 0 });
    expect(DEFAULT_SERVICE_LEVELS).toEqual({ triageDays: 5, recheckStartDays: 10, closeDays: 30 });
    expect(() => serviceSummary([], LEVELS, "today")).toThrow();
  });
});
