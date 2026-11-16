import { describe, expect, it } from "vitest";
import {
  BARRIER_TYPES, EVIDENCE_STORAGE_KEY, aggregateEvidence, buildEvidence, clearEvidence, quarterOf, readEvidence, saveEvidence,
  suppressCounts, suppressPartition, validEvidence,
} from "../src/evidence.js";
import type { EvidenceDraft, EvidenceReport } from "../src/evidence.js";
import { STORAGE_KEY } from "../src/reports.js";

const draft: EvidenceDraft = { category: "waited", setting: "dwelling", waitBand: "1-to-2-years", barriers: ["no-roll-in-shower", "entrance-steps", "no-roll-in-shower"], city: " Toronto " };
const report = (overrides: Partial<EvidenceReport> = {}): EvidenceReport => ({
  schemaVersion: "housing-evidence-1", category: "applied", setting: "dwelling", waitBand: "unknown", barriers: [], period: "2026-Q4", ...overrides,
});
const many = (count: number, overrides: Partial<EvidenceReport> = {}) => Array.from({ length: count }, () => report(overrides));
function memory() {
  const data = new Map<string, string>();
  return { data, getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
}

describe("structured, anonymised report", () => {
  it("builds a report of fixed choices with the date coarsened to a quarter", () => {
    const result = buildEvidence(draft, "2026-11-16");
    if (!result.ok) throw new Error(result.reason);
    expect(result.report).toEqual({
      schemaVersion: "housing-evidence-1", category: "waited", setting: "dwelling", waitBand: "1-to-2-years",
      barriers: ["entrance-steps", "no-roll-in-shower"], period: "2026-Q4", city: "Toronto",
    });
    expect(JSON.stringify(result.report)).not.toContain("2026-11-16");
  });

  it("coarsens dates and falls back to unknown", () => {
    expect(quarterOf("2026-01-31")).toBe("2026-Q1");
    expect(quarterOf("2026-06-01")).toBe("2026-Q2");
    expect(quarterOf("2026-09-30")).toBe("2026-Q3");
    expect(quarterOf("2026-13-01")).toBe("unknown");
    expect(quarterOf("yesterday")).toBe("unknown");
  });

  it("leaves the city out when blank and rejects anything that is not a place name", () => {
    const blank = buildEvidence({ ...draft, city: "  " }, "2026-11-16");
    expect(blank.ok && "city" in blank.report).toBe(false);
    expect(buildEvidence({ ...draft, city: "call 555 0100" }, "2026-11-16")).toEqual({ ok: false, reason: "invalid-city" });
    expect(buildEvidence({ ...draft, city: "name@example.org" }, "2026-11-16")).toEqual({ ok: false, reason: "invalid-city" });
    expect(buildEvidence({ ...draft, waitBand: "ages" as never }, "2026-11-16")).toEqual({ ok: false, reason: "invalid-choice" });
  });

  it("accepts no extra fields, free text, identifiers or exact dates", () => {
    expect(validEvidence(report())).toBe(true);
    expect(validEvidence({ ...report(), note: "free text" })).toBe(false);
    expect(validEvidence({ ...report(), id: "abc" })).toBe(false);
    expect(validEvidence({ ...report(), email: "private@example.org" })).toBe(false);
    expect(validEvidence(report({ period: "2026-11-16" }))).toBe(false);
    expect(validEvidence(report({ barriers: ["made-up" as never] }))).toBe(false);
    expect(validEvidence(report({ barriers: ["other", "bed-height"] }))).toBe(false); // unsorted
    expect(validEvidence(report({ barriers: ["other", "other"] }))).toBe(false); // repeated
  });
});

describe("on-device storage", () => {
  it("stores valid reports, drops malformed ones and carries over earlier category-only reports", () => {
    const storage = memory();
    saveEvidence(storage, report({ category: "refused" }));
    expect(() => saveEvidence(storage, { ...report(), phone: "123" } as never)).toThrow();
    expect(readEvidence(storage)).toEqual([report({ category: "refused" })]);
    storage.data.set(EVIDENCE_STORAGE_KEY, JSON.stringify([report(), { category: "waited" }, "text"]));
    storage.data.set(STORAGE_KEY, JSON.stringify([{ category: "unsuitable", city: "Ottawa" }]));
    expect(readEvidence(storage)).toEqual([
      { schemaVersion: "housing-evidence-1", category: "unsuitable", setting: "unknown", waitBand: "unknown", barriers: [], period: "unknown", city: "Ottawa" },
      report(),
    ]);
    storage.data.set(EVIDENCE_STORAGE_KEY, "{not json");
    expect(readEvidence(storage)).toHaveLength(1);
  });

  it("deletes current and earlier reports together", () => {
    const storage = memory();
    saveEvidence(storage, report());
    storage.data.set(STORAGE_KEY, JSON.stringify([{ category: "applied" }]));
    clearEvidence(storage);
    expect(readEvidence(storage)).toEqual([]);
    expect(storage.data.size).toBe(0);
  });
});

describe("small-cell suppression", () => {
  it("withholds every count under 5, including zero", () => {
    expect(suppressCounts({ a: 0, b: 1, c: 4, d: 5, e: 12 })).toEqual({ a: null, b: null, c: null, d: 5, e: 12 });
  });

  it("withholds a further cell when one small cell could be found by subtraction", () => {
    // 3 + 7 + 9 = 19: publishing 7 and 9 with the total would reveal the 3.
    expect(suppressPartition({ a: 3, b: 7, c: 9, d: 0 })).toEqual({ a: null, b: null, c: 9, d: null });
    // Withheld cells already add up to at least 5: nothing more is needed.
    expect(suppressPartition({ a: 3, b: 2, c: 9 })).toEqual({ a: null, b: null, c: 9 });
    expect(suppressPartition({ a: 1, b: 2, c: 9 })).toEqual({ a: null, b: null, c: null });
    expect(suppressPartition({ a: 6, b: 9, c: 0 })).toEqual({ a: 6, b: 9, c: null });
  });

  it("never leaves withheld non-zero cells adding up to 1–4 beside a published total", () => {
    for (let a = 0; a <= 7; a++) for (let b = 0; b <= 7; b++) for (let c = 0; c <= 7; c++) {
      const counts = { a, b, c };
      const cells = suppressPartition(counts);
      const hidden = (Object.keys(counts) as Array<keyof typeof counts>).filter((key) => cells[key] === null).reduce((sum, key) => sum + counts[key], 0);
      const total = a + b + c;
      if (total >= 5) expect(hidden === 0 || hidden >= 5).toBe(true);
      for (const key of Object.keys(counts) as Array<keyof typeof counts>) if (cells[key] !== null) expect(cells[key]).toBeGreaterThanOrEqual(5);
    }
  });

  it("aggregates counts only and withholds the total under 5", () => {
    const small = aggregateEvidence(many(4));
    expect(small.total).toBeNull();
    expect(Object.values(small.byCategory).every((cell) => cell === null)).toBe(true);
    const reports = [...many(6, { category: "waited", waitBand: "over-2-years", barriers: ["entrance-steps"], city: "Toronto" }), ...many(2, { category: "refused", setting: "overnight" })];
    const result = aggregateEvidence(reports);
    expect(result.total).toBe(8);
    // refused = 2 is withheld; waited = 6 is withheld too, or the total would reveal the 2.
    expect(result.byCategory).toEqual({ applied: null, waited: null, refused: null, unsuitable: null });
    expect(result.byBarrier["entrance-steps"]).toBe(6);
    expect(Object.keys(result.byBarrier)).toEqual([...BARRIER_TYPES]);
    const text = JSON.stringify(result);
    expect(text).not.toContain("Toronto");
    expect(text).not.toContain("2026-Q4");
  });

  it("publishes cells of 5 or more and ignores malformed entries", () => {
    const result = aggregateEvidence([...many(5), ...many(7, { category: "unsuitable", setting: "overnight" }), { category: "applied" } as never]);
    expect(result.total).toBe(12);
    expect(result.byCategory).toEqual({ applied: 5, waited: null, refused: null, unsuitable: 7 });
    expect(result.bySetting).toEqual({ dwelling: 5, overnight: 7, unknown: null });
  });

  it("does not allow a threshold below 5", () => {
    expect(aggregateEvidence(many(3), 1).total).toBeNull();
    expect(aggregateEvidence(many(3), 1).threshold).toBe(5);
    expect(aggregateEvidence(many(8), 10).total).toBeNull();
  });
});
