// @vitest-environment node
import { describe, expect, it } from "vitest";
import { CATALOG, t } from "../src/i18n";
import { importResult, runImport } from "../src/importer";
import { buildReport } from "../src/report";
import { validateReport } from "../src/schema";
import { LicenceGateError, WIKIDATA_P2846_ONTARIO, licenceGate, type SourceDef } from "../src/sources";
import type { ImportedRecord } from "../src/types";
import { DATE, fixture, from } from "./helpers";

const restricted: SourceDef = { ...WIKIDATA_P2846_ONTARIO, id: "demo-restricted", licenceStatus: "restricted" };
const licence = { checkedOn: DATE, urlRead: "https://example.org/licence", result: "Demonstration record" };

describe("licence gate", () => {
  it("lets open and open-recorded sources through", () => {
    expect(licenceGate(WIKIDATA_P2846_ONTARIO)).toEqual({ held: false });
    expect(licenceGate({ ...WIKIDATA_P2846_ONTARIO, licenceStatus: "open-recorded" })).toEqual({ held: false });
  });

  it("refuses any other status without a licence record, before reading anything", async () => {
    let touched = false;
    async function* spy() {
      touched = true;
      yield {};
    }
    await expect(
      runImport({ source: restricted, bindings: spy(), retrievedAt: DATE, sink: () => undefined }),
    ).rejects.toBeInstanceOf(LicenceGateError);
    expect(touched).toBe(false);
    expect(() => licenceGate(restricted, { ...licence, result: "" })).toThrow(LicenceGateError);
  });

  it("with a licence record it proceeds and lists the source as held", async () => {
    const out: ImportedRecord[] = [];
    const run = await importResult(fixture("wikidata-p2846-ontario.sample.json"), {
      source: restricted,
      retrievedAt: DATE,
      licenceRecord: licence,
      sink: (r) => void out.push(r),
    });
    expect(run.held).toBe(true);
    const report = buildReport({ ...run, source: restricted, retrievedAt: DATE, licenceRecord: licence, partitions: [] });
    expect(report.heldByLicence).toBe(true);
    expect(validateReport(report).errors).toEqual([]);
  });
});

describe("import report", () => {
  it("counts rows, records, rejections and UNKNOWN fields, and validates", async () => {
    const out: ImportedRecord[] = [];
    const run = await importResult(fixture("demo-wikidata-edge.json"), {
      source: WIKIDATA_P2846_ONTARIO,
      retrievedAt: DATE,
      sink: (r) => void out.push(r),
    });
    const report = buildReport({
      source: WIKIDATA_P2846_ONTARIO,
      stats: run.stats,
      emitted: run.emitted,
      unknownFieldCount: run.unknownFieldCount,
      retrievedAt: DATE,
      held: run.held,
      partitions: [],
    });
    expect(validateReport(report).errors).toEqual([]);
    expect(report).toMatchObject({ read: 5, emitted: 4, rejected: {}, heldByLicence: false });
    expect(report.unknownReasons).toEqual({ "unmapped-value": 1, "conflicting-statements": 1, "no-coordinates": 1 });
    expect(report.unknownFieldCount.stepFree).toBe(4);
    expect(report.unknownFieldCount.wheelchairAccessibilityStatement).toBe(2);
    expect(report.summary.en).toContain("not a coverage claim");
    expect(report.summary.fr).toContain("couverture");
  });

  it("counts a schema-invalid record as rejected, not emitted", async () => {
    const run = await runImport({
      source: { ...WIKIDATA_P2846_ONTARIO, licenceName: "" },
      bindings: from([{ item: { type: "uri", value: "http://www.wikidata.org/entity/Q1" }, v: { type: "uri", value: "http://www.wikidata.org/entity/Q24192067" } }]),
      retrievedAt: DATE,
      sink: () => undefined,
    });
    expect(run.emitted).toBe(0);
    expect(run.stats.rejected["schema-invalid"]).toBe(1);
  });

  it("rejects a bad query date", async () => {
    await expect(
      runImport({ source: WIKIDATA_P2846_ONTARIO, bindings: from([]), retrievedAt: "2026-11-5", sink: () => undefined }),
    ).rejects.toThrow(/YYYY-MM-DD/);
  });
});

describe("EN/FR catalog", () => {
  it("has the same keys in both languages", () => {
    expect(Object.keys(CATALOG.fr).sort()).toEqual(Object.keys(CATALOG.en).sort());
  });

  it("puts U+00A0 before : ; ? ! in French", () => {
    for (const s of Object.values(CATALOG.fr)) {
      expect(s).not.toMatch(/[^\u00A0\u202F][:;?!]/);
      expect(s).not.toMatch(/«(?!\u00A0)|(?<!\u00A0)»/);
    }
    expect(t("fr", "summary", { sourceName: "X", retrievedAt: DATE, read: 1, emitted: 1, rejected: 0 })).toContain("\u00A0:");
  });

  it("fills placeholders", () => {
    expect(t("en", "summary", { sourceName: "X", retrievedAt: DATE, read: 3, emitted: 2, rejected: 1 })).toBe(
      "X (2026-11-15): 3 rows read, 2 records written, 1 rejected.",
    );
  });
});
