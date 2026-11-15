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
export interface AggregateExport {
  schemaVersion: "diary-aggregate-1.0.0";
  suppressionThreshold: 5;
  cells: AggregateCell[];
}

// Export takes the schema-validated private entries, and emits ONLY eligible group counts.
// No totals, raw entry values, amounts, ratios or individual row identifiers are exported.
export function aggregate(entries: readonly Entry[]): AggregateExport {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    assertEntry(entry);
    const key = `${entry.date.slice(0, 7)}|${entry.category}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const cells: AggregateCell[] = [];
  for (const [key, count] of counts) {
    if (count < K) continue;
    const [month, category] = key.split("|") as [string, Category];
    cells.push({ month, category, count });
  }
  cells.sort((a, b) => a.month.localeCompare(b.month) || a.category.localeCompare(b.category));
  return { schemaVersion: "diary-aggregate-1.0.0", suppressionThreshold: K, cells };
}

export function exportAggregates(entries: readonly Entry[]): string {
  return JSON.stringify(aggregate(entries), null, 2);
}
