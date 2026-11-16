import { describe, expect, it, vi } from "vitest";
import { adultChangeVerdict, queryPackFinders, WASHROOM_KEYS } from "../src/pack-finders.js";
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
  record("no-table", "washroom", { name: "No change table", changing_table: "no" }),
  record("adult-no", "washroom", { name: "Adult table absent", adult_changing_table: "no" }),
  record("generic-and-adult-no", "washroom", { name: "Baby table only", changing_table: "yes", adult_changing_table: "no" }),
  record("unknown-adult", "washroom", { name: "Adult table unknown", adult_changing_table: "UNKNOWN" }),
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
  it("lists only known-yes adult change tables and keeps no and unknown apart", async () => {
    const result = await queryPackFinders(fixtureSource(), { kind: "changing" });
    expect(result.rows.map((row) => row.id)).toEqual(["municipal-toilet"]);
    expect(result.unknownRows.map((row) => row.id).sort()).toEqual(["osm-toilet", "unknown-adult"]);
    expect(result.hidden).toEqual([]);
    expect(result.rows.some((row) => row.id === "no-table" || row.id === "adult-no" || row.id === "generic-and-adult-no")).toBe(false);
    expect(result.unknownRows.some((row) => row.id === "no-table" || row.id === "adult-no" || row.id === "generic-and-adult-no")).toBe(false);
  });
  it("treats a generic changing_table tag as unknown for the adult need", () => {
    expect(adultChangeVerdict(fixtures.find((value) => value.id === "osm-toilet")!)).toBe("unknown");
    expect(adultChangeVerdict(fixtures.find((value) => value.id === "municipal-toilet")!)).toBe("yes");
    expect(adultChangeVerdict(fixtures.find((value) => value.id === "no-table")!)).toBe("no");
    expect(adultChangeVerdict(fixtures.find((value) => value.id === "adult-no")!)).toBe("no");
    expect(adultChangeVerdict(fixtures.find((value) => value.id === "generic-and-adult-no")!)).toBe("no");
    expect(adultChangeVerdict(fixtures.find((value) => value.id === "unknown-adult")!)).toBe("unknown");
    expect(adultChangeVerdict(fixtures.find((value) => value.id === "parking")!)).toBe(null);
  });
  it("does not list known-no changing tables even when broadened", async () => {
    const result = await queryPackFinders(fixtureSource(), { kind: "changing", broaden: true });
    expect(result.rows.map((row) => row.id)).toEqual(["municipal-toilet"]);
    expect(result.hidden).toEqual([]);
    expect(result.rows.concat(result.unknownRows, result.hidden).some((row) => ["no-table", "adult-no", "generic-and-adult-no"].includes(row.id))).toBe(false);
  });
  it.each([
    {
      id: "colon-no-then-yes",
      fields: { name: "Conflict A", "changing_table:adult": "no", adult_changing_table: "yes" },
    },
    {
      id: "colon-yes-then-no",
      fields: { name: "Conflict B", "changing_table:adult": "yes", adult_changing_table: "no" },
    },
    {
      id: "underscore-yes-then-short-no",
      fields: { name: "Conflict C", adult_changing_table: "yes", adult_change_table: "no" },
    },
    {
      id: "underscore-no-then-short-yes",
      fields: { name: "Conflict D", adult_changing_table: "no", adult_change_table: "yes" },
    },
  ])("treats a yes/no adult-alias conflict as a recorded no in the finder ($id)", async ({ id, fields }) => {
    const conflict = record(id, "washroom", fields);
    expect(adultChangeVerdict(conflict)).toBe("no");
    const plus = [...fixtures, conflict];
    const source: PackSource = {
      ...fixtureSource(),
      async *records(tranche) { for (const value of plus) if (value.tranche === tranche) yield value; },
      get: async (recordId) => plus.find((value) => value.id === recordId) ?? null,
    };
    const result = await queryPackFinders(source, { kind: "changing" });
    expect(result.rows.map((row) => row.id)).toEqual(["municipal-toilet"]);
    expect(result.rows.some((row) => row.id === id)).toBe(false);
    expect(result.unknownRows.some((row) => row.id === id)).toBe(false);
    expect(result.count).toBe(1);
    expect(result.count).toBe(result.rows.length);
  });

  it("lists a changing_table:adult yes as a known adult change table", async () => {
    const colonYes = record("colon-adult-yes", "washroom", { name: "Colon adult yes", "changing_table:adult": "yes" });
    expect(adultChangeVerdict(colonYes)).toBe("yes");
    const source: PackSource = {
      ...fixtureSource(),
      async *records() { yield colonYes; },
      get: async (id) => (id === colonYes.id ? colonYes : null),
    };
    const result = await queryPackFinders(source, { kind: "changing" });
    expect(result.rows.map((row) => row.id)).toEqual(["colon-adult-yes"]);
    expect(result.count).toBe(1);
    expect(result.unknownRows).toEqual([]);
  });

  it("keeps demonstration imports out of the shell entry graph", () => {
    for (const file of ["react/pack-module.tsx", "react/PackFindersPage.tsx", "pack-finders.ts", "pack-types.ts"]) {
      const body = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../src", file), "utf8");
      expect(body).not.toMatch(/(?:from\s*["'][^"']*(?:\/demo\/|\/test\/|fixtures)|import\([^)]*(?:\/demo\/|\/test\/|fixtures))/i);
    }
  });
});
