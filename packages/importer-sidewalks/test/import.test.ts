// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFile, mkdtemp, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { SOURCES, sourceById } from "../src/sources.ts";
import { arcgisPages, ckanPages, parseJsonLines } from "../src/readers.ts";
import { mapFeature } from "../src/mapping.ts";
import { validateRecord, validateReport } from "../src/schema.ts";
import { FACT_KEYS } from "../src/types.ts";
import type { Feature, ImportedRecord } from "../src/index.ts";
import { writePartitions } from "../src/io.ts";
import { run } from "../src/cli.ts";
const date = "2026-11-15";
const fixture = async (name: string): Promise<Record<string, unknown>> => JSON.parse(await readFile(new URL(`./fixtures/${name}`, import.meta.url), "utf8")) as Record<string, unknown>;
const features = async (file: string): Promise<Feature[]> => (await fixture(file)).features as Feature[];
const mapped = (source: string, feature: Feature): ImportedRecord => mapFeature(sourceById(source), feature, date);

describe("source registry", () => {
  it("has eight unique sources and does not overlap the earlier map import", () => {
    const earlier = "osm-ontario gtfs-ttc gtfs-go-transit gtfs-up-express gtfs-grt-bus gtfs-grt-ion gtfs-miway gtfs-brampton gtfs-hsr gtfs-ltc toronto-park-washrooms toronto-street-washrooms toronto-crem-washrooms gtfs-rt-ttc-accessibility kingston-public-washrooms kingston-accessible-features brampton-recreation-centres sudbury-fieldhouses mto-picnic-parks".split(" ");
    expect(SOURCES).toHaveLength(8);
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(8);
    for (const source of SOURCES) {
      expect(earlier).not.toContain(source.id);
      expect(source.licenceUrl.startsWith("https://")).toBe(true);
    }
    expect(SOURCES.filter((s) => s.licenceStatus === "open")).toHaveLength(3);
  });
});
describe("mapping", () => {
  it("maps Brampton's real Esri JSON with no invented physical facts", async () => {
    const page = await fixture("brampton-sidewalks.page.esrijson");
    const records = (page.features as Feature[]).map((f) => mapped("brampton-sidewalks", f));
    expect(records).toHaveLength(2);
    expect(records[0]?.id).toBe("brampton-sidewalks:1");
    expect(records[0]?.geometry?.type).toBe("LineString");
    for (const r of records) {
      expect(validateRecord(r)).toBe(true);
      for (const key of FACT_KEYS) expect(r.facts[key]).toMatchObject({ value: null, provenance: null });
      expect(r.raw).toMatchObject({ DESCR: "SIDEWALK-PUBLIC" });
      expect(r.raw).not.toHaveProperty("Shape__Length");
    }
  });
  it("maps Toronto's real CKAN page and keeps both presence fields", async () => {
    const page = await fixture("toronto-pedestrian-network.page.json");
    const records = (page.result as { records: Record<string, unknown>[] }).records;
    for (const row of records) {
      const r = mapped("toronto-pedestrian-network", { attributes: row, geometry: JSON.parse(row.geometry as string) as unknown });
      expect(validateRecord(r)).toBe(true);
      expect(r.facts.sidewalkPresence.value).toBe(`${row.SIDEWALK_CODE}: ${row.SIDEWALK_DESCRIPTION}`);
      expect(r.facts.sidewalkCode.provenance?.tier).toBe(0);
    }
  });
  it("maps Kitchener's explicit facts and preserves unknown", async () => {
    const [a, b] = await features("demo-kitchener-sidewalks.esrijson");
    const r = mapped("kitchener-sidewalks", a!);
    expect(validateRecord(r)).toBe(true);
    expect(r.facts.widthM.value).toBe(1.8);
    expect(r.facts.curbCut.value).toBe("yes");
    expect(r.facts.railing.value).toBe("no");
    expect(r.facts.grade.value).toBe("flat");
    expect(r.facts.surfaceMaterial.value).toBe("Demo concrete");
    expect(r.facts.surfaceCondition.value).toBe("Demo good");
    expect(r.facts.conditionDate.value).toBe(date);
    const unknown = mapped("kitchener-sidewalks", b!);
    for (const key of ["widthM", "curbCut", "railing", "grade", "surfaceCondition", "conditionDate"] as const) expect(unknown.facts[key]).toMatchObject({ value: null, provenance: null });
    expect(mapped("kitchener-sidewalks", { attributes: { OBJECTID: 3, WIDTH_M: 11, CURBCUT: "accessible", GRADE: "NONE" }, geometry: null }).facts.widthM.value).toBeNull();
  });
  it("keeps London bands verbatim and never numeric", async () => {
    for (const f of await features("demo-london-sidewalks.esrijson")) {
      const r = mapped("london-sidewalks", f);
      expect(typeof r.facts.widthBand.value).toBe("string");
      expect(r.facts.widthM.value).toBeNull();
      expect(validateRecord(r)).toBe(true);
    }
    expect(mapped("london-walkways", { attributes: { OBJECTID: 7 }, geometry: null }).kind).toBe("walkway");
  });
  it("uses Ottawa type and retains both languages", async () => {
    const [mup, path, sidewalk] = await features("demo-ottawa-pednet.esrijson");
    expect(mapped("ottawa-pedestrian-network", mup!).kind).toBe("multi-use-path");
    expect(mapped("ottawa-pedestrian-network", path!).kind).toBe("walkway");
    expect(mapped("ottawa-pedestrian-network", sidewalk!).kind).toBe("sidewalk");
    expect(mapped("ottawa-pedestrian-network", mup!).name.fr.value).toBe("Sentier fictif partagé");
  });
  it("maps Waterloo text, Toronto crosswalk and Toronto area without inference", () => {
    const waterloo = mapped("waterloo-sidewalks", { attributes: { OBJECTID: 1, SURFACE: "Demo asphalt", PATH_TYPE: "MUP", CLEARED_BY: "Demo city" }, geometry: { rings: [[[-80.5, 43.4], [-80.6, 43.4], [-80.5, 43.4]]] } });
    expect(waterloo.kind).toBe("multi-use-path");
    expect(waterloo.geometry?.type).toBe("Polygon");
    expect(waterloo.facts.clearedBy.value).toBe("Demo city");
    expect(mapped("toronto-pedestrian-network", { attributes: { OBJECTID: 1, CROSSWALK: 1 }, geometry: null }).kind).toBe("crosswalk");
    const topo = mapped("toronto-topo-sidewalks", { attributes: { OBJECTID: 1, SUBTYPE_DESC: "Demo footprint" }, geometry: null });
    expect(topo.kind).toBe("sidewalk-area");
    expect(topo.facts.widthM.value).toBeNull();
  });
  it("validates sourced invariants and rejects invalid geometry", () => {
    const r = mapped("brampton-sidewalks", { attributes: { OBJECTID: 1 }, geometry: null });
    r.facts.widthM.value = 1;
    expect(validateRecord(r)).toBe(false);
    r.facts.widthM.provenance = r.name.en.provenance;
    expect(validateRecord(r)).toBe(false);
    expect(() => mapped("brampton-sidewalks", { attributes: { OBJECTID: 1 }, geometry: { paths: [[[200, 0], [201, 0]]] } })).toThrow();
  });
});
describe("streaming readers", () => {
  it("pages ArcGIS with injected fetch and offset", async () => {
    const page = await fixture("brampton-sidewalks.page.esrijson");
    const calls: string[] = [];
    const fetcher = async (url: string): Promise<unknown> => { calls.push(url); return calls.length === 1 ? page : { features: [] }; };
    const items: Feature[] = [];
    for await (const f of arcgisPages(sourceById("brampton-sidewalks"), fetcher, 2)) items.push(f);
    expect(items).toHaveLength(2);
    expect(calls[1]).toContain("resultOffset=2");
    expect(calls[0]).toContain("outSR=4326");
  });
  it("pages CKAN without loading a complete dataset", async () => {
    const page = await fixture("toronto-pedestrian-network.page.json");
    const calls: string[] = [];
    const fetcher = async (url: string): Promise<unknown> => {
      calls.push(url);
      return calls.length === 1 ? page : { result: { records: [], total: 3 } };
    };
    const rows: Feature[] = [];
    for await (const row of ckanPages(sourceById("toronto-pedestrian-network"), fetcher, 3)) rows.push(row);
    expect(rows).toHaveLength(3);
    expect(calls[1]).toContain("offset=3");
  });
  it("parses async line streams", async () => {
    async function* lines() { yield '{"a":1}'; yield " "; yield '{"a":2}'; }
    const values = [];
    for await (const value of parseJsonLines(lines())) values.push(value);
    expect(values).toEqual([{ a: 1 }, { a: 2 }]);
  });
});
describe("partition writer and licence gate", () => {
  it("writes bounded gzip parts with checksums from 5000 generated segments", async () => {
    const directory = await mkdtemp(join(tmpdir(), "sidewalk-test-"));
    async function* records(): AsyncGenerator<ImportedRecord> {
      for (let i = 0; i < 5000; i++) yield mapped("brampton-sidewalks", { attributes: { OBJECTID: i, DESCR: "Demo" }, geometry: { paths: [[[-79.7, 43.7], [-79.71, 43.71]]] } });
    }
    const parts = await writePartitions(records(), directory, 4096);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.reduce((sum, p) => sum + p.records, 0)).toBe(5000);
    for (const part of parts) {
      const bytes = await readFile(join(directory, part.file));
      expect((await stat(join(directory, part.file))).size).toBe(part.bytes);
      expect(part.bytes).toBeLessThanOrEqual(4096);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(part.sha256);
      expect(gunzipSync(bytes).toString().trim().split("\n")).toHaveLength(part.records);
    }
    const manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8")) as { records: number };
    expect(manifest.records).toBe(5000);
  });
  it("holds unapproved sources and validates the report without fetching", async () => {
    const directory = await mkdtemp(join(tmpdir(), "sidewalk-held-"));
    const report = await run("kitchener-sidewalks", directory);
    expect(report.heldByLicence).toBe(true);
    expect(report.emitted).toBe(0);
    expect(validateReport(report)).toBe(true);
    expect((await readFile(join(directory, "held/kitchener-sidewalks/report.json"), "utf8"))).toContain("coverageClaim");
  });
});
