// @vitest-environment node
import { describe, expect, it } from "vitest";
import { COL, parseScore, RAW_COLUMNS } from "#src/map";
import { fixture, run, RUN_DATE, source } from "./helpers";

describe("PSPC mapping", () => {
  it("maps the real Ontario sample", async () => {
    const { records, counters } = await run(fixture("pspc-ontario-sample.csv"));
    expect(records).toHaveLength(4);
    expect(counters).toMatchObject({ read: 4, emitted: 4, rejected: {}, skipped: {} });
    const r = records[0]!;
    expect(r.id).toBe("pspc-building-accessibility:P400002-101-40000309");
    expect(r.upstreamId).toBe("P400002-101-40000309");
    expect(r.kind).toBe("building");
    expect(r.name.value).toBe("Justice Building");
    expect(r.nameFr.value).toBe("Édifice de la Justice");
    expect(r.facts.address.value).toEqual({
      en: "249 Wellington Street",
      fr: "249, rue Wellington",
      city: "Ottawa",
      postalCode: "K1A 0H8",
    });
    expect(r.raw[COL.addressFr]).toBe("249, rue Wellington");
  });

  it("stores the publisher's score, standard and fiscal year", async () => {
    const { records } = await run(fixture("pspc-ontario-sample.csv"));
    expect(records.map((r) => r.facts.accessibilityScore.value)).toEqual([
      { score: 77, standard: "B651-18", assessedFiscalYear: "2020-2021" },
      { score: 48, standard: "B651-18", assessedFiscalYear: "2022-2023" },
      { score: 76, standard: "B651-18", assessedFiscalYear: "2020-2021" },
      { score: 63, standard: "B651-18", assessedFiscalYear: "2021-2022" },
    ]);
  });

  it("sets provenance: tier 0, seeded label, open-data-import, source and run dates", async () => {
    const { records } = await run(fixture("pspc-ontario-sample.csv"));
    expect(records[0]!.facts.accessibilityScore.provenance).toEqual({
      sourceName: source.name.en,
      sourceId: "pspc-building-accessibility",
      sourceUrl: source.datasetUrl,
      licence: "Open Government Licence – Canada 2.0",
      sourceDate: "2026-03-21",
      recordDate: RUN_DATE,
      retrievedAt: RUN_DATE,
      tier: 0,
      prototypeLabel: "SEEDED-OPEN-DATA",
      verifierType: "open-data-import",
    });
  });

  it("has no geometry (never geocoded)", async () => {
    const { records } = await run(fixture("pspc-ontario-sample.csv"));
    expect(records.every((r) => r.geometry === null)).toBe(true);
  });

  it("keeps only the listed source columns in raw, verbatim", async () => {
    const { records } = await run(fixture("pspc-ontario-sample.csv"));
    expect(Object.keys(records[1]!.raw)).toEqual([...RAW_COLUMNS]);
    expect(records[1]!.raw["Property-name_Nom-du-bien_fra"]).toBe("Site Cour Suprême et Bibliothèque nationale et Archives Canada");
  });
});

describe("PSPC edge rules (demonstration rows)", () => {
  it("skips non-ON rows as skipped-out-of-province, not rejected", async () => {
    const { records, counters } = await run(fixture("demo-pspc-edge.csv"));
    expect(counters.skipped).toEqual({ "skipped-out-of-province": 1 });
    expect(records.some((r) => r.upstreamId === "DEMO-002")).toBe(false);
    expect(counters.rejected).not.toHaveProperty("skipped-out-of-province");
  });

  it("requires Province code to be exactly ON", async () => {
    const text = fixture("pspc-ontario-sample.csv").replaceAll(",Ottawa,ON,", ",Ottawa,on,");
    const { counters } = await run(text);
    expect(counters.skipped["skipped-out-of-province"]).toBe(4);
    expect(counters.emitted).toBe(0);
  });

  it("makes the score UNKNOWN and counts the reason: missing, out of range, no standard", async () => {
    const { records, counters } = await run(fixture("demo-pspc-edge.csv"));
    const by = (id: string) => records.find((r) => r.upstreamId === id)!;
    for (const id of ["DEMO-003", "DEMO-004", "DEMO-005"]) {
      expect(by(id).facts.accessibilityScore).toEqual({ value: null, provenance: null, photoSlotIds: [] });
    }
    expect(counters.unknownReasons).toEqual({ "score-missing": 1, "score-out-of-range": 1, "standard-missing": 1 });
    expect(by("DEMO-003").facts.address.value).not.toBeNull();
  });

  it("rejects a duplicate upstream id with reason duplicate-id and keeps the first", async () => {
    const { records, counters } = await run(fixture("demo-pspc-edge.csv"));
    expect(counters.rejected).toEqual({ "duplicate-id": 1 });
    expect(records.filter((r) => r.upstreamId === "DEMO-001")).toHaveLength(1);
    expect(records.find((r) => r.upstreamId === "DEMO-001")!.facts.accessibilityScore.value!.score).toBe(100);
    expect(counters.read).toBe(counters.emitted + 1);
  });

  it("a score of 100 still leaves stepFree and every other access fact UNKNOWN", async () => {
    const { records } = await run(fixture("demo-pspc-edge.csv"));
    const r = records.find((x) => x.upstreamId === "DEMO-001")!;
    expect(r.facts.accessibilityScore.value!.score).toBe(100);
    for (const k of ["stepFree", "entrance", "washroom", "parking"] as const) {
      expect(r.facts[k]).toEqual({ value: null, provenance: null, photoSlotIds: [] });
    }
  });

  it("counts UNKNOWN facts per fact name", async () => {
    const { counters } = await run(fixture("pspc-ontario-sample.csv"));
    expect(counters.unknownFieldCount).toEqual({ stepFree: 4, entrance: 4, washroom: 4, parking: 4 });
  });

  it("rejects malformed rows and a missing id", async () => {
    const head = fixture("pspc-ontario-sample.csv").split("\n")[0]!;
    const { counters } = await run(`${head}\nonly,three,fields\n`);
    expect(counters.rejected).toEqual({ "malformed-row": 1 });
  });

  it("throws when a required column is missing", async () => {
    await expect(run("a,b\n1,2\n")).rejects.toThrow(/header is missing/);
  });
});

describe("parseScore", () => {
  it.each([
    ["0", 0],
    ["100", 100],
    [" 77 ", 77],
  ])("accepts %j", (t, n) => expect(parseScore(t)).toEqual({ score: n }));
  it.each([
    ["", "score-missing"],
    ["  ", "score-missing"],
    ["101", "score-out-of-range"],
    ["-1", "score-out-of-range"],
    ["unknown", "score-out-of-range"],
    ["77.5", "score-out-of-range"],
  ])("rejects %j", (t, reason) => expect(parseScore(t)).toEqual({ reason }));
});
