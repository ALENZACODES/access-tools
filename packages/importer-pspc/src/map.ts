import { parseCsv } from "#src/csv";
import { summaryLine, CATALOG } from "#src/i18n";
import type { SourceDef } from "#src/sources";
import type {
  AccessibilityScore,
  AddressFact,
  ImportedRecord,
  ImportReport,
  PartitionEntry,
  Provenance,
  Sourced,
} from "#src/types";

export const COL = {
  id: "AO-ID_ID-OA",
  nameEn: "Structure-name_Nom-du-structure_eng",
  nameFr: "Structure-name_Nom-du-structure_fra",
  addressEn: "Structure-address_Adresse-du-structure_eng",
  addressFr: "Structure-address_Adresse-du-structure_fra",
  city: "City_Ville",
  province: "Province-code_Code-de-province",
  postal: "Postal-code_Code-postal",
  fiscalYear: "Assessment-fscl-yr_Ex-evaluation",
  standard: "Compliance-standard-applied_Norme-de-conformite-appliquee",
  score: "Accessibility-score_Score-accessibilite",
} as const;

/** Every source column kept verbatim in `raw`. None holds personal data. */
export const RAW_COLUMNS: readonly string[] = [
  "AO-ID_ID-OA",
  "DFRP-property-nbr_No-bien-RBIF",
  "Property-name_Nom-du-bien_eng",
  "Property-name_Nom-du-bien_fra",
  "DFRP-structure-nbr_No-structure-RBIF",
  "Structure-name_Nom-du-structure_eng",
  "Structure-name_Nom-du-structure_fra",
  "Interest-type_Type-de-propriete_eng",
  "Interest-type_Type-de-propriete_fra",
  "Year-built_Annee-de-construction",
  "Heritage-code_Code-du-patrimoine",
  "Heritage-designation_Designation-patrimoniale_eng",
  "Heritage-designation_Designation-patrimoniale_fra",
  "Region_eng",
  "Region_fra",
  "Structure-address_Adresse-du-structure_eng",
  "Structure-address_Adresse-du-structure_fra",
  "City_Ville",
  "Province-code_Code-de-province",
  "Province-territory_Province-territoire_eng",
  "Province-territory_Province-territoire_fra",
  "Postal-code_Code-postal",
  "Assessment-fscl-yr_Ex-evaluation",
  "Compliance-standard-applied_Norme-de-conformite-appliquee",
  "Accessibility-score_Score-accessibilite",
];

export class ImporterError extends Error {}

export interface Counters {
  read: number;
  emitted: number;
  rejected: Record<string, number>;
  skipped: Record<string, number>;
  unknownFieldCount: Record<string, number>;
  unknownReasons: Record<string, number>;
}

export function createCounters(): Counters {
  return { read: 0, emitted: 0, rejected: {}, skipped: {}, unknownFieldCount: {}, unknownReasons: {} };
}

const bump = (m: Record<string, number>, k: string) => {
  m[k] = (m[k] ?? 0) + 1;
};

const known = <T>(value: T, provenance: Provenance): Sourced<T> => ({
  value,
  provenance: { ...provenance },
  photoSlotIds: [],
});
const unknown = <T>(): Sourced<T> => ({ value: null, provenance: null, photoSlotIds: [] });

/** Integer 0-100 only. Returns a reason code when the score cannot be used. */
export function parseScore(text: string): { score: number } | { reason: "score-missing" | "score-out-of-range" } {
  const t = text.trim();
  if (t === "") return { reason: "score-missing" };
  if (!/^\d+$/.test(t)) return { reason: "score-out-of-range" };
  const n = Number(t);
  return n >= 0 && n <= 100 ? { score: n } : { reason: "score-out-of-range" };
}

export interface ImportOptions {
  source: SourceDef;
  /** Run date, YYYY-MM-DD. */
  retrievedAt: string;
  counters: Counters;
}

/** Streams ImportedRecords from CSV lines. Only the set of upstream ids seen is kept in memory. */
export async function* importPspc(lines: AsyncIterable<string>, opts: ImportOptions): AsyncGenerator<ImportedRecord> {
  const { source, retrievedAt, counters } = opts;
  const seen = new Set<string>();
  const provenance: Provenance = {
    sourceName: source.name.en,
    sourceId: source.id,
    sourceUrl: source.datasetUrl,
    licence: source.licenceName,
    sourceDate: source.sourceDate,
    recordDate: retrievedAt,
    retrievedAt,
    tier: 0,
    prototypeLabel: "SEEDED-OPEN-DATA",
    verifierType: "open-data-import",
  };
  let checked = false;

  for await (const row of parseCsv(lines)) {
    const v = row.values;
    if (!checked) {
      checked = true;
      const missing = Object.values(COL).filter((c) => !(c in v));
      if (missing.length) throw new ImporterError(`CSV header is missing: ${missing.join(", ")}`);
    }
    if (row.malformed) {
      counters.read++;
      bump(counters.rejected, "malformed-row");
      continue;
    }
    if (v[COL.province] !== "ON") {
      bump(counters.skipped, "skipped-out-of-province");
      continue;
    }
    counters.read++;
    const upstreamId = (v[COL.id] ?? "").trim();
    if (upstreamId === "") {
      bump(counters.rejected, "missing-id");
      continue;
    }
    if (seen.has(upstreamId)) {
      bump(counters.rejected, "duplicate-id");
      continue;
    }
    seen.add(upstreamId);

    const text = (c: string) => (v[c] ?? "").trim();
    const orNull = (s: string) => (s === "" ? null : s);

    const parsed = parseScore(v[COL.score] ?? "");
    const standard = text(COL.standard);
    let scoreFact: Sourced<AccessibilityScore>;
    if ("reason" in parsed) {
      bump(counters.unknownReasons, parsed.reason);
      scoreFact = unknown();
    } else if (standard === "") {
      bump(counters.unknownReasons, "standard-missing");
      scoreFact = unknown();
    } else {
      scoreFact = known({ score: parsed.score, standard, assessedFiscalYear: orNull(text(COL.fiscalYear)) }, provenance);
    }

    const address: AddressFact = {
      en: orNull(text(COL.addressEn)),
      fr: orNull(text(COL.addressFr)),
      city: orNull(text(COL.city)),
      postalCode: orNull(text(COL.postal)),
    };
    const addressFact: Sourced<AddressFact> = Object.values(address).some((x) => x !== null)
      ? known(address, provenance)
      : unknown();

    const nameEn = orNull(text(COL.nameEn));
    const nameFr = orNull(text(COL.nameFr));
    const facts: ImportedRecord["facts"] = {
      accessibilityScore: scoreFact,
      address: addressFact,
      // A building score is never converted into these. They stay UNKNOWN.
      stepFree: unknown(),
      entrance: unknown(),
      washroom: unknown(),
      parking: unknown(),
    };
    for (const [k, f] of Object.entries(facts)) if (f.value === null) bump(counters.unknownFieldCount, k);

    const raw: Record<string, string> = {};
    for (const c of RAW_COLUMNS) raw[c] = v[c] ?? "";

    counters.emitted++;
    yield {
      id: `${source.id}:${upstreamId}`,
      sourceId: source.id,
      upstreamId,
      kind: "building",
      name: nameEn === null ? unknown() : known(nameEn, provenance),
      nameFr: nameFr === null ? unknown() : known(nameFr, provenance),
      geometry: null,
      facts,
      raw,
    };
  }
}

export function buildReport(
  source: SourceDef,
  counters: Counters,
  opts: { retrievedAt: string; held: boolean; partitions: PartitionEntry[] },
): ImportReport {
  const total = Object.values(counters.rejected).reduce((a, b) => a + b, 0);
  const skipped = Object.values(counters.skipped).reduce((a, b) => a + b, 0);
  const line = (lang: "en" | "fr") => {
    const base = summaryLine(lang, counters.read, counters.emitted, total, skipped);
    return opts.held ? `${base}; ${CATALOG[lang].held}` : base;
  };
  return {
    reportVersion: 1,
    retrievedAt: opts.retrievedAt,
    countsAreNotACoverageClaim: true,
    notice: { en: CATALOG.en.notice, fr: CATALOG.fr.notice },
    summary: { en: line("en"), fr: line("fr") },
    sources: [
      {
        sourceId: source.id,
        retrievedAt: opts.retrievedAt,
        read: counters.read,
        emitted: counters.emitted,
        rejected: { total, byReason: { ...counters.rejected } },
        skipped: { ...counters.skipped },
        unknownFieldCount: { ...counters.unknownFieldCount },
        unknownReasons: { ...counters.unknownReasons },
        heldByLicence: opts.held,
        partitions: opts.partitions,
      },
    ],
  };
}
