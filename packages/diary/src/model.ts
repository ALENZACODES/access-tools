import Ajv2020 from "ajv/dist/2020.js";
import schema from "./entry.schema.json";

export const CATEGORIES = ["catheters", "dressings", "cushions", "other-equipment"] as const;
export const CONSEQUENCES = ["none", "missed-work", "delayed-care", "infection-reported-by-person", "other"] as const;
export type Category = (typeof CATEGORIES)[number];
export type Consequence = (typeof CONSEQUENCES)[number];
export type Language = "en" | "fr";
export interface Entry {
  date: string;
  category: Category;
  amount: number | "Unknown";
  rationed: boolean;
  consequence: Consequence;
}

// Register a local date format without a new dependency; disallow normalized invalid dates.
const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addFormat("date", {
  type: "string",
  validate: (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year!, month! - 1, day!));
    return year! >= 1000 && date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
  },
});
const validate = ajv.compile<Entry>(schema);
export function isEntry(value: unknown): value is Entry {
  return validate(value);
}
export function assertEntry(value: unknown): asserts value is Entry {
  if (!isEntry(value)) throw new Error("Invalid diary entry");
}

export const K = 5;
export interface AggregateCell {
  month: string;
  category: Category;
  count: number;
}
export interface ConsequenceCell {
  month: string;
  consequence: Consequence;
  count: number;
}
export interface AggregateExport {
  schemaVersion: "diary-aggregate-1.0.0";
  suppressionThreshold: 5;
  cells: AggregateCell[];
  consequences: ConsequenceCell[];
}

// Export takes the schema-validated private entries, and emits ONLY eligible group counts.
// Category and consequence counts both use the same threshold and complementary suppression:
// if exactly one cell in a dimension is below the threshold, the next-smallest cell is also withheld.
// No cross-dimension totals, raw entry values, amounts, ratios or individual row identifiers are exported.
interface CountCell {
  month: string;
  key: string;
  count: number;
}

function addCount(map: Map<string, Map<string, number>>, month: string, key: string): void {
  let inner = map.get(month);
  if (!inner) {
    inner = new Map();
    map.set(month, inner);
  }
  inner.set(key, (inner.get(key) ?? 0) + 1);
}

/** Primary threshold, then complementary suppression when exactly one cell is withheld. */
export function publishDimension(cells: readonly CountCell[]): CountCell[] {
  const byMonth = new Map<string, CountCell[]>();
  for (const cell of cells) {
    const list = byMonth.get(cell.month) ?? [];
    list.push(cell);
    byMonth.set(cell.month, list);
  }
  const published: CountCell[] = [];
  for (const group of byMonth.values()) {
    const suppressed = group.filter((cell) => cell.count < K);
    let keep = group.filter((cell) => cell.count >= K);
    if (suppressed.length === 1 && keep.length > 0) {
      const ranked = [...keep].sort((a, b) => a.count - b.count || a.key.localeCompare(b.key));
      const withheld = ranked[0]!;
      keep = keep.filter((cell) => cell !== withheld);
    }
    published.push(...keep);
  }
  return published;
}

export function aggregate(entries: readonly Entry[]): AggregateExport {
  const categoryCounts = new Map<string, Map<string, number>>();
  const consequenceCounts = new Map<string, Map<string, number>>();
  for (const entry of entries) {
    assertEntry(entry);
    const month = entry.date.slice(0, 7);
    addCount(categoryCounts, month, entry.category);
    addCount(consequenceCounts, month, entry.consequence);
  }
  const categoryCells: CountCell[] = [];
  for (const [month, inner] of categoryCounts) {
    for (const [key, count] of inner) categoryCells.push({ month, key, count });
  }
  const consequenceCells: CountCell[] = [];
  for (const [month, inner] of consequenceCounts) {
    for (const [key, count] of inner) consequenceCells.push({ month, key, count });
  }
  const cells: AggregateCell[] = publishDimension(categoryCells)
    .map(({ month, key, count }) => ({ month, category: key as Category, count }))
    .sort((a, b) => a.month.localeCompare(b.month) || a.category.localeCompare(b.category));
  const consequences: ConsequenceCell[] = publishDimension(consequenceCells)
    .map(({ month, key, count }) => ({ month, consequence: key as Consequence, count }))
    .sort((a, b) => a.month.localeCompare(b.month) || a.consequence.localeCompare(b.consequence));
  return { schemaVersion: "diary-aggregate-1.0.0", suppressionThreshold: K, cells, consequences };
}

export function exportAggregates(entries: readonly Entry[]): string {
  return JSON.stringify(aggregate(entries), null, 2);
}
