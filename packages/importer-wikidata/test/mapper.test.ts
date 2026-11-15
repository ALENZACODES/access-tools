// @vitest-environment node
import { describe, expect, it } from "vitest";
import { P2846_VALUES, parsePointWkt } from "../src/mapper";
import { DATE, mapAll, mapFixture, uri } from "./helpers";

const byId = (records: Awaited<ReturnType<typeof mapFixture>>["records"], q: string) => {
  const r = records.find((x) => x.upstreamId === q);
  if (!r) throw new Error(`missing ${q}`);
  return r;
};

describe("P2846 value mapping", () => {
  it("maps the three known values verbatim", () => {
    expect(P2846_VALUES).toEqual({
      Q24192067: "accessible",
      Q24192069: "partially-accessible",
      Q24192068: "inaccessible",
    });
  });

  it("maps real sample bindings", async () => {
    const { records, stats } = await mapFixture("wikidata-p2846-ontario.sample.json");
    expect(records).toHaveLength(7);
    expect(stats.read).toBe(7);
    expect(byId(records, "Q52692390").facts.wheelchairAccessibilityStatement.value).toBe("inaccessible");
    expect(byId(records, "Q367503").facts.wheelchairAccessibilityStatement.value).toBe("partially-accessible");
    expect(byId(records, "Q511316").facts.wheelchairAccessibilityStatement.value).toBe("accessible");
  });

  it("stores UNKNOWN with reason unmapped-value for any other value", async () => {
    const { records, stats } = await mapFixture("demo-wikidata-edge.json");
    const r = byId(records, "Q900000001");
    expect(r.facts.wheelchairAccessibilityStatement).toEqual({ value: null, provenance: null, photoSlotIds: [] });
    expect(r.unknownReasons.wheelchairAccessibilityStatement).toBe("unmapped-value");
    expect(stats.unknownReasons["unmapped-value"]).toBe(1);
  });

  it("stores UNKNOWN with reason conflicting-statements when values disagree", async () => {
    const { records, stats } = await mapFixture("demo-wikidata-edge.json");
    expect(records.filter((r) => r.upstreamId === "Q900000002")).toHaveLength(1);
    const r = byId(records, "Q900000002");
    expect(r.facts.wheelchairAccessibilityStatement.value).toBeNull();
    expect(r.unknownReasons.wheelchairAccessibilityStatement).toBe("conflicting-statements");
    expect(r.raw.v).toHaveLength(2);
    expect(stats.unknownReasons["conflicting-statements"]).toBe(1);
  });

  it("treats repeated identical values as one statement", async () => {
    const b = { item: uri("Q1"), v: uri("Q24192067") };
    const { records } = await mapAll([b, b]);
    expect(records).toHaveLength(1);
    expect(records[0]?.facts.wheelchairAccessibilityStatement.value).toBe("accessible");
  });

  it("treats a mapped value plus an unmapped one as conflicting", async () => {
    const { records } = await mapAll([
      { item: uri("Q1"), v: uri("Q24192067") },
      { item: uri("Q1"), v: uri("Q123") },
    ]);
    expect(records[0]?.unknownReasons.wheelchairAccessibilityStatement).toBe("conflicting-statements");
  });
});

describe("never maps onto other facts", () => {
  it("leaves stepFree, entrance, washroom and parking UNKNOWN when the statement is accessible", async () => {
    const { records } = await mapFixture("wikidata-p2846-ontario.sample.json");
    const r = byId(records, "Q511316");
    expect(r.facts.wheelchairAccessibilityStatement.value).toBe("accessible");
    for (const k of ["stepFree", "entranceDescription", "washroomAccessible", "parkingAccessible"] as const) {
      expect(r.facts[k]).toEqual({ value: null, provenance: null, photoSlotIds: [] });
    }
  });
});

describe("coordinates", () => {
  it("parses Point(lon lat) into a GeoJSON Point", async () => {
    const { records } = await mapFixture("wikidata-p2846-ontario.sample.json");
    expect(byId(records, "Q511316").geometry).toEqual({ type: "Point", coordinates: [-79.380555555, 43.645277777] });
  });

  it("gives null geometry and reason no-coordinates when missing, and still emits", async () => {
    const { records, stats } = await mapFixture("wikidata-p2846-ontario.sample.json");
    const r = byId(records, "Q105104996");
    expect(r.geometry).toBeNull();
    expect(r.facts.wheelchairAccessibilityStatement.value).toBe("accessible");
    expect(stats.unknownReasons["no-coordinates"]).toBe(1);
  });

  it("gives null geometry for malformed WKT and still emits", async () => {
    const { records, stats } = await mapFixture("demo-wikidata-edge.json");
    expect(byId(records, "Q900000003").geometry).toBeNull();
    expect(stats.unknownReasons["no-coordinates"]).toBe(1);
  });

  it("rejects out-of-range and odd WKT", () => {
    for (const w of ["Point(200 43)", "Point(-79 91)", "Point(-79)", "LineString(1 2, 3 4)", "Point(a b)", "", null, undefined]) {
      expect(parsePointWkt(w)).toBeNull();
    }
    expect(parsePointWkt("Point(-79.5 43.7)")).toEqual({ type: "Point", coordinates: [-79.5, 43.7] });
  });
});

describe("names", () => {
  it("keeps a missing FR label null and does not copy EN across", async () => {
    const { records } = await mapFixture("wikidata-p2846-ontario.sample.json");
    const r = byId(records, "Q52692390");
    expect(r.name.en.value).toBe("Prince of Peace Catholic School");
    expect(r.name.fr).toEqual({ value: null, provenance: null, photoSlotIds: [] });
    expect(r.raw.itemLabel_fr).toBeNull();
  });

  it("keeps a missing FR label null in the demo fixture", async () => {
    const { records } = await mapFixture("demo-wikidata-edge.json");
    expect(byId(records, "Q900000004").name.fr.value).toBeNull();
    expect(byId(records, "Q900000004").name.en.value).toBe("Demo Place 4");
  });

  it("keeps both labels when both exist", async () => {
    const { records } = await mapFixture("wikidata-p2846-ontario.sample.json");
    const r = byId(records, "Q511316");
    expect([r.name.en.value, r.name.fr.value]).toEqual(["Union Station", "Toronto Union"]);
  });
});

describe("identity and provenance", () => {
  it("uses the Q-id, wiki URL and query date", async () => {
    const { records } = await mapFixture("wikidata-p2846-ontario.sample.json");
    const r = byId(records, "Q511316");
    expect(r.id).toBe("wikidata-p2846-ontario:Q511316");
    expect(r.sourceId).toBe("wikidata-p2846-ontario");
    expect(r.facts.wheelchairAccessibilityStatement.provenance).toEqual({
      sourceName: "Wikidata",
      sourceId: "wikidata-p2846-ontario",
      sourceUrl: "https://www.wikidata.org/wiki/Q511316",
      licence: "CC0 1.0",
      sourceDate: DATE,
      recordDate: DATE,
      retrievedAt: DATE,
      tier: 0,
      prototypeLabel: "SEEDED-OPEN-DATA",
      verifierType: "open-data-import",
    });
  });

  it("keeps only the listed source columns in raw", async () => {
    const { records } = await mapFixture("wikidata-p2846-ontario.sample.json");
    expect(Object.keys(byId(records, "Q511316").raw).sort()).toEqual(["coord", "item", "itemLabel_en", "itemLabel_fr", "v"]);
  });
});

describe("rejections and streaming", () => {
  it("rejects bindings without an item or a statement", async () => {
    const { records, stats } = await mapAll([
      { v: uri("Q24192067") },
      { item: { type: "uri", value: "http://example.org/x" }, v: uri("Q24192067") },
      { item: uri("Q5") },
      { item: uri("Q6"), v: uri("Q24192067") },
    ]);
    expect(records.map((r) => r.upstreamId)).toEqual(["Q6"]);
    expect(stats.read).toBe(4);
    expect(stats.rejected).toEqual({ "missing-item": 2, "missing-statement": 1 });
  });

  it("rejects an item that reappears after its group ended", async () => {
    const a = { item: uri("Q1"), v: uri("Q24192067") };
    const { records, stats } = await mapAll([a, { item: uri("Q2"), v: uri("Q24192067") }, a]);
    expect(records.map((r) => r.upstreamId)).toEqual(["Q1", "Q2"]);
    expect(stats.rejected["out-of-order-item"]).toBe(1);
  });
});
