import { describe, expect, it } from "vitest";
import { DEMONSTRATION_LISTING_RECORDS } from "../src/data.js";
import { ACCESS_FACT_KEYS, UNKNOWN, assertListingRecord, listingRecordErrors, presentListing, presentListings } from "../src/record.js";
import type { ListingRecord } from "../src/record.js";

const copy = <T>(value: T): T => structuredClone(value);
const withoutRecord = () => copy(DEMONSTRATION_LISTING_RECORDS[0]!);
const withRecord = () => copy(DEMONSTRATION_LISTING_RECORDS[2]!);

describe("listing record with a travelling access record", () => {
  it("accepts the labelled fixtures, with and without an access record", () => {
    for (const record of DEMONSTRATION_LISTING_RECORDS) expect(() => assertListingRecord(record)).not.toThrow();
    expect(DEMONSTRATION_LISTING_RECORDS.some((record) => record.accessRecord === null)).toBe(true);
    expect(DEMONSTRATION_LISTING_RECORDS.some((record) => record.accessRecord !== null)).toBe(true);
    for (const record of DEMONSTRATION_LISTING_RECORDS) expect(record.listing.demonstration).toBe(true);
  });

  it("requires accessRecord to be stated, as a record or as null", () => {
    const record = withoutRecord() as Partial<ListingRecord>;
    delete record.accessRecord;
    expect(listingRecordErrors(record).join(" ")).toMatch(/accessRecord: required/);
  });

  it("requires source, licence, date and tier on every access fact", () => {
    for (const field of ["source", "licence", "date", "tier"] as const) {
      const record = withRecord();
      delete (record.accessRecord!.workstation.kneeClearanceMm as unknown as Record<string, unknown>)[field];
      expect(listingRecordErrors(record).join(" ")).toContain(`workstation/kneeClearanceMm/${field}`);
    }
  });

  it("rejects tiers outside the prototype tiers, impossible dates and wrong value types", () => {
    const a = withRecord();
    (a.accessRecord!.stepFreeEntry as { tier: string }).tier = "VERIFIED";
    expect(listingRecordErrors(a).join(" ")).toMatch(/stepFreeEntry\/tier/);
    const b = withRecord();
    b.accessRecord!.stepFreeEntry.date = "2026-02-30";
    expect(listingRecordErrors(b).join(" ")).toMatch(/stepFreeEntry\/date/);
    const c = withRecord();
    (c.accessRecord!.stepFreeEntry as { value: unknown }).value = "probably";
    expect(listingRecordErrors(c).join(" ")).toMatch(/stepFreeEntry\/value/);
    const d = withRecord();
    (d.accessRecord!.workstation.aisleClearWidthMm as { value: unknown }).value = -1;
    expect(listingRecordErrors(d).join(" ")).toMatch(/aisleClearWidthMm\/value/);
    const e = withRecord();
    (e.accessRecord as unknown as Record<string, unknown>).accessible = true;
    expect(listingRecordErrors(e).join(" ")).toMatch(/accessible: unexpected field/);
  });

  it("rejects an access claim on a listing that has no access record", () => {
    const record = withoutRecord();
    record.listing.access.stepFreeEntry.value = true;
    expect(listingRecordErrors(record).join(" ")).toMatch(/must be "Unknown" when there is no access record/);
  });

  it("reports errors from the wrapped listing", () => {
    const record = withoutRecord();
    record.listing.officialUrl = "http://not-secure.test";
    expect(listingRecordErrors(record).some((error) => error.startsWith("/listing"))).toBe(true);
  });
});

describe("presentation rule", () => {
  it("labels a listing with no access record unverified, with every fact Unknown and no source", () => {
    const shown = presentListing(withoutRecord());
    expect(shown.label).toBe("unverified-no-record");
    expect(shown.verified).toBe(false);
    expect(shown.knownCount).toBe(0);
    expect(shown.facts.map((fact) => fact.key)).toEqual([...ACCESS_FACT_KEYS]);
    for (const fact of shown.facts) {
      expect(fact.value).toBe(UNKNOWN);
      expect(fact.provenance).toBeNull();
    }
  });

  it("never hides a listing and keeps the given order", () => {
    const shown = presentListings(DEMONSTRATION_LISTING_RECORDS);
    expect(shown.map((item) => item.record.listing.id)).toEqual(DEMONSTRATION_LISTING_RECORDS.map((record) => record.listing.id));
  });

  it("keeps Unknown facts Unknown inside an attached record and never marks it verified", () => {
    const shown = presentListing(withRecord());
    expect(shown.label).toBe("unverified-record-attached");
    expect(shown.verified).toBe(false);
    const byKey = Object.fromEntries(shown.facts.map((fact) => [fact.key, fact]));
    expect(byKey.stepFreeEntry?.value).toBe(true);
    expect(byKey.accessibleWashroom?.value).toBe(UNKNOWN);
    expect(byKey.kneeClearanceMm?.provenance?.tier).toBe("PROTOTYPE-UNVERIFIED");
    expect(shown.knownCount + shown.unknownCount).toBe(ACCESS_FACT_KEYS.length);
  });

  it("uses a separate label when an attached record is entirely Unknown", () => {
    const record = withRecord();
    const access = record.accessRecord!;
    access.stepFreeEntry.value = UNKNOWN;
    access.workstation.heightAdjustableDesk.value = UNKNOWN;
    access.workstation.kneeClearanceMm.value = UNKNOWN;
    expect(listingRecordErrors(record)).toEqual([]);
    expect(presentListing(record).label).toBe("unverified-all-unknown");
  });
});
