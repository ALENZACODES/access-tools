// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { csvRows, textLines } from "../src/csv.js";
import { SOURCES, sourceById } from "../src/sources.js";
import { blankReport, importStops, licenceHeld } from "../src/importer.js";
import { validateRecord, validateReport } from "../src/schema.js";
import type { ImportedRecord, LicenceRecord } from "../src/types.js";

const day = "2026-11-15";
const fixture = async (name: string) => readFile(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), "utf8");
async function load(sourceId: string, text: string) {
  const source = sourceById(sourceId);
  const report = blankReport(source, day, licenceHeld(source));
  const records: ImportedRecord[] = [];
  for await (const record of importStops(textLines(text), source, { runDate: day, report })) {
    expect(validateRecord(record), JSON.stringify(validateRecord.errors)).toBe(true);
    records.push(record);
  }
  expect(validateReport(report), JSON.stringify(validateReport.errors)).toBe(true);
  return { records, report };
}
describe("GTFS registry and permissions", () => {
  it("has exactly 13 feeds and excludes all feeds already imported", () => {
    expect(SOURCES).toHaveLength(13);
    const excluded = ["gtfs-ttc", "gtfs-go-transit", "gtfs-up-express", "gtfs-grt-bus", "gtfs-grt-ion", "gtfs-miway", "gtfs-brampton", "gtfs-hsr", "gtfs-ltc"];
    expect(SOURCES.map((s) => s.id).filter((id) => excluded.includes(id))).toEqual([]);
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(13);
  });
  it("uses the official Kingston and Sudbury attribution statements and licence documents", () => {
    const kingston = sourceById("gtfs-kingston-transit");
    expect(kingston.attribution).toBe("Contains information licensed under the Open Data Licence \u2013 City of Kingston.");
    expect(kingston.licenceUrl).toBe("https://www.cityofkingston.ca/media/wtpgpkb0/gis_license_opendata.pdf");
    const sudbury = sourceById("gtfs-sudbury-gova");
    expect(sudbury.attribution).toBe("Contains information licensed under the Open Data Licence \u2013 City of Greater Sudbury.");
    expect(sudbury.licenceUrl).toBe("https://www.greatersudbury.ca/city-hall/open-government/open-data/licence/");
  });
  it("holds verify/unknown without a reviewed licence record", () => {
    for (const source of SOURCES) expect(licenceHeld(source)).toBe(!["open", "open-recorded"].includes(source.licenceStatus));
    const yrt = sourceById("gtfs-yrt");
    const granted: LicenceRecord = { checkedOn: day, urlRead: yrt.licenceUrl, result: "permission-granted" };
    expect(licenceHeld(yrt, granted)).toBe(false);
    expect(licenceHeld(yrt, { ...granted, result: "restricted" })).toBe(true);
    expect(licenceHeld(yrt, { ...granted, checkedOn: "bad" })).toBe(true);
  });
});
describe("streaming mappings", () => {
  it.each(["gtfs-kingston-stops.sample.txt", "gtfs-sudbury-stops.sample.txt"])("preserves all-zero %s as UNKNOWN", async (name) => {
    const id = name.includes("kingston") ? "gtfs-kingston-transit" : "gtfs-sudbury-gova";
    const { records, report } = await load(id, await fixture(name));
    expect(records).toHaveLength(5);
    expect(report.read).toBe(5);
    expect(report.shareKnown).toBe(0);
    expect(report.wheelchairBoarding).toEqual({ known: 0, derived: 0, unknown: 5 });
    expect(records.every((r) => r.facts.wheelchairBoarding.provenance === null)).toBe(true);
    expect(records[0]?.id).toBe(`${id}:${records[0]?.upstreamId}`);
  });
  it("distinguishes station, stop, entrance, inheritance, unknown parents and bad points", async () => {
    const { records, report } = await load("gtfs-kingston-transit", await fixture("demo-stops-hierarchy.txt"));
    const byId = Object.fromEntries(records.map((r) => [r.upstreamId, r]));
    expect(records).toHaveLength(10);
    expect(report.rejected["location-type-3"]).toBe(1);
    expect(report.rejected["location-type-4"]).toBe(1);
    expect(report.byLocationType).toEqual({ "0": 6, "1": 3, "2": 1, "3": 1, "4": 1 });
    expect(byId["child-before"]?.facts.wheelchairBoarding).toMatchObject({ value: "no-accessible-boarding", derived: true, derivedFrom: "parent-after" });
    expect(byId["child-unknown"]?.facts.wheelchairBoarding.value).toBeNull();
    expect(byId["child-explicit"]?.facts.wheelchairBoarding).toMatchObject({ value: "no-accessible-boarding" });
    expect(byId["child-explicit"]?.facts.wheelchairBoarding.derived).toBeUndefined();
    expect(byId["child-blank"]?.facts.wheelchairBoarding).toMatchObject({ value: "some-accessible-boarding", derived: true });
    expect(byId.entrance?.facts.wheelchairBoarding.value).toBe("accessible-path");
    expect(byId.bad?.geometry).toBeNull();
    expect(report.rejected["bad-coordinates"]).toBe(1);
    expect(byId.orphan?.facts.wheelchairBoarding.value).toBeNull();
    expect(byId.station?.geometry?.coordinates).toEqual([-79, 43]);
    expect(byId.station?.name.provenance?.tier).toBe(0);
  });
  it("maps 2 on entrances to no-accessible-path, never 0 to access", async () => {
    const text = "stop_id,stop_name,stop_lat,stop_lon,location_type,wheelchair_boarding\na,Demo Entry,43,-79,2,2\nb,Demo Other,43,-79,2,0";
    const { records } = await load("gtfs-kingston-transit", text);
    expect(records.map((r) => r.facts.wheelchairBoarding.value)).toEqual(["no-accessible-path", null]);
  });
  it("handles BOM, reordered headers, quoted commas, CRLF and missing columns", async () => {
    const text = '\uFEFFstop_name,stop_lon,stop_id,stop_lat\r\n"Demo, Stop",-79,z,43\r\n';
    const { records } = await load("gtfs-kingston-transit", text);
    expect(records[0]?.name.value).toBe("Demo, Stop");
    expect(records[0]?.facts.wheelchairBoarding.value).toBeNull();
  });
  it("supports escaped quotes and quoted embedded newlines", async () => {
    const rows = [];
    for await (const row of csvRows(textLines('stop_id,stop_name\na,"Demo ""Place""\nTwo"'))) rows.push(row);
    expect(rows).toEqual([{ stop_id: "a", stop_name: 'Demo "Place"\nTwo' }]);
  });
  it("rejects duplicate IDs and does not leak extra personal columns", async () => {
    const { records, report } = await load("gtfs-kingston-transit", "stop_id,stop_name,stop_lat,stop_lon,contact_email\nx,Demo,43,-79,private@example.invalid\nx,Demo,43,-79,private@example.invalid");
    expect(records).toHaveLength(1);
    expect(report.rejected["missing-or-duplicate-id"]).toBe(1);
    expect(JSON.stringify(records)).not.toContain("private@example.invalid");
  });
});
