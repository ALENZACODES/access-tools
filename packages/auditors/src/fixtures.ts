/**
 * Labelled fixtures. Nothing here is a real place, a real visit or a real
 * measurement. Dates are counted back from the day passed in, so the sample
 * always shows a current, an ageing and a stale field. Every item has origin
 * "fixture" and is excluded from progress counts and service-level figures.
 */
import type { Field } from "./model.js";
import type { FieldObservation } from "./observations.js";
import { createTask } from "./programme.js";
import type { AuditTask } from "./programme.js";
import type { ObserverRole } from "./tiers.js";
import { openCase, transition } from "./workflow.js";
import type { CorrectionCase } from "./workflow.js";

export const FIXTURE_PLACES = ["demo-hall", "demo-library"] as const;
export type FixturePlace = (typeof FIXTURE_PLACES)[number];
export const FIXTURE_SOURCE_NAME = "Labelled fixture (not a real place or visit)";
export const FIXTURE_LICENCE = "Fixture; no reuse grant";

const DAY_MS = 86_400_000;
export function dayBefore(today: string, days: number): string {
  return new Date(Date.parse(`${today}T00:00:00Z`) - days * DAY_MS).toISOString().slice(0, 10);
}
function clockBefore(today: string, days: number): string {
  return `${dayBefore(today, days)}T12:00:00Z`;
}

function sample(
  today: string, id: string, placeId: FixturePlace, field: Field, value: number | null,
  observerRole: ObserverRole, observerId: string, daysAgo: number, surveyed = false,
): FieldObservation {
  const observedOn = dayBefore(today, daysAgo);
  return {
    id, placeId, field, value, observerRole, observerId, observedOn,
    source: { sourceName: FIXTURE_SOURCE_NAME, sourceId: "fixture-auditors-1", licence: FIXTURE_LICENCE, recordDate: observedOn },
    origin: "fixture", label: "PROTOTYPE-UNVERIFIED",
    ...(surveyed
      ? {
          photo: { id: `photo-${id}`, localFilename: `${id}.jpg`, description: "Fixture photo reference; no image exists", takenOn: observedOn },
          method: "Fixture method: steel tape, narrowest point",
          protocolVersion: "fixture-protocol-1",
          review: { reviewerId: "fixture-reviewer-d", reviewedOn: observedOn, outcome: "accepted" as const },
        }
      : {}),
  };
}

export function fixtureObservations(today: string): FieldObservation[] {
  return [
    sample(today, "fx-door-a", "demo-hall", "doorClearWidthMm", 860, "peer", "fixture-observer-a", 20),
    sample(today, "fx-door-b", "demo-hall", "doorClearWidthMm", 865, "peer", "fixture-observer-b", 12),
    sample(today, "fx-step-c", "demo-hall", "stepHeightMm", 20, "trained_verifier", "fixture-observer-c", 40, true),
    sample(today, "fx-threshold-op", "demo-hall", "thresholdHeightMm", 13, "operator", "fixture-operator", 30),
    sample(today, "fx-ramp-a", "demo-hall", "rampWidthMm", 1100, "peer", "fixture-observer-a", 170),
    sample(today, "fx-turn-a", "demo-hall", "turningDiameterMm", 1500, "peer", "fixture-observer-a", 110),
    sample(today, "fx-turn-b", "demo-hall", "turningDiameterMm", 1505, "peer", "fixture-observer-b", 100),
    sample(today, "fx-lift-c", "demo-hall", "liftDoorWidthMm", 900, "trained_verifier", "fixture-observer-c", 400, true),
    sample(today, "fx-transfer-b", "demo-hall", "transferClearanceMm", null, "peer", "fixture-observer-b", 10),
    sample(today, "fx-lib-door-a", "demo-library", "doorClearWidthMm", 910, "peer", "fixture-observer-a", 15),
    sample(today, "fx-lib-door-op", "demo-library", "doorClearWidthMm", 950, "operator", "fixture-operator", 9),
  ];
}

export function fixtureTasks(today: string): AuditTask[] {
  return [
    createTask({ id: "fx-task-library", placeId: "demo-library", field: null, kind: "first-audit", createdOn: dayBefore(today, 6), origin: "fixture" }),
    createTask({ id: "fx-task-parking", placeId: "demo-hall", field: "parkingAisleWidthMm", kind: "first-audit", createdOn: dayBefore(today, 3), origin: "fixture" }),
    createTask({ id: "fx-task-recheck-c", placeId: "demo-hall", field: "rampWidthMm", kind: "re-check", createdOn: dayBefore(today, 30), caseId: "fx-case-ramp", origin: "fixture" }),
  ];
}

export function fixtureCases(today: string): CorrectionCase[] {
  const base = { origin: "fixture" as const };
  const step = openCase({ ...base, id: "fx-case-step", placeId: "demo-hall", field: "stepHeightMm", kind: "barrier", description: "Fixture report: a second step was added at the side entrance.", at: clockBefore(today, 2) });
  const door = transition(
    openCase({ ...base, id: "fx-case-door", placeId: "demo-hall", field: "doorClearWidthMm", kind: "barrier", description: "Fixture report: the main door does not open fully.", at: clockBefore(today, 9) }),
    "triaged", { at: clockBefore(today, 8), actor: "coordinator" },
  );
  const ramp = transition(
    transition(
      openCase({ ...base, id: "fx-case-ramp", placeId: "demo-hall", field: "rampWidthMm", kind: "correction", description: "Fixture correction: the ramp width on file looks too wide.", at: clockBefore(today, 50) }),
      "triaged", { at: clockBefore(today, 42), actor: "coordinator" },
    ),
    "recheck", { at: clockBefore(today, 40), actor: "coordinator", taskId: "fx-task-recheck-c" },
  );
  const late = openCase({ ...base, id: "fx-case-late", placeId: "demo-library", field: null, kind: "barrier", description: "Fixture report: the entrance route is blocked by stored furniture.", at: clockBefore(today, 12) });
  const declined = transition(
    openCase({ ...base, id: "fx-case-declined", placeId: "demo-library", field: null, kind: "correction", description: "Fixture correction: duplicate of an earlier sample report.", at: clockBefore(today, 20) }),
    "declined", { at: clockBefore(today, 18), actor: "coordinator", note: "Fixture reason: duplicate report." },
  );
  return [step, door, ramp, late, declined];
}
