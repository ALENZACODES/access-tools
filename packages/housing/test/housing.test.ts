import { describe, expect, it } from "vitest";
import { DEMONSTRATION_ROOMS } from "../src/fixtures.js";
import { filterRooms } from "../src/filter.js";
import { aggregate, readReports, saveReport, STORAGE_KEY, validReport } from "../src/reports.js";
import { assertRooms, roomErrors } from "../src/validate.js";

describe("room-level schema", () => {
  it("validates fixtures and keeps unknowns null", () => {
    expect(() => assertRooms(DEMONSTRATION_ROOMS)).not.toThrow();
    expect(DEMONSTRATION_ROOMS[0]?.facts.bedHeightMm).toEqual({ value: null, provenance: null, photoSlotIds: [] });
  });
  it("rejects provenance-less measurements, unapproved tiers, real IDs and missing fields", () => {
    const make = () => structuredClone(DEMONSTRATION_ROOMS[0]);
    const a = make(); a!.facts.doorClearWidthMm.provenance = null;
    expect(roomErrors(a).length).toBeGreaterThan(0);
    const b = make(); (b!.recordProvenance as unknown as { tier: number }).tier = 3;
    expect(roomErrors(b).length).toBeGreaterThan(0);
    const c = make(); c!.id = "some-real-address";
    expect(roomErrors(c).length).toBeGreaterThan(0);
    const d = make(); delete (d!.facts as unknown as Record<string, unknown>).washroom;
    expect(roomErrors(d).length).toBeGreaterThan(0);
    const e = make(); e!.facts.washroom.provenance = e!.recordProvenance;
    expect(roomErrors(e).length).toBeGreaterThan(0);
  });
  it("never infers unknown from a filter", () => {
    const result = filterRooms(DEMONSTRATION_ROOMS, { city: "Toronto", minimumDoorWidth: "900", requireElevator: true });
    expect(result.map((room) => room.id)).toEqual(["demo-toronto-room-01"]);
    expect(filterRooms(DEMONSTRATION_ROOMS, { city: "Ottawa", minimumDoorWidth: "900", requireElevator: false })).toEqual([]);
    expect(filterRooms(DEMONSTRATION_ROOMS, { city: "", minimumDoorWidth: "", requireElevator: false })).toHaveLength(2);
  });
});

describe("private barrier reports", () => {
  it("accepts only a categorical report and optional bounded city", () => {
    expect(validReport({ category: "waited", city: "Toronto" })).toBe(true);
    expect(validReport({ category: "waited", email: "private@example.org" })).toBe(false);
    expect(validReport({ category: "refused", medicalNote: "detail" })).toBe(false);
    expect(validReport({ category: "unsuitable", city: "X".repeat(61) })).toBe(false);
  });
  it("stores locally and excludes malformed entries", () => {
    const data = new Map<string, string>();
    const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); } };
    saveReport(storage, { category: "applied" });
    expect(readReports(storage)).toEqual([{ category: "applied" }]);
    data.set(STORAGE_KEY, JSON.stringify([{ category: "refused" }, { category: "waited", phone: "123" }]));
    expect(readReports(storage)).toEqual([{ category: "refused" }]);
  });
  it("suppresses 0–4 counts and releases only cells at k=5", () => {
    for (let n = 0; n <= 6; n++) {
      const result = aggregate(Array.from({ length: n }, () => ({ category: "applied" as const })));
      expect(result.applied).toBe(n >= 5 ? n : null);
      expect(result.waited).toBeNull();
    }
  });
});
