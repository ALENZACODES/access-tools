// @vitest-environment node
import { describe, expect, it } from "vitest";
import { validateRecord } from "../src/schema";
import { mapFixture } from "./helpers";

describe("record schema", () => {
  for (const name of ["wikidata-p2846-ontario.sample.json", "demo-wikidata-edge.json"]) {
    it(`accepts every record from ${name}`, async () => {
      const { records } = await mapFixture(name);
      expect(records.length).toBeGreaterThan(0);
      for (const r of records) {
        const v = validateRecord(r);
        expect(v.errors, r.id).toEqual([]);
      }
    });
  }

  async function one() {
    const { records } = await mapFixture("wikidata-p2846-ontario.sample.json");
    return structuredClone(records.find((r) => r.upstreamId === "Q511316")!);
  }

  it("rejects a non-null value without provenance", async () => {
    const r = await one();
    r.facts.wheelchairAccessibilityStatement.provenance = null;
    expect(validateRecord(r).ok).toBe(false);
  });

  it("rejects a null value with provenance", async () => {
    const r = await one();
    r.facts.stepFree = { value: null, provenance: r.facts.wheelchairAccessibilityStatement.provenance, photoSlotIds: [] };
    expect(validateRecord(r).ok).toBe(false);
  });

  it("rejects tier 2, VERIFIED, other verifier types and bad dates", async () => {
    for (const patch of [{ tier: 2 }, { prototypeLabel: "VERIFIED" }, { verifierType: "peer" }, { retrievedAt: "15/11/2026" }]) {
      const r = await one();
      Object.assign(r.facts.wheelchairAccessibilityStatement.provenance!, patch);
      expect(validateRecord(r).ok, JSON.stringify(patch)).toBe(false);
    }
  });

  it("rejects live-status fields on provenance and missing fact names", async () => {
    const r = await one();
    Object.assign(r.facts.wheelchairAccessibilityStatement.provenance!, { observedAt: "2026-11-15T10:00:00Z" });
    expect(validateRecord(r).ok).toBe(false);
    const r2 = await one();
    delete (r2.facts as unknown as Record<string, unknown>).stepFree;
    expect(validateRecord(r2).ok).toBe(false);
  });

  it("rejects a malformed geometry", async () => {
    const r = await one();
    (r as { geometry: unknown }).geometry = { type: "Point", coordinates: [1] };
    expect(validateRecord(r).ok).toBe(false);
  });
});
