import { describe, expect, it } from "vitest";
import { FIXTURE_PLACES, fixtureCases, fixtureObservations, fixtureTasks } from "../src/fixtures.js";
import { assessField, assessPlace, observationProblems } from "../src/observations.js";
import { recognition } from "../src/programme.js";
import { DEFAULT_SERVICE_LEVELS, isOverdue, serviceSummary } from "../src/workflow.js";
import { DEVICE_AUDITOR, WORKSPACE_KEY, isWorkspace, loadWorkspace, saveWorkspace, seedWorkspace } from "../src/workspace.js";

const TODAY = "2026-11-16";
const NOW = "2026-11-16T15:00:00Z";

describe("labelled fixtures", () => {
  it("are all marked as fixtures, unverified, on demonstration places, with source, licence and date", () => {
    for (const o of fixtureObservations(TODAY)) {
      expect(observationProblems(o, TODAY)).toEqual([]);
      expect(o.origin).toBe("fixture");
      expect(o.label).toBe("PROTOTYPE-UNVERIFIED");
      expect(FIXTURE_PLACES).toContain(o.placeId);
      expect(o.source.sourceName).toMatch(/fixture/i);
      expect(o.source.licence).toMatch(/fixture/i);
      expect(o.observerId).toMatch(/^fixture-/);
    }
    for (const item of [...fixtureTasks(TODAY), ...fixtureCases(TODAY)]) expect(item.origin).toBe("fixture");
    for (const item of fixtureCases(TODAY)) expect(item.description).toMatch(/^Fixture/);
  });
  it("show each rule outcome on the sample place whatever day it is", () => {
    for (const today of [TODAY, "2027-03-01"]) {
      const list = fixtureObservations(today);
      const hall = Object.fromEntries(assessPlace(list, "demo-hall", today).map((a) => [a.field, a]));
      expect(hall.doorClearWidthMm).toMatchObject({ tier: 2, freshness: "current" });
      expect(hall.stepHeightMm).toMatchObject({ tier: 3, freshness: "current" });
      expect(hall.thresholdHeightMm).toMatchObject({ tier: 1, basis: "single" });
      expect(hall.rampWidthMm).toMatchObject({ tier: 1, freshness: "ageing" });
      expect(hall.turningDiameterMm).toMatchObject({ tier: 1, lapsedTier: 2 });
      expect(hall.liftDoorWidthMm).toMatchObject({ tier: 0, freshness: "stale", lapsedTier: 3, value: 900 });
      expect(hall.transferClearanceMm).toMatchObject({ tier: 0, value: null, basis: "unknown-recorded" });
      expect(hall.parkingAisleWidthMm).toMatchObject({ tier: 0, value: null, basis: "none" });
      expect(assessField(list, "demo-library", "doorClearWidthMm", today)).toMatchObject({ tier: 1, contested: true });
    }
  });
  it("include an overdue sample case but feed no published figure or progress count", () => {
    const seed = seedWorkspace(TODAY);
    expect(seed.cases.some((item) => isOverdue(item, DEFAULT_SERVICE_LEVELS, NOW))).toBe(true);
    expect(serviceSummary(seed.cases, DEFAULT_SERVICE_LEVELS, NOW).noData).toBe(true);
    expect(recognition(seed.tasks, seed.observations, DEVICE_AUDITOR)).toEqual({ auditsCompleted: 0, recheckCompleted: 0, fieldsRecorded: 0, fieldsRecordedUnknown: 0 });
  });
});

describe("workspace storage", () => {
  function memory(initial?: string) {
    const data = new Map<string, string>(initial === undefined ? [] : [[WORKSPACE_KEY, initial]]);
    return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
  }
  it("round-trips through storage", () => {
    const store = memory();
    const seed = seedWorkspace(TODAY);
    expect(isWorkspace(seed, TODAY)).toBe(true);
    expect(saveWorkspace(store, seed)).toBe(true);
    expect(loadWorkspace(store, TODAY)).toEqual(seed);
  });
  it("falls back to the labelled seed for missing, corrupt or tampered data", () => {
    const seed = seedWorkspace(TODAY);
    expect(loadWorkspace(null, TODAY)).toEqual(seed);
    expect(saveWorkspace(null, seed)).toBe(false);
    expect(loadWorkspace(memory("{not json"), TODAY)).toEqual(seed);
    const tampered = [
      { ...seed, version: 2 },
      { ...seed, observations: [{ ...seed.observations[0], label: "VERIFIED" }] },
      { ...seed, observations: [seed.observations[0], seed.observations[0]] },
      { ...seed, tasks: [{ ...seed.tasks[0], status: "done" }] },
      { ...seed, cases: [{ ...seed.cases[0], history: [] }] },
      { ...seed, cases: [{ ...seed.cases[0], history: [{ state: "resolved", at: NOW, actor: "coordinator", note: "" }] }] },
      { ...seed, responses: [{ id: "r", caseId: "c", placeId: "demo-hall", kind: "fixed", at: NOW, origin: "device" }] },
      { ...seed, training: { completed: { method: "yesterday" } } },
    ];
    for (const bad of tampered) {
      expect(isWorkspace(bad, TODAY)).toBe(false);
      expect(loadWorkspace(memory(JSON.stringify(bad)), TODAY)).toEqual(seed);
    }
    expect(loadWorkspace({ getItem: () => { throw new Error("blocked"); }, setItem: () => undefined }, TODAY)).toEqual(seed);
  });
});
