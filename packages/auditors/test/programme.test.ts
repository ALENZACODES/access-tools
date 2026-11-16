import { describe, expect, it } from "vitest";
import { dayBefore } from "../src/fixtures.js";
import { assessPlace } from "../src/observations.js";
import type { FieldObservation } from "../src/observations.js";
import {
  TRAINING_STEPS, blankTraining, cancelTask, claimTask, completeTask, createTask, freshnessTasks, observationsForTask,
  recognition, releaseTask, setTrainingStep, taskQueue, trainingComplete, trainingProgress,
} from "../src/programme.js";

const TODAY = "2026-11-16";
const ME = "device-auditor";
const trained = TRAINING_STEPS.reduce((state, step) => setTrainingStep(state, step, true, TODAY), blankTraining());
let n = 0;
function obs(field: FieldObservation["field"], value: number | null, extra: Partial<FieldObservation> = {}): FieldObservation {
  n += 1;
  return {
    id: `o-${n}`, placeId: "demo-hall", field, value, observerRole: "trained_verifier", observerId: ME, observedOn: TODAY,
    source: { sourceName: "Test fixture", sourceId: "t", licence: "Fixture; no reuse grant", recordDate: TODAY },
    origin: "device", label: "PROTOTYPE-UNVERIFIED", ...extra,
  };
}
const task = (id: string, extra: Partial<Parameters<typeof createTask>[0]> = {}) =>
  createTask({ id, placeId: "demo-hall", field: "doorClearWidthMm", kind: "first-audit", createdOn: TODAY, ...extra });

describe("training checklist", () => {
  it("starts empty and is complete only when every step is ticked", () => {
    expect(trainingProgress(blankTraining())).toEqual({ done: 0, total: TRAINING_STEPS.length });
    const partial = setTrainingStep(blankTraining(), "method", true, TODAY);
    expect(trainingComplete(partial)).toBe(false);
    expect(trainingComplete(trained)).toBe(true);
    expect(trainingComplete(setTrainingStep(trained, "photos", false, TODAY))).toBe(false);
  });
  it("keeps the first completion date and rejects bad input", () => {
    const first = setTrainingStep(blankTraining(), "method", true, "2026-11-01");
    expect(setTrainingStep(first, "method", true, TODAY).completed.method).toBe("2026-11-01");
    expect(() => setTrainingStep(first, "method", true, "soon")).toThrow();
    expect(() => setTrainingStep(first, "other" as "method", true, TODAY)).toThrow();
  });
});

describe("audit task queue", () => {
  it("lets only a fully trained auditor claim an open task", () => {
    expect(() => claimTask(task("t1"), ME, blankTraining(), TODAY)).toThrow(/Training/);
    const claimed = claimTask(task("t1"), ME, trained, TODAY);
    expect(claimed).toMatchObject({ status: "claimed", claimedBy: ME, claimedOn: TODAY });
    expect(() => claimTask(claimed, "someone-else", trained, TODAY)).toThrow(/not open/);
    expect(releaseTask(claimed)).toEqual(task("t1"));
  });
  it("closes a task only with an observation by the claimant for that place and field", () => {
    const claimed = claimTask(task("t1"), ME, trained, TODAY);
    expect(() => completeTask(claimed, [], TODAY)).toThrow(/No observation/);
    const wrong = [
      obs("stepHeightMm", 20), obs("doorClearWidthMm", 850, { observerId: "other" }),
      obs("doorClearWidthMm", 850, { placeId: "demo-library" }), obs("doorClearWidthMm", 850, { observedOn: dayBefore(TODAY, 1) }),
    ];
    expect(observationsForTask(claimed, wrong)).toEqual([]);
    const unknown = obs("doorClearWidthMm", null);
    const done = completeTask(claimed, [...wrong, unknown], TODAY);
    expect(done).toMatchObject({ status: "done", completedOn: TODAY, observationIds: [unknown.id] });
    expect(() => completeTask(task("t2"), [unknown], TODAY)).toThrow(/not claimed/);
    expect(() => cancelTask(done)).toThrow();
    expect(cancelTask(task("t3")).status).toBe("cancelled");
  });
  it("orders re-checks first, then ageing fields, then first audits, oldest first", () => {
    const list = [
      task("first-new"), task("first-old", { createdOn: dayBefore(TODAY, 5) }),
      task("fresh", { kind: "freshness" }), task("recheck", { kind: "re-check" }),
      cancelTask(task("gone", { kind: "re-check" })), task("elsewhere", { placeId: "demo-library", kind: "re-check" }),
    ];
    expect(taskQueue(list, "demo-hall").map((item) => item.id)).toEqual(["recheck", "fresh", "first-old", "first-new"]);
    expect(taskQueue(list)).toHaveLength(5);
  });
  it("raises one freshness task per ageing or stale field and does not duplicate a waiting one", () => {
    const old = obs("doorClearWidthMm", 850, { observedOn: dayBefore(TODAY, 400), observerId: "a", origin: "fixture" });
    const ageing = obs("stepHeightMm", 20, { observedOn: dayBefore(TODAY, 170), observerId: "a", origin: "fixture" });
    const current = obs("rampWidthMm", 1000, { observedOn: dayBefore(TODAY, 5), observerId: "a", origin: "fixture" });
    const assessments = assessPlace([old, ageing, current], "demo-hall", TODAY);
    const made = freshnessTasks(assessments, "demo-hall", [], TODAY);
    expect(made.map((item) => item.field).sort()).toEqual(["doorClearWidthMm", "stepHeightMm"]);
    expect(made.every((item) => item.kind === "freshness" && item.status === "open")).toBe(true);
    expect(freshnessTasks(assessments, "demo-hall", made, TODAY)).toEqual([]);
  });
});

describe("progress recognition", () => {
  function finish(id: string, list: FieldObservation[], extra: Partial<Parameters<typeof createTask>[0]> = {}) {
    return completeTask(claimTask(task(id, extra), ME, trained, TODAY), list, TODAY);
  }
  it("is all zero with no completed work", () => {
    expect(recognition([], [], ME)).toEqual({ auditsCompleted: 0, recheckCompleted: 0, fieldsRecorded: 0, fieldsRecordedUnknown: 0 });
    expect(recognition([task("open")], [obs("doorClearWidthMm", 850)], ME).fieldsRecorded).toBe(0);
  });
  it("counts an honest Unknown the same as a measurement", () => {
    const a = obs("doorClearWidthMm", 850);
    const b = obs("stepHeightMm", null);
    const tasks = [finish("t1", [a]), finish("t2", [b], { field: "stepHeightMm", kind: "re-check" })];
    expect(recognition(tasks, [a, b], ME)).toEqual({ auditsCompleted: 2, recheckCompleted: 1, fieldsRecorded: 2, fieldsRecordedUnknown: 1 });
  });
  it("gives nothing extra for repeating the same field on the same day", () => {
    const repeats = [obs("doorClearWidthMm", 850), obs("doorClearWidthMm", 851), obs("doorClearWidthMm", 852)];
    const done = finish("t1", repeats);
    expect(done.observationIds).toHaveLength(3);
    expect(recognition([done], repeats, ME).fieldsRecorded).toBe(1);
  });
  it("leaves out rejected entries, other people's work and sample records", () => {
    const rejected = obs("doorClearWidthMm", 850, { review: { reviewerId: "z", reviewedOn: TODAY, outcome: "rejected" } });
    const done = finish("t1", [rejected]);
    expect(recognition([done], [rejected], ME)).toMatchObject({ auditsCompleted: 1, fieldsRecorded: 0 });
    expect(recognition([done], [rejected], "someone-else").auditsCompleted).toBe(0);
    const good = obs("doorClearWidthMm", 850);
    const sample = finish("t2", [good], { origin: "fixture" });
    expect(recognition([sample], [good], ME)).toMatchObject({ auditsCompleted: 0, fieldsRecorded: 0 });
  });
  it("exposes counts only: no points, rank, score or standings", () => {
    expect(Object.keys(recognition([], [], ME)).sort()).toEqual(["auditsCompleted", "fieldsRecorded", "fieldsRecordedUnknown", "recheckCompleted"]);
  });
});
