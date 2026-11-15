import type { BarrierCategory, BarrierReport } from "./types.js";
export const STORAGE_KEY = "access-tools:housing:barriers:v1";
export const CATEGORIES: BarrierCategory[] = ["applied", "waited", "refused", "unsuitable"];
const CITY_PATTERN = /^[\p{L} .'-]{1,60}$/u;
export function validReport(value: unknown): value is BarrierReport {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const object = value as Record<string, unknown>;
  return Object.keys(object).every((key) => key === "category" || key === "city") &&
    CATEGORIES.includes(object.category as BarrierCategory) &&
    (object.city === undefined || (typeof object.city === "string" && CITY_PATTERN.test(object.city)));
}
export function readReports(storage: Pick<Storage, "getItem">): BarrierReport[] {
  try {
    const raw: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter(validReport) : [];
  } catch { return []; }
}
export function saveReport(storage: Pick<Storage, "getItem" | "setItem">, report: BarrierReport): void {
  if (!validReport(report)) throw new Error("Invalid barrier report");
  storage.setItem(STORAGE_KEY, JSON.stringify([...readReports(storage), report]));
}
/** Suppress every 1–4 cell; never expose the raw count, even as a label or tooltip. */
export function aggregate(reports: readonly BarrierReport[]): Record<BarrierCategory, number | null> {
  const counts = { applied: 0, waited: 0, refused: 0, unsuitable: 0 };
  for (const report of reports) if (validReport(report)) counts[report.category] += 1;
  return Object.fromEntries(CATEGORIES.map((category) => [category, counts[category] >= 5 ? counts[category] : null])) as Record<BarrierCategory, number | null>;
}
