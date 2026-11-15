// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildReport } from "#src/map";
import { validateRecord, validateReport } from "#src/schema";
import { fixture, run, RUN_DATE, source } from "./helpers";

describe("record schema", () => {
  it("accepts every record emitted from both fixtures", async () => {
    for (const f of ["pspc-ontario-sample.csv", "demo-pspc-edge.csv"]) {
      const { records } = await run(fixture(f));
      expect(records.length).toBeGreaterThan(0);
      for (const r of records) expect(validateRecord(r)).toEqual([]);
    }
  });

  async function first() {
    return structuredClone((await run(fixture("pspc-ontario-sample.csv"))).records[0]!);
  }

  it("rejects a non-null value without provenance", async () => {
    const r = await first();
    r.facts.accessibilityScore.provenance = null;
    expect(validateRecord(r)).not.toEqual([]);
  });

  it("rejects a null value that carries provenance", async () => {
    const r = await first();
    r.name.value = null;
    expect(validateRecord(r)).not.toEqual([]);
  });

  it.each([
    ["tier", (p: Record<string, unknown>) => (p.tier = 2)],
    ["label", (p: Record<string, unknown>) => (p.prototypeLabel = "VERIFIED")],
    ["verifier", (p: Record<string, unknown>) => (p.verifierType = "peer")],
    ["date", (p: Record<string, unknown>) => (p.retrievedAt = "15/11/2026")],
    ["missing url", (p: Record<string, unknown>) => delete p.sourceUrl],
  ])("rejects bad provenance: %s", async (_n, mutate) => {
    const r = await first();
    mutate(r.facts.accessibilityScore.provenance as unknown as Record<string, unknown>);
    expect(validateRecord(r)).not.toEqual([]);
  });

  it("rejects a score of 101 and a derived stepFree value", async () => {
    const r = await first();
    r.facts.accessibilityScore.value!.score = 101;
    expect(validateRecord(r)).not.toEqual([]);
    const s = await first();
    (s.facts.stepFree as { value: unknown }).value = "yes";
    s.facts.stepFree.provenance = s.facts.accessibilityScore.provenance;
    expect(validateRecord(s)).not.toEqual([]);
  });

  it("rejects raw keys outside the listed columns", async () => {
    const r = await first();
    r.raw["Contact-phone"] = "x";
    expect(validateRecord(r)).not.toEqual([]);
  });
});

describe("report schema", () => {
  it("accepts a built report and states that counts are not a coverage claim", async () => {
    const { counters } = await run(fixture("demo-pspc-edge.csv"));
    const report = buildReport(source, counters, { retrievedAt: RUN_DATE, held: false, partitions: [] });
    expect(validateReport(report)).toEqual([]);
    expect(report.countsAreNotACoverageClaim).toBe(true);
    expect(report.notice.en).toMatch(/not a coverage claim/);
    expect(report.sources[0]).toMatchObject({ read: 5, emitted: 4, rejected: { total: 1, byReason: { "duplicate-id": 1 } } });
    const bad = { ...report, countsAreNotACoverageClaim: false };
    expect(validateReport(bad)).not.toEqual([]);
  });
});
