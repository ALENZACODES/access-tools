// @ts-expect-error TS5097: explicit .ts extension is required by node --experimental-strip-types
import { t } from "./i18n.ts";
import type { SourceDef } from "./sources";
import type { ImportReport, LicenceRecord, PartitionInfo } from "./types";
import type { ImportStats } from "./mapper";

export interface ReportInput {
  source: SourceDef;
  stats: ImportStats;
  emitted: number;
  unknownFieldCount: Record<string, number>;
  retrievedAt: string;
  held: boolean;
  licenceRecord?: LicenceRecord | null;
  partitions: PartitionInfo[];
}

export function buildReport(i: ReportInput): ImportReport {
  const rejected = Object.values(i.stats.rejected).reduce((a, b) => a + b, 0);
  const line = (lang: "en" | "fr") =>
    [
      t(lang, "summary", {
        sourceName: lang === "en" ? i.source.nameEn : i.source.nameFr,
        retrievedAt: i.retrievedAt,
        read: i.stats.read,
        emitted: i.emitted,
        rejected,
      }),
      t(lang, i.held ? "licenceHeld" : "licenceOpen"),
      t(lang, "statementNote"),
      t(lang, "notCoverage"),
    ].join(" ");
  return {
    sourceId: i.source.id,
    retrievedAt: i.retrievedAt,
    read: i.stats.read,
    emitted: i.emitted,
    rejected: { ...i.stats.rejected },
    unknownFieldCount: { ...i.unknownFieldCount },
    unknownReasons: { ...i.stats.unknownReasons },
    heldByLicence: i.held,
    licenceRecord: i.licenceRecord ?? null,
    partitions: i.partitions,
    coverageNotice: { en: t("en", "notCoverage"), fr: t("fr", "notCoverage") },
    summary: { en: line("en"), fr: line("fr") },
  };
}
