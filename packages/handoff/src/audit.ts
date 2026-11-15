import type { AuditResult, DirectoryLike, Freshness } from "./types.js";

const DAY = 86_400_000;

function parseDate(value: string | undefined): number | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) return undefined;
  return timestamp;
}

export function freshness(date: string | undefined, asOf: string): { status: Freshness; ageDays?: number } {
  const checked = parseDate(date);
  const today = parseDate(asOf);
  if (today === undefined) throw new Error("asOf must be a valid ISO date");
  if (checked === undefined || checked > today) return { status: "missing" };
  const ageDays = Math.floor((today - checked) / DAY);
  return { status: ageDays > 90 ? "stale" : ageDays >= 61 ? "ageing" : "current", ageDays };
}

/** Auditing is pure: no live web fetch, no implicit renewal of a date. */
export function auditRecords(records: readonly DirectoryLike[], asOf: string): AuditResult[] {
  return records.map((record) => {
    const checkedOn = record.checkedOn ?? record.retrievedOn;
    const { status, ageDays } = freshness(checkedOn, asOf);
    const figureDate = record.figure?.retrievedOn;
    // A figure's own source date must be present and no older than 90 days.
    const figureVisible = Boolean(record.figure && freshness(figureDate, asOf).status !== "stale"
      && freshness(figureDate, asOf).status !== "missing" && status !== "stale" && status !== "missing");
    return { record, checkedOn, status, ageDays, figureDate, figureVisible };
  });
}

/** Manual check must be performed by a person; the caller supplies its date. */
export function recordManualCheck(record: DirectoryLike, checkedOn: string, asOf: string): DirectoryLike {
  const result = freshness(checkedOn, asOf);
  if (result.status === "missing") throw new Error("Check date missing, invalid, or in the future");
  return { ...record, checkedOn };
}
