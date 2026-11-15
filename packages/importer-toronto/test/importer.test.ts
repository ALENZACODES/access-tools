// @vitest-environment node
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { datastorePages, findResources, type CkanPage, type JsonFetch } from "../src/ckan.js";
import { licenceAllowed, newReport, finishReport, importPages } from "../src/importer.js";
import { mapRow } from "../src/map.js";
import { validateRecord, validateReport } from "../src/schema.js";
import { SOURCES, sourceById } from "../src/sources.js";
import { FACT_KEYS, type ImportedRecord } from "../src/types.js";
const day = "2026-11-15";
async function fixture(name: string): Promise<CkanPage> {
  const parsed = JSON.parse(await readFile(new URL(`./fixtures/${name}`, import.meta.url), "utf8")) as { result: CkanPage };
  return parsed.result;
}
async function* one(page: CkanPage) { yield page; }
async function collect(sourceId: string, fixtureName: string, approval?: { checkedOn: string; urlRead: string; result: "open" }) {
  const source = sourceById(sourceId);
  const report = newReport(source, day);
  const result: ImportedRecord[] = [];
  for await (const record of importPages(one(await fixture(fixtureName)), source, "2026-11-14", report, approval)) result.push(record);
  return { result, report: finishReport(report) };
}

describe("CKAN resource discovery and streaming pagination", () => {
  it("selects by exact resource name and extracts refresh date", async () => {
    const source = sourceById("toronto-traffic-signals-aps");
    const client: JsonFetch = async (url) => {
      expect(url).toContain("package_show?id=traffic-signals-tabular");
      return { result: { resources: [{ name: "Traffic Signal", datastore_active: true, id: "resource-1", last_refreshed: "2026-11-14T09:10:00" }] } };
    };
    expect(await findResources(source, client)).toEqual([{ name: "Traffic Signal", id: "resource-1", sourceDate: "2026-11-14" }]);
  });
  it("fetches pages until total with limit 1000, without a whole-dataset buffer", async () => {
    const page = await fixture("toronto-traffic-signal.page.json");
    const urls: string[] = [];
    const client: JsonFetch = async (url) => {
      urls.push(url);
      const offset = Number(new URL(url).searchParams.get("offset"));
      const total = 5;
      return { result: { ...page, total, records: offset === 0 ? page.records.slice(0, 4) : page.records.slice(0, 1) } };
    };
    const sizes: number[] = [];
    for await (const result of datastorePages("https://example.invalid/api", "resource-1", client)) sizes.push(result.records.length);
    expect(sizes).toEqual([4, 1]);
    expect(urls.map((url) => new URL(url).searchParams.get("offset"))).toEqual(["0", "4"]);
    expect(urls.every((url) => new URL(url).searchParams.get("limit") === "1000")).toBe(true);
    const recorded: JsonFetch = async () => ({ result: page });
    const stream = datastorePages("https://example.invalid/api", "resource-1", recorded);
    expect((await stream.next()).value?.records).toEqual(page.records);
    await stream.return(undefined);
  });
});

describe("mapping", () => {
  it("emits real traffic signal fixtures: 1,1,-1,null APS without guesses", async () => {
    const { result, report } = await collect("toronto-traffic-signals-aps", "toronto-traffic-signal.page.json");
    expect(result.map((record) => record.facts.accessiblePedestrianSignal.value)).toEqual(["present", "present", null, null]);
    expect(result[0]?.upstreamId).toBe("0003");
    expect(result[0]?.id).toBe("toronto-traffic-signals-aps:0003");
    expect(result[0]?.geometry).toEqual({ type: "Point", coordinates: [-79.37189141767716, 43.650461212689684] });
    expect(result[0]?.raw).toMatchObject({ APS_OPERATION: "Pushbutton Actuated", PX: "0003", ACTIVATIONDATE: "1950-08-23T00:00:00", MAIN_STREET: "KING ST E" });
    expect(result[0]?.facts.accessiblePedestrianSignal.provenance).toMatchObject({ tier: 0, sourceDate: "2026-11-14", verifierType: "open-data-import" });
    expect(report.unknownFieldCount.accessiblePedestrianSignal).toBe(2);
    expect(report.read).toBe(4);
    expect(report.emitted).toBe(4);
    expect(result.every((record) => validateRecord(record))).toBe(true);
  });
  it("does not equate APS operation or 0 with APS presence", async () => {
    const page = await fixture("toronto-traffic-signal.page.json");
    const first = { ...page.records[0], AUDIBLEPEDSIGNAL: 0, APS_OPERATION: "Pushbutton Actuated" };
    expect(mapRow(first, sourceById("toronto-traffic-signals-aps"), day, day)?.facts.accessiblePedestrianSignal.value).toBeNull();
  });
  it("keeps crossovers entirely UNKNOWN", async () => {
    const { result } = await collect("toronto-pedestrian-crossovers", "toronto-pedestrian-crossover.page.json");
    expect(result).toHaveLength(2);
    expect(result[0]?.kind).toBe("pedestrian-crossover");
    expect(result[0]?.raw).toMatchObject({ PX: "5010", MAIN_STREET: "BATHURST ST" });
    expect(result.every((record) => FACT_KEYS.every((key) => record.facts[key].value === null && record.facts[key].provenance === null))).toBe(true);
  });
  it("keeps POPS point and polygon wheelchair facts unknown; removes image URLs", async () => {
    for (const name of ["toronto-pops-points.page.json", "demo-pops-polygons.page.json"]) {
      const { result } = await collect("toronto-pops", name);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((record) => FACT_KEYS.every((key) => record.facts[key].value === null))).toBe(true);
      expect(result.every((record) => !("Image URL" in record.raw))).toBe(true);
      expect(result.every((record) => validateRecord(record))).toBe(true);
      expect(result[0]?.raw).toHaveProperty("Status");
    }
    const { result } = await collect("toronto-pops", "demo-pops-polygons.page.json");
    expect(result[0]?.geometry?.type).toBe("Polygon");
  });
  it("keeps parks amenities raw, drops phone, and gates the licence", async () => {
    const source = sourceById("toronto-parks-rec-facilities");
    const denied = await collect(source.id, "demo-park-facilities.page.json");
    expect(denied.report.heldByLicence).toBe(true);
    expect(denied.result).toHaveLength(0);
    expect(licenceAllowed(source, { checkedOn: day, urlRead: "https://example.invalid", result: "open" })).toBe(false);
    const allowed = await collect(source.id, "demo-park-facilities.page.json", { checkedOn: day, urlRead: source.datasetUrl, result: "open" });
    expect(allowed.result[0]?.kind).toBe("park-facility");
    expect(allowed.result[0]?.raw.AMENITIES).toBe("Accessible washroom");
    expect(allowed.result[0]?.raw).not.toHaveProperty("PHONE");
    expect(FACT_KEYS.every((key) => allowed.result[0]?.facts[key].value === null)).toBe(true);
    expect(validateReport(allowed.report)).toBe(true);
  });
  it("keeps missing or invalid geometry null and identifies the reason; falls back to _id", async () => {
    const page = await fixture("toronto-pedestrian-crossover.page.json");
    const record = mapRow({ ...page.records[0], PX: " ", geometry: "broken" }, sourceById("toronto-pedestrian-crossovers"), day, day);
    expect(record?.upstreamId).toBe("1");
    expect(record?.geometry).toBeNull();
    expect(record?.reasons).toEqual(["bad-geometry"]);
    expect(validateRecord(record)).toBe(true);
    expect(mapRow({ _id: 9 }, sourceById("toronto-pops"), day, day)?.reasons).toEqual(["bad-geometry"]);
  });
  it("rejects contradictory sourced provenance and bad reports", async () => {
    const { result, report } = await collect("toronto-pops", "toronto-pops-points.page.json");
    const record = structuredClone(result[0]!);
    record.facts.wheelchairAccessible.provenance = record.name.en.provenance;
    expect(validateRecord(record)).toBe(false);
    report.emitted = -1;
    expect(validateReport(report)).toBe(false);
  });
});

it("registry excludes all sources owned by access-maps #1", () => {
  const imported = new Set("osm-ontario gtfs-ttc gtfs-go-transit gtfs-up-express gtfs-grt-bus gtfs-grt-ion gtfs-miway gtfs-brampton gtfs-hsr gtfs-ltc toronto-park-washrooms toronto-street-washrooms toronto-crem-washrooms gtfs-rt-ttc-accessibility kingston-public-washrooms kingston-accessible-features brampton-recreation-centres sudbury-fieldhouses mto-picnic-parks".split(" "));
  expect(SOURCES).toHaveLength(4);
  expect(SOURCES.every((source) => !imported.has(source.id))).toBe(true);
  expect(SOURCES.every((source) => source.attribution === "Contains information licensed under the Open Government Licence – Toronto.")).toBe(true);
});
