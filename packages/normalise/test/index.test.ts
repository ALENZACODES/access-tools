import { describe, expect, it } from "vitest";
import { candidates, normalise, registerLicence, type CandidateRecord, type FactValue, type IncomingField, type OpenLicence, type PackField } from "../src/index";

const meta = { source_id: "synthetic-source", licence: "OGL-Ontario" as const, retrieved_at: "2026-11-15", tier: 1 as const };
const withValue = (value: unknown, licence = "OGL-Ontario"): IncomingField => ({ ...meta, value, licence });
const packField = (value: FactValue, licence: OpenLicence = "OGL-Ontario"): PackField => ({ ...meta, value, licence });

describe("per-field provenance and licence silo", () => {
  it("never leaks an ODbL-derived field into an open output", () => {
    const input = { id: "synthetic:1", fields: {
      name: withValue("Synthetic Library"),
      wheelchair: withValue("yes", "ODbL"),
      address: withValue("1 Example St"),
    } };
    const result = normalise(input);
    expect(result.silo).toBe("odbl");
    expect(result.sameAsCandidate).toBe("synthetic:1");
    expect(result.record.wheelchair).toMatchObject({ value: "yes", licence: "ODbL", tier: 1 });
    expect(result.record.name).toBeUndefined();
    expect(result.record.address).toBeUndefined();
    expect(result.warnings).toContain(
      "name: excluded from ODbL output; normalise independently in open silo");
    // A separately normalised OGL record remains physically separate.
    const open = normalise({ id: "synthetic:1", fields: { name: input.fields.name } });
    expect(open.silo).toBe("open");
    expect(open.record.name?.licence).toBe("OGL-Ontario");
    expect(open.record.wheelchair).toBeUndefined();
  });

  it("holds unknown or forbidden licences and never publishes their value", () => {
    expect(registerLicence("proprietary")).toBe("UNKNOWN");
    expect(registerLicence(undefined)).toBe("UNKNOWN");
    expect(registerLicence("CC0")).toBe("CC0");
    const result = normalise({ fields: {
      missing: { ...meta, value: "yes", licence: undefined },
      forbidden: withValue("yes", "All rights reserved"),
    } });
    expect(result.record.missing?.value).toBe("UNKNOWN");
    expect(result.record.forbidden?.value).toBe("UNKNOWN");
    expect(result.record.forbidden?.licence).toBe("UNKNOWN");
  });

  it("preserves UNKNOWN, missing dates, and clamps unverified tier", () => {
    const result = normalise({ fields: {
      wheelchair: withValue("UNKNOWN"),
      toilet: { ...meta, value: "yes", retrieved_at: undefined },
      entrance: { ...meta, value: true, tier: 3 },
      latitude: withValue(43.7),
    } });
    expect(result.record.wheelchair?.value).toBe("UNKNOWN");
    expect(result.record.toilet?.value).toBe("UNKNOWN");
    expect(result.record.entrance?.tier).toBe(0);
    expect(result.record.latitude?.value).toBe("UNKNOWN");
    expect(result.warnings.some(w => w.includes("no point inferred"))).toBe(true);
  });

  it("does not overwrite aliased fields or synthesize a point from an address", () => {
    const result = normalise({ fields: {
      name: withValue("First"), title: withValue("Second"),
      address: withValue("9 Synthetic Road"),
    } });
    expect(result.record.name?.value).toBe("First");
    expect(result.warnings.some(w => w.includes("Collision"))).toBe(true);
    expect(result.record.latitude).toBeUndefined();
    expect(result.warnings.some(w => w.includes("Coordinates UNKNOWN"))).toBe(true);
  });
});

describe("dedupe candidates (never merges)", () => {
  const place = (id: string, name: string, lat: number, lon: number): CandidateRecord => ({
    id, record: { name: packField(name), latitude: packField(lat), longitude: packField(lon) },
  });
  it("proposes close synthetic places with similar names", () => {
    const a = place("one", "Example Hall", 43.700000, -79.400000);
    const b = place("two", "Example Halls", 43.700090, -79.400000); // approx. 10 metres
    const snapshot = structuredClone([a, b]);
    const found = candidates([a, b]);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ a: "one", b: "two", reason: "nearby-name" });
    expect([a, b]).toEqual(snapshot);
    expect(candidates([a, b], 5)).toEqual([]);
  });
  it("never proposes distant places, even with an identical name", () => {
    expect(candidates([
      place("east", "Example Hall", 43.7, -79.4),
      place("west", "Example Hall", 44.7, -79.4),
    ])).toEqual([]);
  });
  it("can flag exact address and similar names without inferring coordinates", () => {
    const a = normalise({ fields: { name: withValue("Example Centre"), address: withValue("1 Test St") } });
    const b = normalise({ fields: { name: withValue("Example Center"), address: withValue("1 Test St") } });
    expect(candidates([{ id: "a", record: a.record }, { id: "b", record: b.record }]))
      .toMatchObject([{ reason: "same-address-name" }]);
  });
  it("does not match a known point with an unknown point", () => {
    const a = place("a", "Same Name", 43.7, -79.4);
    const b: CandidateRecord = { id: "b", record: {
      name: packField("Same Name"), address: packField("1 Test St"),
    } };
    expect(candidates([a, b])).toEqual([]);
  });
});
