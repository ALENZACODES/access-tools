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
    // Complementary suppression also withholds catheters (5): exactly one category cell was under the threshold.
    expect(aggregate(entries).cells).toEqual([]);
    expect(aggregate(entries).consequences).toEqual([{ month: "2026-11", consequence: "missed-work", count: 6 }]);
  });
  it("exports infection-reported-by-person as a suppressed aggregate, never as individual values", () => {
    const few = Array.from({ length: 4 }, (_, i) => ({ ...base, amount: 100 + i, consequence: "infection-reported-by-person" as const }));
    expect(aggregate(few).consequences).toEqual([]);
    expect(exportAggregates(few)).not.toContain("infection-reported-by-person");
    const rows = [...few, { ...base, amount: 104, consequence: "infection-reported-by-person" as const }];
    const output = exportAggregates(rows);
    const exported = JSON.parse(output) as Record<string, unknown>;
    expect(Object.keys(exported).sort()).toEqual(["cells", "consequences", "schemaVersion", "suppressionThreshold"]);
    expect(exported.cells).toEqual([{ month: "2026-11", category: "catheters", count: 5 }]);
    expect(exported.consequences).toEqual([{ month: "2026-11", consequence: "infection-reported-by-person", count: 5 }]);
    for (const field of ["date", "amount", "rationed", "id", "100", "101", "102", "103", "104"]) {
      expect(output).not.toContain(`"${field}"`);
    }
    expect((exported.cells as Array<{ count: number }>).every((cell) => cell.count >= 5)).toBe(true);
    expect((exported.consequences as Array<{ count: number }>).every((cell) => cell.count >= 5)).toBe(true);
  });
});


describe("complementary suppression", () => {
  const entry = (overrides: Partial<Entry>): Entry => ({ ...base, ...overrides });
  const many = (count: number, overrides: Partial<Entry>): Entry[] => Array.from({ length: count }, () => entry(overrides));

  it("withholds the next-smallest cell when exactly one cell in a dimension is below the threshold", () => {
    const entries = [
      ...many(8, { category: "catheters", consequence: "missed-work" }),
      ...many(6, { category: "dressings", consequence: "missed-work" }),
      ...many(3, { category: "cushions", consequence: "missed-work" }),
    ];
    // cushions (3) is primary-suppressed; dressings (6) is the next-smallest and is also withheld.
    expect(aggregate(entries).cells).toEqual([{ month: "2026-11", category: "catheters", count: 8 }]);
    expect(aggregate(entries).consequences).toEqual([{ month: "2026-11", consequence: "missed-work", count: 17 }]);
  });

  it("does not publish totals that would let a suppressed cell be derived", () => {
    const published = aggregate([
      ...many(8, { category: "catheters", consequence: "missed-work" }),
      ...many(6, { category: "dressings", consequence: "missed-work" }),
      ...many(3, { category: "cushions", consequence: "missed-work" }),
    ]);
    expect(Object.keys(published).sort()).toEqual(["cells", "consequences", "schemaVersion", "suppressionThreshold"]);
    expect(JSON.stringify(published)).not.toMatch(/total|sum|grand|entryCount/i);
  });

  it("does not let any suppressed cell be derived from all published numbers", () => {
    const fixtures: Entry[][] = [
      [...many(5, { category: "catheters" }), entry({ category: "cushions" })],
      [...many(8, { category: "catheters", consequence: "missed-work" }), ...many(6, { category: "dressings", consequence: "missed-work" }), ...many(3, { category: "cushions", consequence: "missed-work" })],
      [...many(5, { category: "catheters", consequence: "infection-reported-by-person" })],
      [...many(7, { category: "catheters", consequence: "missed-work" }), ...many(4, { category: "catheters", consequence: "delayed-care" }), ...many(2, { category: "dressings", consequence: "none" })],
      [...many(6, { category: "catheters", consequence: "missed-work" }), ...many(5, { category: "dressings", consequence: "none" }), ...many(1, { category: "cushions", consequence: "other" })],
      [...many(4, { category: "catheters", consequence: "missed-work" }), ...many(4, { date: "2026-12-01", category: "dressings", consequence: "none" })],
    ];
    for (const entries of fixtures) {
      expect(derivableSuppressedCells(entries), JSON.stringify(aggregate(entries))).toEqual([]);
    }
  });
});

function countTrue(entries: readonly Entry[]): { categories: Record<string, number>; consequences: Record<string, number> } {
  const categories: Record<string, number> = {};
  const consequences: Record<string, number> = {};
  for (const entry of entries) {
    const month = entry.date.slice(0, 7);
    const categoryKey = `${month}|${entry.category}`;
    const consequenceKey = `${month}|${entry.consequence}`;
    categories[categoryKey] = (categories[categoryKey] ?? 0) + 1;
    consequences[consequenceKey] = (consequences[consequenceKey] ?? 0) + 1;
  }
  return { categories, consequences };
}

/** Classic sum attack: a suppressed cell is derived if the other dimension (or a published total) gives a unique remainder. */
function derivableSuppressedCells(entries: readonly Entry[]): string[] {
  const published = aggregate(entries);
  const truth = countTrue(entries);
  const months = new Set([
    ...Object.keys(truth.categories).map((key) => key.split("|")[0]!),
    ...Object.keys(truth.consequences).map((key) => key.split("|")[0]!),
  ]);
  const recovered: string[] = [];
  if ("total" in published || "sum" in published || "entryCount" in published) {
    recovered.push("published-total");
  }
  for (const month of months) {
    const trueCats = Object.entries(truth.categories).filter(([key]) => key.startsWith(`${month}|`));
    const trueCons = Object.entries(truth.consequences).filter(([key]) => key.startsWith(`${month}|`));
    const pubCats = published.cells.filter((cell) => cell.month === month);
    const pubCons = published.consequences.filter((cell) => cell.month === month);
    const missingCats = trueCats.filter(([key]) => !pubCats.some((cell) => `${cell.month}|${cell.category}` === key));
    const missingCons = trueCons.filter(([key]) => !pubCons.some((cell) => `${cell.month}|${cell.consequence}` === key));
    const knownTotals: number[] = [];
    if (missingCats.length === 0) knownTotals.push(pubCats.reduce((sum, cell) => sum + cell.count, 0));
    if (missingCons.length === 0) knownTotals.push(pubCons.reduce((sum, cell) => sum + cell.count, 0));
    const uniqueTotals = [...new Set(knownTotals)];
    const total = uniqueTotals.length === 1 ? uniqueTotals[0] : undefined;
    if (total !== undefined && missingCats.length === 1) {
      const [key, count] = missingCats[0]!;
      if (total - pubCats.reduce((sum, cell) => sum + cell.count, 0) === count) recovered.push(key);
    }
    if (total !== undefined && missingCons.length === 1) {
      const [key, count] = missingCons[0]!;
      if (total - pubCons.reduce((sum, cell) => sum + cell.count, 0) === count) recovered.push(key);
    }
  }
  return recovered;
}
