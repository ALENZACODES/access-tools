import { describe, expect, it, vi } from "vitest";
import { queryPackFinders, WASHROOM_KEYS } from "../src/pack-finders.js";
import type { PackManifest, PackRecord, PackSource, PackSourceEntry, Tranche } from "../src/pack-types.js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const open: PackSourceEntry = { sourceId: "osm-ontario", name: "OpenStreetMap", licence: "ODbL-1.0", retrieved: "2026-11-01", attribution: "© OpenStreetMap contributors, ODbL", inWebPack: true };
const held: PackSourceEntry = { sourceId: "held", name: "Held", licence: "restricted", retrieved: "2026-11-01", inWebPack: false, heldReason: "Licence pending" };
function record(id: string, tranche: Tranche, fields: Record<string, unknown>, source = open.sourceId): PackRecord {
  return { id, tranche, region: "toronto", fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, { value, source_id: source, licence: "ODbL-1.0", retrieved_at: "2026-11-01", tier: "source" }])) };
}
const fixtures = [
  record("osm-toilet", "washroom", { name: "Public toilet", wheelchair: "UNKNOWN", changing_table: "yes" }),
  record("municipal-toilet", "washroom", { name: "Kingston washroom", adult_changing_table: "yes" }),
  record("parking", "venue", { name: "Parking lot", amenity: "parking", capacity_disabled: 3 }),
  record("charging", "venue", { name: "Charging stop", wheelchair_charging: "yes" }),
  record("repair", "venue", { name: "Repair shop", wheelchair_repair: "yes" }),
  record("held-parking", "venue", { name: "Restricted lot", amenity: "parking" }, held.sourceId),
];
const manifest: PackManifest = { version: 1, builtAt: "2026-11-01", sourceCommit: "test", sources: [open, held], regions: [{ id: "toronto", label: { en: "Toronto", fr: "Toronto" }, bbox: [-80, 43, -79, 44], cells: ["n43.5_w079.5"] }], tranches: {}, search: {}, counts: { records: 5, byTranche: {}, bySource: {} } };
function fixtureSource(): PackSource & { search: ReturnType<typeof vi.fn>; cellsFor: ReturnType<typeof vi.fn> } {
  return {
    manifest: async () => manifest,
    cellsFor: vi.fn(async () => ["n43.5_w079.5"]),
    async *records(tranche) { for (const value of fixtures) if (value.tranche === tranche) yield value; },
    search: vi.fn(async (text: string) => fixtures.filter((value) => String(value.fields.name?.value).toLowerCase().includes(text.toLowerCase())).map((value) => ({ id: value.id, tranche: value.tranche, name: String(value.fields.name?.value), nameNorm: "", lat: 43.7, lon: -79.5 }))),
    get: async (id) => fixtures.find((value) => value.id === id) ?? null,
    sourcesFor: () => [open], regions: async () => [], downloadRegion: async () => ({ id: "toronto" }), deleteRegion: async () => {},
  };
}
describe("pack-backed finders", () => {
  it.each(["washroom", "parking", "changing", "charging", "repair"] as const)("returns sourced %s records", async (kind) => {
    const result = await queryPackFinders(fixtureSource(), { kind });
    expect(result.count).toBeGreaterThan(0);
    for (const row of result.rows) for (const fact of row.fields) {
      expect(fact.source).toBeTruthy(); expect(fact.licence).toBeTruthy(); expect(fact.retrieved).toBeTruthy(); expect(fact.tier).toBeTruthy();
    }
    expect(result.rows.some((row) => row.id === "held-parking")).toBe(false);
  });
  it("exposes all fourteen washroom fields and keeps unknown unclassified", async () => {
    const result = await queryPackFinders(fixtureSource(), { kind: "washroom", needs: ["wheelchair"] });
    expect(result.rows[0]?.fields.map((field) => field.key)).toEqual(expect.arrayContaining([...WASHROOM_KEYS]));
    const row = result.rows.find((item) => item.id === "osm-toilet");
    expect(row?.unknownNeeds).toBe(1); expect(row?.excluded).toBe(false);
    expect(row?.fields.find((field) => field.key === "wheelchair")?.unknown).toBe(true);
  });
  it("uses search for destination text and cells for nearby places", async () => {
    const source = fixtureSource();
    expect((await queryPackFinders(source, { kind: "parking", text: "lot" })).count).toBe(1);
    expect(source.search).toHaveBeenCalledWith("lot", expect.objectContaining({ tranches: expect.any(Array) }));
    await queryPackFinders(source, { kind: "washroom", near: { lat: 43.7, lon: -79.5, radiusM: 500 } });
    expect(source.cellsFor).toHaveBeenCalledWith({ lat: 43.7, lon: -79.5, radiusM: 500 });
  });
  it("reports zero without inventing a charging or repair service", async () => {
    for (const kind of ["charging", "repair"] as const) {
      const result = await queryPackFinders(fixtureSource(), { kind, text: "nothing matching" });
      expect(result.count).toBe(0); expect(result.rows).toEqual([]);
    }
  });
  it("broaden restores known-no records; unknown is neither yes nor no", async () => {
    const source = fixtureSource();
    expect((await queryPackFinders(source, { kind: "parking", needs: ["wheelchair"] })).count).toBe(1);
    expect((await queryPackFinders(source, { kind: "parking", needs: ["amenity"] })).count).toBe(0);
    expect((await queryPackFinders(source, { kind: "parking", needs: ["amenity"], broaden: true })).count).toBe(1);
  });
  it("keeps demonstration imports out of the shell entry graph", () => {
    for (const file of ["react/pack-module.tsx", "react/PackFindersPage.tsx", "pack-finders.ts", "pack-types.ts"]) {
      const body = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../src", file), "utf8");
      expect(body).not.toMatch(/(?:from\s*["'][^"']*(?:\/demo\/|\/test\/|fixtures)|import\([^)]*(?:\/demo\/|\/test\/|fixtures))/i);
    }
  });
});
