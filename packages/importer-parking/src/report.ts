import type { ImportedRecord } from "./model.js";
import type { ParkingSource } from "./sources.js";
import { validateImportedRecord } from "./schema.js";

export interface PartInfo { file: string; count: number; bytes: number; sha256: string }
export interface ImportReport {
  sourceId: string;
  read: number;
  emitted: number;
  rejected: Record<string, number>;
  unknownFieldCount: Record<"aodaType" | "accessibleSpaces" | "cityAccessibleFlag", number>;
  heldByLicence: boolean;
  retrievedAt: string;
  partitions: PartInfo[];
  coverageClaim: false;
  summary: { en: string; fr: string };
}
export const MESSAGES = {
  en: (name: string, count: number) => `${name}: ${count} records imported. Counts do not imply coverage.`,
  fr: (name: string, count: number) => `${name}${"\u00A0"}: ${count} enregistrements importés. Les chiffres ne constituent pas une mesure de couverture.`,
};
export function newReport(source: ParkingSource, day: string, heldByLicence: boolean): ImportReport {
  return { sourceId: source.id, read: 0, emitted: 0, rejected: {},
    unknownFieldCount: { aodaType: 0, accessibleSpaces: 0, cityAccessibleFlag: 0 },
    heldByLicence, retrievedAt: day, partitions: [], coverageClaim: false,
    summary: { en: MESSAGES.en(source.name.en, 0), fr: MESSAGES.fr(source.name.fr, 0) } };
}
export function countRecord(report: ImportReport, record: ImportedRecord): boolean {
  report.read++;
  if (!validateImportedRecord(record)) { reject(report, "schema-invalid", false); return false; }
  report.emitted++;
  for (const key of ["aodaType", "accessibleSpaces", "cityAccessibleFlag"] as const) {
    if (record.facts[key].value === null) report.unknownFieldCount[key]++;
  }
  return true;
}
export function reject(report: ImportReport, reason: string, addRead = true): void {
  if (addRead) report.read++;
  report.rejected[reason] = (report.rejected[reason] ?? 0) + 1;
}
export function finishReport(report: ImportReport, source: ParkingSource): void {
  report.summary = { en: MESSAGES.en(source.name.en, report.emitted), fr: MESSAGES.fr(source.name.fr, report.emitted) };
}
export interface LicenceRecord { checkedOn: string; urlRead: string; result: "permitted" | "not-permitted" }
export function licenceAllowed(source: ParkingSource, record?: LicenceRecord): boolean {
  if (source.licenceStatus === "open") return true;
  return !!record && /^\d{4}-\d{2}-\d{2}$/.test(record.checkedOn) &&
    !Number.isNaN(Date.parse(record.checkedOn)) && /^https:\/\//.test(record.urlRead) && record.result === "permitted";
}
