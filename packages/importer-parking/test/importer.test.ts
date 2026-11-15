// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFile, mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { apiPages, jsonLines, parsePages } from "../src/reader.js";
import { esriGeometry, mapRow, positiveCount, unknown } from "../src/model.js";
import { SOURCES, sourceById } from "../src/sources.js";
import { validateImportedRecord, validateImportReport } from "../src/schema.js";
import { licenceAllowed, newReport, countRecord, finishReport, reject } from "../src/report.js";
import { PartitionWriter } from "../src/io.js";

async function fixture(file: string): Promise<unknown> {
  return JSON.parse(await readFile(new URL(`./fixtures/${file}`, import.meta.url), "utf8")) as unknown;
}
async function* one(value: unknown): AsyncGenerator<unknown> { yield value; }
async function records(id: string, filename: string) {
  const results = [];
  for await (const event of parsePages(sourceById(id), one(await fixture(filename)), "2026-11-15")) {
    expect(event.rejection).toBeUndefined();
    expect(validateImportedRecord(event.record)).toBe(true);
    results.push(event.record!);
  }
  return results;
}

describe("parking importer", () => {
  it("keeps registry separate from access-maps #1 IDs", () => {
    const imported = new Set("osm-ontario gtfs-ttc gtfs-go-transit gtfs-up-express gtfs-grt-bus gtfs-grt-ion gtfs-miway gtfs-brampton gtfs-hsr gtfs-ltc toronto-park-washrooms toronto-street-washrooms toronto-crem-washrooms gtfs-rt-ttc-accessibility kingston-public-washrooms kingston-accessible-features brampton-recreation-centres sudbury-fieldhouses mto-picnic-parks".split(" "));
    expect(new Set(SOURCES.map((source) => source.id)).size).toBe(5);
    for (const source of SOURCES) {
      expect(imported.has(source.id)).toBe(false);
      expect(source.name.en && source.name.fr && source.attribution && source.licenceUrl && source.cadence).toBeTruthy();
    }
  });
  it("streams Toronto CKAN page and preserves provenance and geometry", async () => {
    const rows = await records("toronto-accessible-stalls", "toronto-accessible-stalls.page.json");
    expect(rows).toHaveLength(3);
    expect(rows[0]?.id).toBe("toronto-accessible-stalls:1");
    expect(rows[0]?.kind).toBe("accessible-stall");
    expect(rows[0]?.facts.aodaType.value).toBe("type-a");
    expect(rows[0]?.facts.aodaType.provenance?.note).toBe("2024 City of Toronto Aerial");
    expect(rows[0]?.raw.CP_ID_TEXT).toBe("852");
    expect(rows[0]?.raw).not.toHaveProperty("NOTES");
    expect(rows[0]?.geometry?.type).toBe("Point");
    expect(rows[0]?.facts.accessibleSpaces).toEqual(unknown());
    const source = sourceById("toronto-accessible-stalls");
    for (const [input, output] of [["B", "type-b"], ["N/A", null], ["None", null], [null, null]] as const) {
      const row = mapRow(source, { _id: 9, AODA_TYPE: input, SOURCE: "Demo survey", CP_ID_TEXT: "demo" }, "2026-11-15", null);
      expect(row.facts.aodaType.value).toBe(output);
      expect(validateImportedRecord(row)).toBe(true);
    }
  });
  it("uses only positive integer accessible counts and never manufactures zero", async () => {
    for (const value of [0, "", null, -1, "-1", "unknown", "3.5", 2.5]) expect(positiveCount(value)).toBeNull();
    expect(positiveCount(4)).toBe(4);
    expect(positiveCount("7")).toBe(7);
    const mississauga = await records("mississauga-parking-facilities", "demo-mississauga-parking.esrijson");
    expect(mississauga.map((row) => row.facts.accessibleSpaces.value)).toEqual([4, null, null]);
    expect(mississauga[0]?.facts.accessibleSpaces.provenance?.tier).toBe(0);
    const london = await records("london-parking", "demo-london-parking.esrijson");
    expect(london[0]?.facts.accessibleSpaces).toEqual(unknown());
  });
  it("uses Waterloo Y/N flags but never treats CAPACITY as accessible capacity", async () => {
    const rows = await records("waterloo-parking-lots", "demo-waterloo-parking.esrijson");
    expect(rows.map((row) => row.facts.cityAccessibleFlag.value)).toEqual(["yes", "no"]);
    expect(rows.every((row) => row.facts.accessibleSpaces.value === null)).toBe(true);
    expect(rows[0]?.raw.CAPACITY).toBe(80);
    expect(mapRow(sourceById("waterloo-parking-lots"), { OBJECTID: 3, ACCESSIBLE: "unknown" }, "2026-11-15", null).facts.cityAccessibleFlag.value).toBeNull();
  });
  it("keeps Ottawa capacity and bilingual yes/no separate", async () => {
    const rows = await records("ottawa-parks-parking", "demo-ottawa-parks-parking.esrijson");
    expect(rows.map((row) => row.facts.accessibleSpaces.value)).toEqual([3, null, null, 2, 1]);
    expect(rows.map((row) => row.facts.cityAccessibleFlag.value)).toEqual(["yes", "no", null, "yes", "no"]);
  });
  it("drops rate, meter, permit and personal fields and does not invent names or geometry", () => {
    const record = mapRow(sourceById("mississauga-parking-facilities"), {
      OBJECTID: 8, Accessible: 2, Rates: "$", MeterNo: "22", HonkZoneID: "3", phone: "private", Name: "Demo Lot",
    }, "2026-11-15", null);
    expect(record.raw).toEqual({ OBJECTID: 8, Accessible: 2, Name: "Demo Lot" });
    expect(record.name.fr.value).toBeNull();
    expect(record.geometry).toBeNull();
    expect(esriGeometry({ rings: [[[-79, 43], [-79, 44], [-78, 44], [-79, 43]]] })?.type).toBe("Polygon");
    expect(esriGeometry({ paths: [[[-79, 43], [-78, 43]]] })?.type).toBe("LineString");
  });
  it("rejects missing IDs and invalid data without stopping the page stream", async () => {
    const page = { features: [{ attributes: { Accessible: 3 } }, { attributes: { OBJECTID: 4, Accessible: 5 } }, null] };
    const events = [];
    for await (const entry of parsePages(sourceById("mississauga-parking-facilities"), one(page), "2026-11-15")) events.push(entry);
    expect(events.map((entry) => entry.rejection?.reason ?? "ok")).toEqual(["missing-id", "ok", "invalid-row"]);
    const report = newReport(sourceById("mississauga-parking-facilities"), "2026-11-15", false);
    for (const event of events) if (event.record) countRecord(report, event.record); else reject(report, event.rejection!.reason);
    finishReport(report, sourceById("mississauga-parking-facilities"));
    expect([report.read, report.emitted, report.rejected["missing-id"], report.rejected["invalid-row"]]).toEqual([3, 1, 1, 1]);
    expect(report.unknownFieldCount).toEqual({ aodaType: 1, accessibleSpaces: 0, cityAccessibleFlag: 1 });
    expect(report.coverageClaim).toBe(false);
    expect(validateImportReport(report)).toBe(true);
    expect(report.summary.fr).toContain("couverture");
  });
  it("requires affirmative dated licence record for verify sources", () => {
    expect(licenceAllowed(sourceById("toronto-accessible-stalls"))).toBe(true);
    for (const source of SOURCES.filter((entry) => entry.licenceStatus === "verify")) {
      expect(licenceAllowed(source)).toBe(false);
      expect(licenceAllowed(source, { checkedOn: "2026-11-15", urlRead: "https://example.org/terms", result: "not-permitted" })).toBe(false);
      expect(licenceAllowed(source, { checkedOn: "invalid", urlRead: "https://example.org/terms", result: "permitted" })).toBe(false);
      expect(licenceAllowed(source, { checkedOn: "2026-11-15", urlRead: "https://example.org/terms", result: "permitted" })).toBe(true);
      expect(newReport(source, "2026-11-15", true).heldByLicence).toBe(true);
    }
  });
  it("rejects invalid sourced provenance and corrupt reports", async () => {
    const [original] = await records("toronto-accessible-stalls", "toronto-accessible-stalls.page.json");
    const row = structuredClone(original!);
    row.facts.aodaType.provenance = null;
    expect(validateImportedRecord(row)).toBe(false);
    row.facts.aodaType.value = null;
    expect(validateImportedRecord(row)).toBe(true);
    const report = newReport(sourceById("toronto-accessible-stalls"), "2026-11-15", false);
    expect(validateImportReport(report)).toBe(true);
    expect(validateImportReport({ ...report, coverageClaim: true })).toBe(false);
  });
  it("pages CKAN and ArcGIS with injected fetch, not network", async () => {
    for (const source of [sourceById("toronto-accessible-stalls"), sourceById("waterloo-parking-lots")]) {
      const requested: string[] = [];
      const pages = [];
      const fetchPage = async (url: string): Promise<unknown> => {
        requested.push(url);
        return source.kind === "ckan" ? { result: { records: [{ _id: requested.length }], total: 2 } } :
          { features: [{ attributes: { OBJECTID: requested.length } }], exceededTransferLimit: requested.length === 1 };
      };
      for await (const page of apiPages(source, fetchPage, 1)) pages.push(page);
      expect(pages).toHaveLength(2);
      expect(new URL(requested[1]!).searchParams.get(source.kind === "ckan" ? "offset" : "resultOffset")).toBe("1");
      if (source.kind === "arcgis") expect(new URL(requested[0]!).searchParams.get("outSR")).toBe("4326");
    }
    async function* lines() { yield '{"OBJECTID":1}'; yield ""; yield '{"OBJECTID":2}'; }
    const ids = [];
    for await (const item of jsonLines(lines())) ids.push(item.OBJECTID);
    expect(ids).toEqual([1, 2]);
  });
  it("rolls compressed NDJSON partitions, hashes their exact bytes and writes manifest", async () => {
    const dir = await mkdtemp(join(tmpdir(), "parking-parts-"));
    const writer = new PartitionWriter(dir, 90);
    for (let i = 0; i < 4; i++) await writer.write({ i });
    const parts = await writer.close();
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.reduce((sum, part) => sum + part.count, 0)).toBe(4);
    const result = [];
    for (const part of parts) {
      const data = await readFile(join(dir, part.file));
      expect(data.length).toBe(part.bytes);
      expect(data.length).toBeLessThanOrEqual(90);
      expect(createHash("sha256").update(data).digest("hex")).toBe(part.sha256);
      result.push(...gunzipSync(data).toString().trim().split("\n").map((line) => JSON.parse(line) as { i: number }));
    }
    expect(result.map((item) => item.i)).toEqual([0, 1, 2, 3]);
    expect(JSON.parse(await readFile(join(dir, "manifest.json"), "utf8"))).toEqual({ partitions: parts });
    expect(await readdir(dir)).toContain("manifest.json");
  });
});
