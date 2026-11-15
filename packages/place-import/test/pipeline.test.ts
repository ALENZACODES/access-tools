import { describe, expect, it } from "vitest";
import { displayedFields, importPlaces } from "../src/pipeline.js";
import { validateEmittedRecord, validateImportReport, validateRawDocument } from "../src/schema.js";
import demo from "../src/demo.json";

const provenance = {
  sourceName: "Fixture author", sourceId: "fiction-1", licence: "CC0-1.0",
  sourceDate: "2026-11-15", recordDate: "2026-11-15", retrievedAt: "2026-11-15",
  tier: 0, prototypeLabel: "PROTOTYPE-UNVERIFIED", verifierType: "fixture-author",
};
const base = () => ({
  id: "fiction", name: "Fictional Test Venue", municipality: "Imaginary Township",
  recordProvenance: { ...provenance }, fields: {} as Record<string, unknown>,
});
const run = (record: unknown) => importPlaces({ records: [record] });

describe("place import", () => {
  it("validates raw document, report, and emitted record JSON schemas", () => {
    expect(validateRawDocument(demo)).toBe(true);
    const result = importPlaces(demo);
    expect(result.report.accepted).toBe(2);
    expect(result.report.rejected).toBe(2);
    expect(validateImportReport(result.report)).toBe(true);
    expect(result.places.every((place) => validateEmittedRecord(place))).toBe(true);
  });

  it("keeps absent and null measurements unknown without guesses", () => {
    const record = base();
    record.fields["entrance.stepCount"] = null;
    const result = run(record);
    expect(result.report.accepted).toBe(1);
    expect(result.places[0]?.entrance.stepCount).toEqual({ value: null, provenance: null, photoSlotIds: [] });
    expect(result.places[0]?.entrance.doorClearWidthMm.value).toBeNull();
    expect(result.places[0]?.entrance.stepFree.value).toBeNull();
    expect(result.report.unknownFields).toBeGreaterThan(0);
  });

  it("rejects facts with missing source, licence, date or tier", () => {
    for (const removed of ["sourceName", "licence", "sourceDate", "tier"] as const) {
      const record = base();
      const incomplete: Record<string, unknown> = { ...provenance };
      delete incomplete[removed];
      record.fields["entrance.stepCount"] = { value: 1, provenance: incomplete };
      expect(run(record).report).toMatchObject({ accepted: 0, rejected: 1 });
    }
    const record = base();
    record.fields["entrance.stepCount"] = { value: 1 };
    expect(run(record).report.rejected).toBe(1);
  });

  it("rejects verification tier 3 / 4, VERIFIED, and unapproved prototype labels", () => {
    for (const claim of [
      { tier: 3 }, { tier: 4 }, { prototypeLabel: "VERIFIED" },
      { prototypeLabel: "COMMUNITY-REPORTED" },
      { tier: 3, evidence: { protocolVersion: "x", verifierRole: "trained_verifier", method: "x", observedAt: "2026-11-15", photoIds: [] } },
      { tier: 4, observedAt: "2026-11-15T00:00:00Z", expiresAt: "2026-11-15T00:01:00Z" },
    ]) {
      const record = base();
      record.fields["entrance.stepFree"] = { value: "yes", provenance: { ...provenance, ...claim } };
      expect(run(record).report.rejected).toBe(1);
    }
  });

  it("refuses live disruptions from fields and top-level keys", () => {
    const record = { ...base(), currentDisruption: "closed" };
    record.fields["transport.elevatorStatus"] = { value: "working", provenance };
    record.fields["entrance.stepCount"] = { value: 2, provenance };
    const result = run(record);
    expect(result.report).toMatchObject({ accepted: 1, refused: 2 });
    expect(result.report.refusals.map((entry) => entry.field)).toContain("transport.elevatorStatus");
    expect(result.places[0]?.transport.elevatorStatus.value).toBeNull();
    expect(JSON.stringify(result.places)).not.toContain("working");
  });

  it("rejects unknown field names and invalid numeric values", () => {
    const invalid = base();
    invalid.fields["entrance.stepCount"] = { value: -1, provenance };
    expect(run(invalid).report.rejected).toBe(1);
    const extra = base();
    extra.fields["entrance.fakeWidthMm"] = { value: 900, provenance };
    expect(run(extra).report.rejected).toBe(1);
  });

  it("includes provenance for every non-null imported fact", () => {
    const record = base();
    record.fields["entrance.stepCount"] = { value: 2, provenance };
    const result = run(record);
    const facts = displayedFields(result.places[0]!);
    expect(facts.filter((field) => field.fact.value !== null)).toHaveLength(1);
    for (const { fact } of facts) {
      if (fact.value !== null) expect(fact.provenance).toMatchObject(provenance);
      else expect(fact.provenance).toBeNull();
    }
  });

  it("rejects duplicate ids and malformed document shapes", () => {
    expect(importPlaces({ records: [base(), base()] }).report).toMatchObject({ accepted: 1, rejected: 1 });
    expect(importPlaces({ records: "wrong" }).report.rejected).toBe(1);
  });
});
