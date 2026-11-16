import { CATEGORIES, STORAGE_KEY as LEGACY_STORAGE_KEY, readReports } from "./reports.js";
import type { BarrierCategory } from "./types.js";

/**
 * Structured, anonymised barrier-and-wait reports kept on the device, and
 * aggregate helpers that apply small-cell suppression.
 *
 * A report holds fixed choices only: no name, contact detail, address, free
 * text, identifier or timestamp. The date is coarsened to a calendar quarter.
 */
export const EVIDENCE_STORAGE_KEY = "access-tools:housing:evidence:v1";
export const SUPPRESSION_THRESHOLD = 5;

export const SETTINGS = ["dwelling", "overnight", "unknown"] as const;
export type EvidenceSetting = (typeof SETTINGS)[number];

export const WAIT_BANDS = ["under-1-month", "1-to-6-months", "6-to-12-months", "1-to-2-years", "over-2-years", "unknown"] as const;
export type WaitBand = (typeof WAIT_BANDS)[number];

export const BARRIER_TYPES = [
  "entrance-steps", "narrow-doorway", "no-roll-in-shower", "no-transfer-space", "bed-height",
  "elevator-out-of-service", "listing-did-not-match", "no-accessible-unit-offered", "other",
] as const;
export type BarrierType = (typeof BARRIER_TYPES)[number];

export interface EvidenceReport {
  schemaVersion: "housing-evidence-1";
  category: BarrierCategory;
  setting: EvidenceSetting;
  waitBand: WaitBand;
  /** Sorted, de-duplicated fixed choices. */
  barriers: BarrierType[];
  /** Calendar quarter (YYYY-Qn), or "unknown". Never a day or a time. */
  period: string;
  city?: string;
}

export interface EvidenceDraft {
  category: BarrierCategory;
  setting: EvidenceSetting;
  waitBand: WaitBand;
  barriers: readonly BarrierType[];
  city: string;
}

const CITY_PATTERN = /^[\p{L} .'-]{1,60}$/u;
const PERIOD_PATTERN = /^(\d{4}-Q[1-4]|unknown)$/;
const KEYS = ["schemaVersion", "category", "setting", "waitBand", "barriers", "period", "city"];

/** Coarsens a calendar date (YYYY-MM-DD) to its quarter. Anything else is "unknown". */
export function quarterOf(date: string): string {
  const match = /^(\d{4})-(0[1-9]|1[0-2])-\d{2}$/.exec(date);
  return match ? `${match[1]}-Q${Math.ceil(Number(match[2]) / 3)}` : "unknown";
}

export function validEvidence(value: unknown): value is EvidenceReport {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const object = value as Record<string, unknown>;
  const barriers = object.barriers;
  return Object.keys(object).every((key) => KEYS.includes(key)) &&
    object.schemaVersion === "housing-evidence-1" &&
    CATEGORIES.includes(object.category as BarrierCategory) &&
    SETTINGS.includes(object.setting as EvidenceSetting) &&
    WAIT_BANDS.includes(object.waitBand as WaitBand) &&
    Array.isArray(barriers) &&
    barriers.every((item, index) => BARRIER_TYPES.includes(item as BarrierType) && (index === 0 || String(barriers[index - 1]) < String(item))) &&
    typeof object.period === "string" && PERIOD_PATTERN.test(object.period) &&
    (object.city === undefined || (typeof object.city === "string" && CITY_PATTERN.test(object.city)));
}

export type EvidenceResult = { ok: true; report: EvidenceReport } | { ok: false; reason: "invalid-city" | "invalid-choice" };

/** Builds a report from form choices. `today` is a calendar date and is stored only as a quarter. */
export function buildEvidence(draft: EvidenceDraft, today: string): EvidenceResult {
  const city = draft.city.trim();
  if (city !== "" && !CITY_PATTERN.test(city)) return { ok: false, reason: "invalid-city" };
  const report: EvidenceReport = {
    schemaVersion: "housing-evidence-1",
    category: draft.category,
    setting: draft.setting,
    waitBand: draft.waitBand,
    barriers: [...new Set(draft.barriers)].sort(),
    period: quarterOf(today),
    ...(city ? { city } : {}),
  };
  return validEvidence(report) ? { ok: true, report } : { ok: false, reason: "invalid-choice" };
}

type Reader = Pick<Storage, "getItem">;

/** Reads stored reports, dropping malformed entries. Earlier category-only reports are carried over with Unknown detail. */
export function readEvidence(storage: Reader): EvidenceReport[] {
  let current: EvidenceReport[] = [];
  try {
    const raw: unknown = JSON.parse(storage.getItem(EVIDENCE_STORAGE_KEY) ?? "[]");
    if (Array.isArray(raw)) current = raw.filter(validEvidence);
  } catch { current = []; }
  const earlier = readReports(storage).map((report): EvidenceReport => ({
    schemaVersion: "housing-evidence-1", category: report.category, setting: "unknown", waitBand: "unknown", barriers: [], period: "unknown",
    ...(report.city ? { city: report.city } : {}),
  }));
  return [...earlier, ...current];
}

export function saveEvidence(storage: Pick<Storage, "getItem" | "setItem">, report: EvidenceReport): void {
  if (!validEvidence(report)) throw new Error("Invalid evidence report");
  let stored: EvidenceReport[] = [];
  try {
    const raw: unknown = JSON.parse(storage.getItem(EVIDENCE_STORAGE_KEY) ?? "[]");
    if (Array.isArray(raw)) stored = raw.filter(validEvidence);
  } catch { stored = []; }
  storage.setItem(EVIDENCE_STORAGE_KEY, JSON.stringify([...stored, report]));
}

export function clearEvidence(storage: Pick<Storage, "removeItem">): void {
  storage.removeItem(EVIDENCE_STORAGE_KEY);
  storage.removeItem(LEGACY_STORAGE_KEY);
}

export type Cells<K extends string> = Record<K, number | null>;

/** Primary suppression only: a count below the threshold (including zero) is withheld. */
export function suppressCounts<K extends string>(counts: Record<K, number>, threshold = SUPPRESSION_THRESHOLD): Cells<K> {
  const cells = {} as Cells<K>;
  for (const key of Object.keys(counts) as K[]) cells[key] = counts[key] >= threshold ? counts[key] : null;
  return cells;
}

/**
 * Suppression for cells that add up to a published total. After primary
 * suppression, further cells are withheld (smallest first) until the withheld
 * non-zero cells together reach the threshold, so a withheld count cannot be
 * recovered by subtracting the published cells from the total.
 */
export function suppressPartition<K extends string>(counts: Record<K, number>, threshold = SUPPRESSION_THRESHOLD): Cells<K> {
  const cells = suppressCounts(counts, threshold);
  const keys = Object.keys(counts) as K[];
  const hidden = () => keys.filter((key) => cells[key] === null).reduce((sum, key) => sum + counts[key], 0);
  while (hidden() > 0 && hidden() < threshold) {
    const next = keys.filter((key) => cells[key] !== null).sort((a, b) => counts[a] - counts[b])[0];
    if (next === undefined) break;
    cells[next] = null;
  }
  return cells;
}

function tally<K extends string>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;
}

export interface EvidenceAggregate {
  schemaVersion: "housing-evidence-aggregate-1";
  threshold: number;
  /** Null when fewer than the threshold reports are held. */
  total: number | null;
  byCategory: Cells<BarrierCategory>;
  bySetting: Cells<EvidenceSetting>;
  byWaitBand: Cells<WaitBand>;
  /** A report can name several barriers, so these cells do not add up to the total. */
  byBarrier: Cells<BarrierType>;
}

/** Aggregate counts only. No report, city or period is carried into the result. */
export function aggregateEvidence(reports: readonly EvidenceReport[], threshold = SUPPRESSION_THRESHOLD): EvidenceAggregate {
  const k = Number.isInteger(threshold) && threshold >= SUPPRESSION_THRESHOLD ? threshold : SUPPRESSION_THRESHOLD;
  const category = tally(CATEGORIES), setting = tally(SETTINGS), wait = tally(WAIT_BANDS), barrier = tally(BARRIER_TYPES);
  let total = 0;
  for (const report of reports) {
    if (!validEvidence(report)) continue;
    total += 1;
    category[report.category] += 1;
    setting[report.setting] += 1;
    wait[report.waitBand] += 1;
    for (const item of report.barriers) barrier[item] += 1;
  }
  return {
    schemaVersion: "housing-evidence-aggregate-1",
    threshold: k,
    total: total >= k ? total : null,
    byCategory: suppressPartition(category, k),
    bySetting: suppressPartition(setting, k),
    byWaitBand: suppressPartition(wait, k),
    byBarrier: suppressCounts(barrier, k),
  };
}
