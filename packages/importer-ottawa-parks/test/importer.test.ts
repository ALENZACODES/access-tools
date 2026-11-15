// @vitest-environment node
import { describe, expect, it } from "vitest";
import benches from "./fixtures/layer-28.json";
import buildings from "./fixtures/layer-5.json";
import { accessible, esriGeometry, mapFeature, mapPages } from "../src/mapping.js";
import { featurePages, layerMetadata } from "../src/arcgis.js";
import { layerNames, layers, source } from "../src/sources.js";
import { validateRecord, validateReport } from "../src/schema.js";
import { licenceApproved } from "../src/cli.js";
import type { ArcPage, ImportedRecord, LayerMetadata } from "../src/types.js";

const date = "2026-11-15";
const meta = benches as LayerMetadata & { page: ArcPage };
const buildingsMeta = buildings as LayerMetadata & { page: ArcPage };
const benchName = layers.find(([id]) => id === 28)![1];
function bench(index: number): ImportedRecord {
  return mapFeature(meta.page.features[index]!, 28, benchName, meta, date)!;
}

describe("registry and provenance", () => {
  it("has exactly 25 layers, excludes parking, preserves bilingual service strings", () => {
    expect(layers).toHaveLength(25);
    expect(layers.map(([id]) => id as number)).not.toContain(14);
    expect(new Set(layers.map(([id]) => id)).size).toBe(25);
    expect(layerNames(layers[2]![1]).fr).toContain("terrain de l'école");
    expect(layers.every(([, name]) => !name.includes("\u200B"))).toBe(true);
    expect(layerNames("Ball Diamonds School / Terrains de balle sur \u200B\u200Ble terrain de l'école").fr).toBe("Terrains de balle sur le terrain de l'école");
    expect(layerNames("Only English").fr).toBeNull();
    expect(layerNames(layers[8]![1]).en).toBe("Lawn Bowling");
  });
  it("does not collide with already imported sources", () => {
    const imported = `osm-ontario gtfs-ttc gtfs-go-transit gtfs-up-express gtfs-grt-bus gtfs-grt-ion gtfs-miway gtfs-brampton gtfs-hsr gtfs-ltc toronto-park-washrooms toronto-street-washrooms toronto-crem-washrooms gtfs-rt-ttc-accessibility kingston-public-washrooms kingston-accessible-features brampton-recreation-centres sudbury-fieldhouses mto-picnic-parks`.split(" ");
    expect(imported).not.toContain(source.id);
  });
  it("labels demonstration data, never asserts an entrance, washroom or step-free route", () => {
    const record = bench(0);
    expect(record.id).toBe("ottawa-parks-inventory:28:42");
    expect(record.name.en.value).toBe("Demonstration bench");
    expect(record.name.fr.value).toBe("Banc de démonstration");
    expect(record.facts.cityAccessibleFlag.value).toBe("yes");
    expect(record.facts.cityAccessibleFlag.provenance).toMatchObject({
      tier: 0, prototypeLabel: "SEEDED-OPEN-DATA", verifierType: "open-data-import",
      sourceId: source.id, sourceDate: date, recordDate: date, retrievedAt: date,
    });
    for (const key of ["stepFree", "washroom", "entrance"] as const) {
      expect(record.facts[key]).toEqual({ value: null, provenance: null, photoSlotIds: [] });
    }
    expect(record.raw).not.toHaveProperty("EMAIL");
    expect(validateRecord(record), JSON.stringify(validateRecord.errors)).toBe(true);
  });
  it("retains unknowns and layer edit date, never makes up French name", () => {
    const record = bench(1);
    expect(record.facts.cityAccessibleFlag).toEqual({ value: null, provenance: null, photoSlotIds: [] });
    expect(record.unknownReasons.cityAccessibleFlag).toBe("unmapped-value");
    expect(record.name.fr.value).toBeNull();
    expect(record.geometryReason).toBe("missing-geometry");
    expect(record.name.en.provenance?.sourceDate).toBe(date);
    expect(validateRecord(record)).toBe(true);
  });
  it("uses run date only when no source date exists and notes that fallback", () => {
    const record = mapFeature(buildingsMeta.page.features[0]!, 5, layers.find(([id]) => id === 5)![1], buildingsMeta, date)!;
    expect(record.notes).toContain("source-date-fallback-to-run-date");
    expect(record.facts.cityAccessibleFlag.value).toBe("no");
    expect(record.geometry?.type).toBe("MultiLineString");
    expect(validateRecord(record)).toBe(true);
  });
});

describe("explicit values only", () => {
  it.each([
    ["yes/oui", "yes"], [" YES/OUI ", "yes"], ["y", "yes"], ["Y", "yes"],
    ["no/non", "no"], [" NO/NON ", "no"], ["n", "no"],
    [null, null], ["", null], ["yes", null], ["no", null], ["accessible", null],
    ["unknown", null], [0, null], [-1, null], [true, null],
  ])("maps %s to %s", (input, expected) => expect(accessible(input)).toBe(expected));
  it("beaches and pathway links stay UNKNOWN when empty", () => {
    for (const id of [0, 23]) {
      const record = mapFeature({ attributes: { OBJECTID: 1, ACCESSIBLE: null } }, id,
        layers.find(([number]) => number === id)![1], meta, date)!;
      expect(record.facts.cityAccessibleFlag.value).toBeNull();
      expect(record.unknownReasons.cityAccessibleFlag).toBe("unmapped-value");
    }
  });
  it("drops sensitive and unlisted fields from raw", () => {
    const record = mapFeature({ attributes: { OBJECTID: 1, NAME: "Demo", EMAIL: "private@example.invalid",
      PHONE: "555", NOTES: "Do not expose", ACCESSIBLE: "y" } }, 28, benchName,
      { ...meta, fields: [...meta.fields, { name: "EMAIL" }, { name: "PHONE" }, { name: "NOTES" }] }, date)!;
    expect(record.raw).toEqual({ OBJECTID: 1, NAME: "Demo", ACCESSIBLE: "y" });
  });
});

describe("geometry", () => {
  it("converts point, single/multi path, and rings preserving order", () => {
    expect(esriGeometry({ x: -75, y: 45 }).geometry).toEqual({ type: "Point", coordinates: [-75, 45] });
    expect(esriGeometry({ paths: [[[0, 0], [1, 1]]] }).geometry?.type).toBe("LineString");
    expect(esriGeometry({ paths: [[[0, 0], [1, 1]], [[2, 2], [3, 3]]] }).geometry?.type).toBe("MultiLineString");
    const rings = [[[0, 0], [4, 0], [4, 4], [0, 0]], [[1, 1], [2, 1], [2, 2], [1, 1]]];
    expect(esriGeometry({ rings }).geometry).toEqual({ type: "Polygon", coordinates: rings });
    expect(esriGeometry(null).reason).toBe("missing-geometry");
    expect(esriGeometry({ paths: [[[0, 0]]] }).reason).toBe("invalid-geometry");
  });
});

describe("ArcGIS streaming", () => {
  it("requests metadata and ordered 2000-row pages with injected fetch", async () => {
    const calls: URL[] = [];
    const fetcher = (async (input: string | URL | Request) => {
      const url = new URL(String(input)); calls.push(url);
      const data = url.pathname.endsWith("/query")
        ? { features: [{ attributes: { OBJECTID: 1 } }], exceededTransferLimit: false }
        : { fields: [{ name: "OBJECTID" }] };
      return new Response(JSON.stringify(data), { status: 200 });
    }) as typeof fetch;
    expect((await layerMetadata(28, fetcher)).fields).toHaveLength(1);
    const pages = [];
    for await (const page of featurePages(28, fetcher)) pages.push(page);
    expect(pages).toHaveLength(1);
    expect(calls[1]?.searchParams.get("resultRecordCount")).toBe("2000");
    expect(calls[1]?.searchParams.get("resultOffset")).toBe("0");
    expect(calls[1]?.searchParams.get("orderByFields")).toBe("OBJECTID");
    expect(calls[1]?.searchParams.get("outSR")).toBe("4326");
    expect(calls[1]?.searchParams.get("where")).toBe("1=1");
    expect(calls[1]?.searchParams.get("outFields")).toBe("*");
  });
  it("continues on full pages or exceededTransferLimit, one page at a time", async () => {
    let requests = 0;
    const fetcher = (async () => {
      requests++;
      return new Response(JSON.stringify({
        features: requests <= 2 ? [{ attributes: { OBJECTID: requests } }] : [],
        exceededTransferLimit: requests === 1,
      }));
    }) as typeof fetch;
    const iterator = featurePages(28, fetcher, source.apiUrl, 1);
    await iterator.next(); expect(requests).toBe(1);
    await iterator.next(); expect(requests).toBe(2);
    await iterator.next(); expect(requests).toBe(3);
    expect((await iterator.next()).done).toBe(true);
    const records = [];
    async function* pages(): AsyncGenerator<ArcPage> { yield meta.page; }
    for await (const record of mapPages(pages(), 28, benchName, meta, date)) records.push(record);
    expect(records).toHaveLength(2);
  });
  it("rejects ArcGIS errors rather than silently treating them as empty", async () => {
    const fetcher = (async () => new Response(JSON.stringify({ error: { message: "Unavailable" } }))) as typeof fetch;
    await expect(layerMetadata(28, fetcher)).rejects.toThrow("Unavailable");
  });
});

describe("licence and JSON schemas", () => {
  it("holds by default and rejects incomplete or negative licence decisions", () => {
    expect(licenceApproved(null)).toBe(false);
    expect(licenceApproved({ checkedOn: date, urlRead: "https://example.org/licence", result: "not-open" })).toBe(false);
    expect(licenceApproved({ checkedOn: date, urlRead: "", result: "open" })).toBe(false);
    expect(licenceApproved({ checkedOn: date, urlRead: "https://example.org/licence", result: "open-recorded" })).toBe(true);
  });
  it("requires provenance iff values are present and validates report shape", () => {
    const valid = bench(0);
    expect(validateRecord({ ...valid, facts: { ...valid.facts,
      cityAccessibleFlag: { ...valid.facts.cityAccessibleFlag, provenance: null } } })).toBe(false);
    expect(validateRecord({ ...valid, facts: { ...valid.facts,
      cityAccessibleFlag: { value: null, provenance: valid.facts.cityAccessibleFlag.provenance, photoSlotIds: [] } } })).toBe(false);
    const report = { sourceId: source.id, read: 2, emitted: 2, rejected: {},
      unknownFieldCount: { cityAccessibleFlag: 1 }, heldByLicence: true, retrievedAt: date,
      partitions: [], coverageClaim: false, summary: { en: "Not coverage", fr: "Pas une couverture" } };
    expect(validateReport(report)).toBe(true);
    expect(validateReport({ ...report, coverageClaim: true })).toBe(false);
  });
});
