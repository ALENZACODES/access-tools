export type LicenceStatus = "open" | "open-recorded" | "unverified" | "restricted";

export interface SourceDef {
  id: string;
  name: { en: string; fr: string };
  publisher: string;
  datasetUrl: string;
  /** The catalogue lists no API for this dataset. */
  apiUrl: string | null;
  downloadUrl: string;
  licenceName: string;
  licenceUrl: string;
  licenceStatus: LicenceStatus;
  attribution: string;
  cadence: string;
  /** Dataset metadata date from open.canada.ca (YYYY-MM-DD). */
  sourceDate: string;
}

export const PSPC_SOURCE_ID = "pspc-building-accessibility";

export const SOURCES: SourceDef[] = [
  {
    id: PSPC_SOURCE_ID,
    name: {
      en: "Total Accessibility Score of PSPC owned and lease-purchased buildings",
      // App-supplied French display name; not necessarily the publisher's official title.
      fr: "Score d'accessibilité total des immeubles de SPAC (propriété de l'État et acquis par bail-achat)",
    },
    publisher: "Public Services and Procurement Canada",
    datasetUrl: "https://open.canada.ca/data/en/dataset/aaf6462d-eab9-4165-9329-24095451121d",
    apiUrl: null,
    downloadUrl:
      "https://donnees-data.tpsgc-pwgsc.gc.ca/br1/immeublesaccessibilitenorme-buildingaccessibilitystandard/immeublesaccessibilitenorme-buildingaccessibilitystandard.csv",
    licenceName: "Open Government Licence – Canada 2.0",
    licenceUrl: "https://open.canada.ca/en/open-government-licence-canada",
    licenceStatus: "open",
    attribution: "Contains information licensed under the Open Government Licence – Canada.",
    cadence: "Not planned (one-off; assessed 2020–2021)",
    sourceDate: "2026-03-21",
  },
];

export interface LicenceRecord {
  /** YYYY-MM-DD */
  checkedOn: string;
  urlRead: string;
  result: string;
}

export class LicenceGateError extends Error {}

/**
 * A source whose licence status is not open / open-recorded may not produce output.
 * With a complete licence record the run may proceed but is listed as held and writes nothing.
 */
export function licenceGate(source: SourceDef, record?: LicenceRecord): { held: boolean } {
  if (source.licenceStatus === "open" || source.licenceStatus === "open-recorded") return { held: false };
  const ok =
    record !== undefined &&
    /^\d{4}-\d{2}-\d{2}$/.test(record.checkedOn) &&
    record.urlRead.trim() !== "" &&
    record.result.trim() !== "";
  if (!ok) throw new LicenceGateError(`Licence gate: ${source.id} is "${source.licenceStatus}" and no complete licence record was given`);
  return { held: true };
}
