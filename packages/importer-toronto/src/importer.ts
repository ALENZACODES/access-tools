import type { CkanPage } from "./ckan.js";
import { CATALOG } from "./catalog.js";
import { mapRow } from "./map.js";
import { validateRecord, validateReport, validationErrors } from "./schema.js";
import type { Source } from "./sources.js";
import { FACT_KEYS, type ImportReport, type ImportedRecord, type LicenceRecord } from "./types.js";

export function licenceAllowed(source: Source, approval?: LicenceRecord): boolean {
  if (source.licenceStatus === "open" || source.licenceStatus === "open-recorded") return true;
  return !!approval && /^\d{4}-\d{2}-\d{2}$/.test(approval.checkedOn) &&
    !Number.isNaN(Date.parse(approval.checkedOn)) && approval.urlRead === source.datasetUrl &&
    (approval.result === "open" || approval.result === "open-recorded");
}
export function newReport(source: Source, retrievedAt: string): ImportReport {
  return {
    sourceId: source.id, read: 0, emitted: 0, rejected: {},
    unknownFieldCount: Object.fromEntries(FACT_KEYS.map((key) => [key, 0])) as ImportReport["unknownFieldCount"],
    heldByLicence: false, retrievedAt, partitions: [], coverageNotice: CATALOG.en.disclaimer,
    summary: { en: "", fr: "" },
  };
}
export function finishReport(report: ImportReport): ImportReport {
  report.summary = {
    en: CATALOG.en.summary(report.sourceId, report.read, report.emitted),
    fr: CATALOG.fr.summary(report.sourceId, report.read, report.emitted),
  };
  if (!validateReport(report)) throw new Error(`Invalid report: ${validationErrors("report").join("; ")}`);
  return report;
}
export async function* importPages(
  pages: AsyncIterable<CkanPage>, source: Source, sourceDate: string,
  report: ImportReport, approval?: LicenceRecord,
): AsyncGenerator<ImportedRecord> {
  if (!licenceAllowed(source, approval)) {
    report.heldByLicence = true;
    report.rejected["licence-held"] = 0;
    return;
  }
  for await (const page of pages) {
    for (const row of page.records) {
      report.read++;
      const record = mapRow(row, source, sourceDate, report.retrievedAt);
      if (!record) {
        report.rejected["missing-id"] = (report.rejected["missing-id"] ?? 0) + 1;
        continue;
      }
      if (!validateRecord(record)) {
        report.rejected["schema-invalid"] = (report.rejected["schema-invalid"] ?? 0) + 1;
        continue;
      }
      if (record.geometry === null) report.rejected["bad-geometry"] = (report.rejected["bad-geometry"] ?? 0) + 1;
      for (const key of FACT_KEYS) if (record.facts[key].value === null) report.unknownFieldCount[key]++;
      report.emitted++;
      yield record;
    }
  }
}
