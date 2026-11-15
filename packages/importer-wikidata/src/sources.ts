import type { LicenceRecord } from "./types";

export type LicenceStatus = "open" | "open-recorded" | "restricted" | "unknown";

export interface SourceDef {
  id: string;
  nameEn: string;
  nameFr: string;
  publisher: string;
  datasetUrl: string;
  apiUrl: string;
  licenceName: string;
  licenceUrl: string;
  licenceStatus: LicenceStatus;
  /** An attribution line is not an endorsement. */
  attribution: string;
  cadence: string;
}

export const WIKIDATA_P2846_ONTARIO: SourceDef = {
  id: "wikidata-p2846-ontario",
  nameEn: "Wikidata items in Ontario with wheelchair accessibility (P2846)",
  nameFr: "Éléments Wikidata en Ontario avec accessibilité en fauteuil roulant (P2846)",
  publisher: "Wikidata contributors",
  datasetUrl: "https://query.wikidata.org/",
  apiUrl: "https://query.wikidata.org/sparql",
  licenceName: "CC0 1.0",
  licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  licenceStatus: "open",
  attribution: "Data from Wikidata, released under CC0 1.0. Attribution is optional and is not an endorsement.",
  cadence: "Continuous",
};

export const SOURCES: readonly SourceDef[] = [WIKIDATA_P2846_ONTARIO];

export class LicenceGateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LicenceGateError";
  }
}

/**
 * A source whose licence status is not `open` or `open-recorded` produces no output
 * unless the caller passes a licence record. With a record the source is listed as held.
 */
export function licenceGate(source: SourceDef, record?: LicenceRecord | null): { held: boolean } {
  if (source.licenceStatus === "open" || source.licenceStatus === "open-recorded") return { held: false };
  if (
    record &&
    /^\d{4}-\d{2}-\d{2}$/.test(record.checkedOn) &&
    record.urlRead.trim() !== "" &&
    record.result.trim() !== ""
  ) {
    return { held: true };
  }
  throw new LicenceGateError(
    `Source ${source.id} has licence status "${source.licenceStatus}". Refusing to write without a licence record (checkedOn, urlRead, result).`,
  );
}
