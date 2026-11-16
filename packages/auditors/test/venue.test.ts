import { describe, expect, it } from "vitest";
import { fixtureCases, fixtureObservations, fixtureTasks } from "../src/fixtures.js";
import { assessPlace } from "../src/observations.js";
import { TRAINING_STEPS, blankTraining, claimTask, completeTask, setTrainingStep } from "../src/programme.js";
import type { AuditTask } from "../src/programme.js";
import { barrierStatus, barriersForPlace, respondToBarrier, responseProblems } from "../src/venue.js";
import { currentState, transition } from "../src/workflow.js";

const TODAY = "2026-11-16";
const NOW = "2026-11-16T15:00:00Z";
const cases = fixtureCases(TODAY);
const step = cases.find((item) => item.id === "fx-case-step")!;
const ramp = cases.find((item) => item.id === "fx-case-ramp")!;
const input = { id: "r-1", placeId: "demo-hall", at: NOW };

describe("venue view", () => {
  it("shows a venue only the barrier reports for its own place", () => {
    expect(barriersForPlace(cases, "demo-hall").map((item) => item.id)).toEqual(["fx-case-step", "fx-case-door"]);
    expect(barriersForPlace(cases, "demo-library").map((item) => item.id)).toEqual(["fx-case-late"]);
    expect(barriersForPlace(cases, "demo-elsewhere")).toEqual([]);
  });
});

describe("venue responses", () => {
  it("acknowledges without creating any task", () => {
    const result = respondToBarrier(step, [], { ...input, kind: "acknowledge" });
    expect(result).toMatchObject({ recheckTaskId: null, newTask: null });
    expect(barrierStatus(step, [result.response], [])).toBe("acknowledged");
  });
  it("requires a real, non-future date for a fix and a reason for a dispute", () => {
    expect(responseProblems(step, { ...input, kind: "fixed" })).toEqual(["fixed-date"]);
    expect(responseProblems(step, { ...input, kind: "fixed", fixedOn: "2026-13-01" })).toEqual(["fixed-date"]);
    expect(responseProblems(step, { ...input, kind: "fixed", fixedOn: "2026-11-17" })).toEqual(["fixed-date-in-future"]);
    expect(responseProblems(step, { ...input, kind: "dispute", reason: "  " })).toEqual(["reason"]);
    expect(() => respondToBarrier(step, [], { ...input, kind: "dispute" })).toThrow(/reason/);
    expect(responseProblems(step, { ...input, kind: "fixed", fixedOn: "2026-11-15" })).toEqual([]);
  });
  it("refuses a response for another place, a non-barrier case or a closed case", () => {
    expect(responseProblems(step, { ...input, placeId: "demo-library", kind: "acknowledge" })).toEqual(["wrong-place"]);
    expect(responseProblems(ramp, { ...input, kind: "acknowledge" })).toEqual(["not-a-barrier"]);
    const closed = transition(step, "declined", { at: NOW, actor: "coordinator", note: "Test" });
    expect(responseProblems(closed, { ...input, kind: "acknowledge" })).toEqual(["closed"]);
  });
  it.each(["fixed", "dispute"] as const)("%s creates a pending re-check task and changes nothing in the record", (kind) => {
    const observations = fixtureObservations(TODAY);
    const snapshot = JSON.stringify(observations);
    const before = assessPlace(observations, "demo-hall", TODAY);
    const result = respondToBarrier(step, fixtureTasks(TODAY), { ...input, kind, fixedOn: "2026-11-15", reason: "The step is a delivery kerb, not the entrance." });
    expect(result.newTask).toMatchObject({ kind: "re-check", status: "open", placeId: "demo-hall", field: "stepHeightMm", caseId: step.id, responseId: "r-1", observationIds: [] });
    expect(result.recheckTaskId).toBe(result.newTask?.id);
    expect(JSON.stringify(observations)).toBe(snapshot);
    expect(assessPlace(observations, "demo-hall", TODAY)).toEqual(before);
    expect(currentState(step)).toBe("received");
    expect(barrierStatus(step, [result.response], [result.newTask as AuditTask])).toBe(kind === "fixed" ? "fix-awaiting-recheck" : "dispute-awaiting-recheck");
    expect(result.response.fixedOn).toBe(kind === "fixed" ? "2026-11-15" : undefined);
    expect(result.response.reason).toBe(kind === "dispute" ? "The step is a delivery kerb, not the entrance." : undefined);
  });
  it("reuses a re-check that is already waiting for the same case", () => {
    const first = respondToBarrier(step, [], { ...input, kind: "dispute", reason: "Not ours" });
    const second = respondToBarrier(step, [first.newTask as AuditTask], { ...input, id: "r-2", kind: "fixed", fixedOn: TODAY });
    expect(second.newTask).toBeNull();
    expect(second.recheckTaskId).toBe(first.recheckTaskId);
  });
  it("moves to rechecked only when the re-check task is done with an observation", () => {
    const first = respondToBarrier(step, [], { ...input, kind: "fixed", fixedOn: TODAY });
    const trained = TRAINING_STEPS.reduce((state, id) => setTrainingStep(state, id, true, TODAY), blankTraining());
    const claimed = claimTask(first.newTask as AuditTask, "device-auditor", trained, TODAY);
    expect(barrierStatus(step, [first.response], [claimed])).toBe("fix-awaiting-recheck");
    const observation = { ...fixtureObservations(TODAY)[2]!, id: "o-new", observerId: "device-auditor", observedOn: TODAY, origin: "device" as const, review: undefined };
    const done = completeTask(claimed, [observation], TODAY);
    expect(barrierStatus(step, [first.response], [done])).toBe("rechecked");
    expect(barrierStatus(step, [], [])).toBe("reported");
  });
});
