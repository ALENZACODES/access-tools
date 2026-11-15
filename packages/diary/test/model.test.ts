import { describe, expect, it } from "vitest";
import { aggregate, exportAggregates, isEntry, type Entry } from "../src/model.js";

const base: Entry = { date: "2026-11-12", category: "catheters", amount: "Unknown", rationed: true, consequence: "missed-work" };
describe("strict diary validation", () => {
  it("accepts the fixed schema", () => expect(isEntry(base)).toBe(true));
  it("rejects diagnoses, names, malformed dates and invalid costs", () => {
    expect(isEntry({ ...base, diagnosis: "private" })).toBe(false);
    expect(isEntry({ ...base, clinician: "private" })).toBe(false);
    expect(isEntry({ ...base, date: "2026-02-30" })).toBe(false);
    expect(isEntry({ ...base, amount: -1 })).toBe(false);
    expect(isEntry({ ...base, category: "brand" })).toBe(false);
    expect(isEntry({ ...base, consequence: "diagnosis" })).toBe(false);
  });
});
describe("export is suppressed aggregate only", () => {
  it("suppresses cells of 1–4, including mixed-category groups", () => {
    for (let count = 1; count <= 4; count++) {
      expect(aggregate(Array.from({ length: count }, () => base)).cells).toEqual([]);
    }
    const entries = [...Array.from({ length: 5 }, () => base), { ...base, category: "cushions" as const }];
    expect(aggregate(entries).cells).toEqual([{ month: "2026-11", category: "catheters", count: 5 }]);
  });
  it("never exports individual values or counts under 5", () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({ ...base, amount: 100 + i, consequence: "infection-reported-by-person" as const }));
    const output = exportAggregates(rows);
    const exported = JSON.parse(output) as Record<string, unknown>;
    expect(Object.keys(exported).sort()).toEqual(["cells", "schemaVersion", "suppressionThreshold"]);
    expect(exported.cells).toEqual([{ month: "2026-11", category: "catheters", count: 5 }]);
    for (const field of ["date", "amount", "rationed", "consequence", "id", "infection-reported-by-person", "100", "101", "102", "103", "104"]) {
      expect(output).not.toContain(`"${field}"`);
    }
    expect((exported.cells as Array<{ count: number }>).every((cell) => cell.count >= 5)).toBe(true);
  });
});
