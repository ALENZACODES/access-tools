import { describe, expect, it } from "vitest";
import { VERIFICATION_TIERS, VERIFIER_ROLES } from "../../place/src/types.js";
import { limitDays } from "../../place/src/staleness.js";
import { dayBefore } from "../src/fixtures.js";
import { DEFAULT_TIER_RULES, assessField, assessPlace, isObservation, observationCeiling, observationProblems } from "../src/observations.js";
import type { FieldObservation } from "../src/observations.js";
import { AUDIT_TIERS, OBSERVER_ROLES, windowDays } from "../src/tiers.js";
import type { ObserverRole } from "../src/tiers.js";

const TODAY = "2026-11-16";
const PLACE = "demo-hall";
let counter = 0;
function obs(value: number | null, daysAgo: number, observerId: string, extra: Partial<FieldObservation> = {}): FieldObservation {
  const observedOn = dayBefore(TODAY, daysAgo);
  counter += 1;
  return {
    id: `o-${counter}`, placeId: PLACE, field: "doorClearWidthMm", value, observerRole: "peer" as ObserverRole, observerId, observedOn,
    source: { sourceName: "Test fixture", sourceId: "test-1", licence: "Fixture; no reuse grant", recordDate: observedOn },
    origin: "fixture", label: "PROTOTYPE-UNVERIFIED", ...extra,
  };
}
function surveyed(value: number, daysAgo: number, observerId: string, extra: Partial<FieldObservation> = {}): FieldObservation {
  const observedOn = dayBefore(TODAY, daysAgo);
  return obs(value, daysAgo, observerId, {
    observerRole: "trained_verifier",
    photo: { id: "p-1", localFilename: "door.jpg", description: "Tape across the door frame", takenOn: observedOn },
    method: "Steel tape, narrowest point", protocolVersion: "test-protocol-1",
    review: { reviewerId: "reviewer-z", reviewedOn: observedOn, outcome: "accepted" },
    ...extra,
  });
}
const door = (list: FieldObservation[], today = TODAY) => assessField(list, PLACE, "doorClearWidthMm", today);

describe("tier vocabulary", () => {
  it("is taken from the canonical list and adds nothing to it", () => {
    for (const tier of AUDIT_TIERS) expect(VERIFICATION_TIERS).toContain(tier);
    for (const role of OBSERVER_ROLES) expect(VERIFIER_ROLES).toContain(role);
    expect(AUDIT_TIERS).toEqual([0, 1, 2, 3]);
    expect(windowDays(3, "doorClearWidthMm")).toBe(limitDays(3, "venue"));
    expect(windowDays(2, "turningDiameterMm")).toBe(limitDays(2, "washroom"));
    expect(windowDays(0, "doorClearWidthMm")).toBeNull();
  });
});

describe("observation record", () => {
  it("accepts Unknown and a photo reference that is metadata only", () => {
    expect(observationProblems(obs(null, 1, "a"), TODAY)).toEqual([]);
    expect(isObservation(surveyed(850, 1, "a"), TODAY)).toBe(true);
    expect(Object.keys(surveyed(850, 1, "a").photo ?? {}).sort()).toEqual(["description", "id", "localFilename", "takenOn"]);
  });
  it("rejects malformed entries, paths in file names, future dates and self-review", () => {
    expect(observationProblems(obs(-1, 1, "a"), TODAY)).toContain("value");
    expect(observationProblems(obs(Number.NaN, 1, "a"), TODAY)).toContain("value");
    expect(observationProblems(obs(800, -1, "a"), TODAY)).toContain("observed-in-future");
    expect(observationProblems(obs(800, 1, "a", { observedOn: "2026-02-30" }), TODAY)).toContain("observed-on");
    expect(observationProblems(obs(800, 1, "a", { observerRole: "importer" as ObserverRole }), TODAY)).toContain("role");
    expect(observationProblems(surveyed(800, 1, "a", { photo: { id: "p", localFilename: "../x.jpg", description: "d", takenOn: TODAY } }), TODAY)).toContain("photo-filename");
    expect(observationProblems(surveyed(800, 1, "a", { review: { reviewerId: "a", reviewedOn: TODAY, outcome: "accepted" } }), TODAY)).toContain("self-review");
    expect(observationProblems(surveyed(800, 1, "a", { review: { reviewerId: "z", reviewedOn: dayBefore(TODAY, 5), outcome: "accepted" } }), TODAY)).toContain("review-before-observation");
    expect(observationProblems(obs(800, 1, "a", { source: { sourceName: "", sourceId: "x", licence: "y", recordDate: TODAY } }), TODAY)).toContain("source");
    expect(observationProblems(obs(800, 1, "a", { label: "VERIFIED" as "PROTOTYPE-UNVERIFIED" }), TODAY)).toContain("label");
    expect(isObservation(null, TODAY)).toBe(false);
    expect(isObservation({ id: "x" }, TODAY)).toBe(false);
  });
});

describe("tier rules", () => {
  it("leaves a field with no observation Unknown at tier 0", () => {
    expect(door([])).toMatchObject({ value: null, tier: 0, basis: "none", freshness: "no-observation", needsRecheck: false });
    expect(assessPlace([], PLACE, TODAY)).toHaveLength(8);
  });
  it("keeps a recorded Unknown as Unknown, never zero", () => {
    const result = door([obs(null, 3, "a")]);
    expect(result).toMatchObject({ value: null, tier: 0, basis: "unknown-recorded" });
    expect(observationCeiling(obs(null, 3, "a"))).toBe(0);
  });
  it("gives one observation tier 1 at most, whoever made it", () => {
    for (const role of OBSERVER_ROLES) {
      expect(door([obs(850, 3, "a", { observerRole: role })]).tier).toBe(1);
    }
  });
  it("never lets an unreviewed observation reach tier 3, even with a photo and method", () => {
    const unreviewed = surveyed(850, 3, "a", { review: undefined });
    expect(observationCeiling(unreviewed)).toBe(1);
    expect(door([unreviewed]).tier).toBe(1);
    expect(observationCeiling(surveyed(850, 3, "a", { photo: undefined }))).toBe(1);
    expect(observationCeiling(surveyed(850, 3, "a", { method: " " }))).toBe(1);
    expect(observationCeiling(surveyed(850, 3, "a", { observerRole: "peer" }))).toBe(1);
    // A review by the observer is malformed and the observation is not used at all.
    expect(door([surveyed(850, 3, "a", { review: { reviewerId: "a", reviewedOn: TODAY, outcome: "accepted" } })]).tier).toBe(0);
  });
  it("reaches tier 3 only for a trained verifier's evidenced measurement accepted by someone else", () => {
    const result = door([surveyed(850, 3, "a")]);
    expect(result).toMatchObject({ tier: 3, basis: "reviewed-survey", value: 850, freshness: "current" });
  });
  it("drops an observation rejected in review", () => {
    const rejected = surveyed(850, 3, "a", { review: { reviewerId: "z", reviewedOn: TODAY, outcome: "rejected" } });
    expect(door([rejected])).toMatchObject({ tier: 0, value: null, basis: "none" });
  });
  it("corroborates at tier 2 only with two different observers who agree", () => {
    expect(door([obs(850, 9, "a"), obs(855, 3, "b")])).toMatchObject({ tier: 2, basis: "corroborated", value: 855, restsOn: dayBefore(TODAY, 9) });
    expect(door([obs(850, 9, "a"), obs(852, 3, "a")]).tier).toBe(1);
    expect(door([obs(850, 9, "a"), obs(850 + DEFAULT_TIER_RULES.agreementToleranceMm + 1, 3, "b")]).tier).toBe(1);
    expect(door([obs(850, 9, "a"), obs(null, 3, "b")]).tier).toBe(1);
  });
  it("does not let two venue-operator entries corroborate each other", () => {
    const operator = { observerRole: "operator" as const };
    expect(door([obs(850, 9, "op-1", operator), obs(850, 3, "op-2", operator)]).tier).toBe(1);
    expect(door([obs(850, 9, "op-1", operator), obs(850, 3, "b")]).tier).toBe(2);
  });
  it("flags disagreement as contested without changing a corroborated or surveyed value", () => {
    const pair = [obs(850, 9, "a"), obs(852, 8, "b")];
    const later = door([...pair, obs(700, 2, "c")]);
    expect(later).toMatchObject({ tier: 2, value: 852, contested: true, needsRecheck: true });
    const earlier = door([...pair, obs(700, 30, "c")]);
    expect(earlier).toMatchObject({ tier: 2, value: 852, contested: false });
    expect(door([surveyed(850, 20, "a"), obs(700, 2, "c")])).toMatchObject({ tier: 3, value: 850, contested: true });
    expect(door([obs(850, 9, "a"), obs(700, 3, "b")])).toMatchObject({ tier: 1, value: 700, contested: true });
    expect(door([obs(850, 9, "a"), obs(700, 3, "a")])).toMatchObject({ tier: 1, value: 700, contested: false });
  });
});

describe("freshness decay", () => {
  it("marks a field as ageing before its window ends", () => {
    const limit = windowDays(1, "doorClearWidthMm") as number;
    expect(door([obs(850, Math.floor(limit * DEFAULT_TIER_RULES.ageingFraction), "a")])).toMatchObject({ freshness: "current", needsRecheck: false });
    expect(door([obs(850, limit - 1, "a")])).toMatchObject({ tier: 1, freshness: "ageing", needsRecheck: true, limitDays: limit });
  });
  it("turns an old survey stale at tier 0, with the value and its lapsed tier still shown", () => {
    const limit = windowDays(3, "doorClearWidthMm") as number;
    const survey = surveyed(850, limit, "a");
    expect(door([survey]).tier).toBe(3);
    const result = door([survey], dayBefore(TODAY, -1));
    expect(result).toMatchObject({ tier: 0, basis: "stale", freshness: "stale", value: 850, lapsedTier: 3, needsRecheck: true, limitDays: limit, ageDays: limit + 1 });
  });
  it("steps a washroom corroboration down to tier 1 when its shorter window ends", () => {
    const list = [obs(1500, 100, "a", { field: "turningDiameterMm" }), obs(1500, 95, "b", { field: "turningDiameterMm" })];
    expect(windowDays(2, "turningDiameterMm")).toBeLessThan(100);
    expect(assessField(list, PLACE, "turningDiameterMm", TODAY)).toMatchObject({ tier: 1, lapsedTier: 2, needsRecheck: true });
    expect(assessField(list, PLACE, "turningDiameterMm", dayBefore(TODAY, 60)).tier).toBe(2);
  });
  it("judges corroboration by its older half", () => {
    const limit = windowDays(2, "doorClearWidthMm") as number;
    expect(door([obs(850, limit + 1, "a"), obs(850, 1, "b")]).tier).toBe(1);
    expect(door([obs(850, limit, "a"), obs(850, 1, "b")])).toMatchObject({ tier: 2, freshness: "ageing", ageDays: limit });
  });
  it("is restored by a new observation and only by that", () => {
    const limit = windowDays(1, "doorClearWidthMm") as number;
    const old = obs(850, limit + 20, "a");
    expect(door([old])).toMatchObject({ tier: 0, freshness: "stale" });
    expect(door([old, obs(850, 0, "b")])).toMatchObject({ tier: 1, freshness: "current", lapsedTier: null });
  });
  it("ignores other places and other fields", () => {
    expect(door([obs(850, 1, "a", { placeId: "demo-library" }), obs(20, 1, "a", { field: "stepHeightMm" })]).basis).toBe("none");
  });
});
