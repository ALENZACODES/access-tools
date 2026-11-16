import { describe, expect, it, vi } from "vitest";
import { createFindersModule } from "../src/react/pack-module.js";
import { searchFindersForShell } from "../src/shell.js";
import type { PackManifest, PackRecord, PackSource, PackSourceEntry, Tranche } from "../src/pack-types.js";

const open: PackSourceEntry = {
  sourceId: "osm-ontario",
  name: "OpenStreetMap",
  licence: "ODbL-1.0",
  retrieved: "2026-11-01",
  attribution: "© OpenStreetMap contributors, ODbL",
  inWebPack: true,
};
const manifest: PackManifest = {
  version: 1, builtAt: "2026-11-01T00:00:00Z", sourceCommit: "test", sources: [open],
  regions: [{ id: "toronto", label: { en: "Toronto", fr: "Toronto" }, bbox: [-80, 43, -79, 44], cells: ["n43.5_w079.5"] }],
  tranches: {}, search: {}, counts: { records: 1, byTranche: {}, bySource: {} },
};

function record(id: string, tranche: Tranche, fields: Record<string, unknown>): PackRecord {
  return {
    id, tranche, region: "toronto",
    fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, {
      value, source_id: open.sourceId, licence: "ODbL-1.0", retrieved_at: "2026-11-01", tier: "0",
    }])),
  };
}

const fixtures = [
  record("osm-toilet", "washroom", { name: "Public toilet", wheelchair: "UNKNOWN", changing_table: "yes" }),
  record("colon-yes", "washroom", { name: "Colon adult yes", "changing_table:adult": "yes" }),
  record("conflict-no-then-yes", "washroom", { name: "Conflict A", "changing_table:adult": "no", adult_changing_table: "yes" }),
  record("conflict-yes-then-no", "washroom", { name: "Conflict B", "changing_table:adult": "yes", adult_changing_table: "no" }),
  record("parking", "venue", { name: "Parking lot", amenity: "parking", capacity_disabled: 3 }),
];

function sourceOf(records: PackRecord[]): PackSource {
  return {
    manifest: async () => manifest,
    cellsFor: vi.fn(async () => ["n43.5_w079.5"]),
    async *records(tranche) { for (const value of records) if (value.tranche === tranche) yield value; },
    search: vi.fn(async (text: string) => records
      .filter((value) => String(value.fields.name?.value).toLowerCase().includes(text.toLowerCase()))
      .map((value) => ({ id: value.id, tranche: value.tranche, name: String(value.fields.name?.value), nameNorm: "", lat: 43.7, lon: -79.5 }))),
    get: async (id) => records.find((value) => value.id === id) ?? null,
    sourcesFor: () => [open], regions: async () => [], downloadRegion: async () => ({ id: "toronto" }), deleteRegion: async () => {},
  };
}

const ctx = { locale: "en" as const, offline: false, nowIso: "2026-11-15T12:00:00.000Z" };

describe("createFindersModule shell search", () => {
  it("exposes search for the /finders route", async () => {
    const module = createFindersModule(sourceOf(fixtures));
    expect(module.id).toBe("finders");
    expect(typeof module.search).toBe("function");
    const result = await module.search({ kind: "washroom", text: "" }, ctx);
    expect(result.availability).toBe("ready");
    expect(result.moduleId).toBe("finders");
    expect(result.liveStatus).toBe("unavailable");
    expect(result.items.length).toBeGreaterThan(0);
    for (const item of result.items) {
      expect(item.kind).toBe("washroom");
      expect(item.detail).toBe("unknown");
      expect(item.provenance).toMatchObject({
        source_name: "OpenStreetMap",
        licence: "ODbL-1.0",
        source_date: "2026-11-01",
        retrieved_at: "2026-11-01",
        tier: 0,
        prototype_label: null,
        freshness: "unknown",
      });
    }
  });

  it("maps adult-change to the changing finder and lists only a recorded yes", async () => {
    const result = await searchFindersForShell(sourceOf(fixtures), { kind: "adult-change", text: "" }, ctx);
    expect(result.availability).toBe("ready");
    expect(result.items.map((item) => item.id)).toEqual(["colon-yes"]);
    expect(result.items[0]?.kind).toBe("adult-change");
    expect(result.items[0]?.detail).toBe("unknown");
  });

  it.each([
    { id: "conflict-no-then-yes" },
    { id: "conflict-yes-then-no" },
  ] as const)("does not list a yes/no adult-alias conflict as a hit ($id)", async ({ id }) => {
    const result = await searchFindersForShell(sourceOf(fixtures), { kind: "adult-change", text: "" }, ctx);
    expect(result.items.some((item) => item.id === id)).toBe(false);
  });

  it("filters by destination text", async () => {
    const result = await searchFindersForShell(sourceOf(fixtures), { kind: "parking", text: "lot" }, ctx);
    expect(result.items.map((item) => item.id)).toEqual(["parking"]);
  });
});
