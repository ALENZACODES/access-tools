import { describe, expect, it } from "vitest";
import { EMPTY_COMMUTE_INPUTS, checkCommute, parseMinutes, parseTime } from "../src/commute.js";
import type { CommuteItem, CommuteItemKey, CommuteReport, PlanResult } from "../src/commute.js";
import { DEMONSTRATION_LISTING_RECORDS } from "../src/data.js";
import { describeCommuteItem } from "../src/referral.js";

const noRecord = DEMONSTRATION_LISTING_RECORDS[0]!;
const sampleRecord = DEMONSTRATION_LISTING_RECORDS[2]!;
const item = (report: CommuteReport, key: CommuteItemKey): CommuteItem => {
  const found = report.items.find((entry) => entry.key === key);
  if (!found) throw new Error(`missing ${key}`);
  return found;
};
const testPlan: PlanResult = {
  outcome: "route-found", durationMinutes: 42, stepFreeThroughout: "Unknown", winterAssessed: false,
  source: "Test plan result", computedOn: "2026-11-16",
};

describe("commute check", () => {
  it("reports everything as Unknown when nothing is supplied", () => {
    const report = checkCommute(EMPTY_COMMUTE_INPUTS);
    expect(report.items).toHaveLength(9);
    expect(report.knownCount).toBe(0);
    expect(report.unknownCount).toBe(9);
    expect(report.routeConfirmed).toBe(false);
    expect(item(report, "workplaceEntry")).toMatchObject({ state: "unknown", missing: "no-access-record" });
    expect(item(report, "planOutcome")).toMatchObject({ state: "unknown", missing: "no-plan-result" });
  });

  it("compares only the person's own numbers", () => {
    const within = checkCommute({ ...EMPTY_COMMUTE_INPUTS, travelMinutes: 60, maxMinutes: 60 });
    expect(item(within, "travelTime")).toMatchObject({ state: "known", finding: "within-your-limit" });
    const over = checkCommute({ ...EMPTY_COMMUTE_INPUTS, travelMinutes: 61, maxMinutes: 60 });
    expect(item(over, "travelTime")).toMatchObject({ state: "known", finding: "over-your-limit" });
    const half = checkCommute({ ...EMPTY_COMMUTE_INPUTS, travelMinutes: 45 });
    expect(item(half, "travelTime")).toMatchObject({ state: "unknown", missing: "not-entered" });
    const bad = checkCommute({ ...EMPTY_COMMUTE_INPUTS, travelMinutes: Number.NaN, maxMinutes: -5 });
    expect(item(bad, "travelTime").state).toBe("unknown");
  });

  it("compares the shift with the service hours the person entered, including hours past midnight", () => {
    const base = { ...EMPTY_COMMUTE_INPUTS, shiftStart: "09:00", shiftEnd: "17:00" };
    expect(item(checkCommute({ ...base, serviceStart: "06:00", serviceEnd: "23:00" }), "serviceHours")).toMatchObject({ finding: "shift-inside-hours" });
    expect(item(checkCommute({ ...base, serviceStart: "10:00", serviceEnd: "23:00" }), "serviceHours")).toMatchObject({ finding: "shift-outside-hours" });
    expect(item(checkCommute({ ...base, serviceStart: "06:00", serviceEnd: "16:30" }), "serviceHours")).toMatchObject({ finding: "shift-outside-hours" });
    const night = { ...EMPTY_COMMUTE_INPUTS, shiftStart: "22:00", shiftEnd: "02:00" };
    expect(item(checkCommute({ ...night, serviceStart: "06:00", serviceEnd: "01:00" }), "serviceHours")).toMatchObject({ finding: "shift-outside-hours" });
    expect(item(checkCommute({ ...night, serviceStart: "06:00", serviceEnd: "03:00" }), "serviceHours")).toMatchObject({ finding: "shift-inside-hours" });
    expect(item(checkCommute({ ...base, serviceStart: "06:00" }), "serviceHours").state).toBe("unknown");
    expect(item(checkCommute({ ...base, serviceStart: "6am", serviceEnd: "23:00" }), "serviceHours").state).toBe("unknown");
  });

  it("repeats the winter answer without assessing it", () => {
    expect(item(checkCommute({ ...EMPTY_COMMUTE_INPUTS, winterChecked: false }), "winter")).toMatchObject({ finding: "you-have-not-checked" });
    expect(item(checkCommute({ ...EMPTY_COMMUTE_INPUTS, winterChecked: true }), "winter")).toMatchObject({ finding: "you-checked" });
  });

  it("takes the workplace entry only from the access record, with its provenance", () => {
    expect(item(checkCommute(EMPTY_COMMUTE_INPUTS, noRecord), "workplaceEntry")).toMatchObject({ state: "unknown", missing: "no-access-record" });
    expect(item(checkCommute(EMPTY_COMMUTE_INPUTS, sampleRecord), "workplaceEntry")).toMatchObject({ state: "known", stepFree: true, tier: "PROTOTYPE-UNVERIFIED" });
    const unknownEntry = structuredClone(sampleRecord);
    unknownEntry.accessRecord!.stepFreeEntry.value = "Unknown";
    expect(item(checkCommute(EMPTY_COMMUTE_INPUTS, unknownEntry), "workplaceEntry")).toMatchObject({ state: "unknown", missing: "not-recorded" });
  });

  it("repeats a supplied plan result, keeps its Unknown fields Unknown and never confirms the route", () => {
    const report = checkCommute(EMPTY_COMMUTE_INPUTS, sampleRecord, testPlan);
    expect(item(report, "planOutcome")).toMatchObject({ state: "known", outcome: "route-found", source: "Test plan result", computedOn: "2026-11-16" });
    expect(item(report, "planDuration")).toMatchObject({ state: "known", durationMinutes: 42 });
    expect(item(report, "planStepFree")).toMatchObject({ state: "unknown", missing: "not-in-plan-result" });
    expect(item(report, "planWinter")).toMatchObject({ state: "known", assessed: false });
    expect(report.routeConfirmed).toBe(false);
  });

  it("does not repeat a plan result that has no source or date", () => {
    const report = checkCommute(EMPTY_COMMUTE_INPUTS, sampleRecord, { ...testPlan, source: "", computedOn: "soon" });
    for (const key of ["planOutcome", "planDuration", "planStepFree", "planWinter"] as const) expect(item(report, key).state).toBe("unknown");
  });

  it("describes every item in English and French without claiming the route works", () => {
    const report = checkCommute(
      { mode: "paratransit", travelMinutes: 50, maxMinutes: 60, shiftStart: "09:00", shiftEnd: "17:00", serviceStart: "06:00", serviceEnd: "23:00", winterChecked: true },
      sampleRecord, { ...testPlan, stepFreeThroughout: true },
    );
    expect(report.unknownCount).toBe(0);
    for (const language of ["en", "fr"] as const) {
      const text = [...report.items, ...checkCommute(EMPTY_COMMUTE_INPUTS).items].map((entry) => describeCommuteItem(entry, language)).join("\n");
      expect(text).not.toMatch(/is accessible|est accessible|will work|fonctionnera|feasible|réalisable/i);
      expect(text).toMatch(language === "en" ? /Unknown/ : /Inconnu/);
      expect(text).toMatch(language === "en" ? /not a statement that the route works/ : /pas une affirmation que le trajet fonctionne/);
    }
  });
});

describe("typed input parsing", () => {
  it("keeps blank or malformed input Unknown", () => {
    expect(parseMinutes("45")).toBe(45);
    expect(parseMinutes(" 0 ")).toBe(0);
    for (const text of ["", "  ", "-5", "4.5", "about an hour", "1e3"]) expect(parseMinutes(text)).toBe("Unknown");
    expect(parseTime("09:30")).toBe(570);
    for (const text of ["", "24:00", "9:30", "09:60", "Unknown"]) expect(parseTime(text)).toBeNull();
  });
});
