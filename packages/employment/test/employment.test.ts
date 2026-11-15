import { describe, expect, it } from "vitest";
import { DEMONSTRATION_LISTINGS } from "../src/data.js";
import { commuteStatus, joinWorkplace } from "../src/join.js";
import { assertListing, listingErrors } from "../src/validate.js";

const copy = <T>(value: T): T => structuredClone(value);

describe("employment listing schema", () => {
  it("accepts the labelled demonstration fixtures", () => {
    for (const listing of DEMONSTRATION_LISTINGS) expect(() => assertListing(listing)).not.toThrow();
  });
  it("rejects unsupported verification tiers and missing fact provenance", () => {
    const record = copy(DEMONSTRATION_LISTINGS[0]!);
    (record.access.stepFreeEntry as { tier: string }).tier = "VERIFIED";
    expect(listingErrors(record).length).toBeGreaterThan(0);
    delete (record.access.stepFreeEntry as Partial<typeof record.access.stepFreeEntry>).source;
    expect(listingErrors(record).length).toBeGreaterThan(0);
  });
  it("requires city, official URL and safe hand-off metadata", () => {
    const record = copy(DEMONSTRATION_LISTINGS[0]!);
    record.officialUrl = "http://not-secure.test";
    record.handoff.datedOn = "yesterday";
    expect(listingErrors(record).length).toBeGreaterThan(0);
  });
  it("rejects fabricated commute outcomes", () => {
    const record = copy(DEMONSTRATION_LISTINGS[0]!);
    (record.commute as { status: string }).status = "Accessible in 8 minutes";
    expect(listingErrors(record).length).toBeGreaterThan(0);
  });
});

describe("workplace and commute boundaries", () => {
  it("keeps commute Unknown for every listing", () => {
    for (const listing of DEMONSTRATION_LISTINGS) {
      expect(listing.commute.status).toBe("Unknown");
      expect(commuteStatus(listing)).toBe("Unknown");
    }
  });
  it("does not infer a workplace match from city or listing", () => {
    expect(joinWorkplace(DEMONSTRATION_LISTINGS[0]!, [])).toBeUndefined();
    const record = copy(DEMONSTRATION_LISTINGS[0]!);
    record.workplacePlaceId = "demo-place";
    expect(joinWorkplace(record, [])).toBeUndefined();
    const fact = record.access.stepFreeEntry;
    expect(joinWorkplace(record, [{ placeId: "demo-place", stepFreeEntry: fact, accessibleWashroom: fact, workstation: fact }])?.placeId).toBe("demo-place");
  });
});
