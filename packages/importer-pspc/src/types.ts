/** Local copies of the contract in packages/place/src/types.ts (not imported). */

export interface Provenance {
  sourceName: string;
  sourceId: string;
  sourceUrl: string;
  licence: string;
  /** YYYY-MM-DD, date the source was published. */
  sourceDate: string;
  /** YYYY-MM-DD, date this field was written into the record. */
  recordDate: string;
  /** YYYY-MM-DD, date the source was retrieved. */
  retrievedAt: string;
  tier: 0;
  prototypeLabel: "SEEDED-OPEN-DATA";
  verifierType: "open-data-import";
}

/** A null value is UNKNOWN. Provenance is required when the value is non-null. */
export interface Sourced<T> {
  value: T | null;
  provenance: Provenance | null;
  photoSlotIds: string[];
}

export type Geometry =
  | { type: "Point"; coordinates: [number, number] }
  | { type: "LineString"; coordinates: [number, number][] }
  | { type: "Polygon"; coordinates: [number, number][][] };

export interface AccessibilityScore {
  /** The publisher's building-level score, integer 0-100. */
  score: number;
  /** The standard the publisher scored against, for example B651-18. */
  standard: string;
  assessedFiscalYear: string | null;
}

export interface AddressFact {
  en: string | null;
  fr: string | null;
  city: string | null;
  postalCode: string | null;
}

export interface ImportedFacts {
  accessibilityScore: Sourced<AccessibilityScore>;
  address: Sourced<AddressFact>;
  /** Always UNKNOWN: a building score is never converted into these facts. */
  stepFree: Sourced<"yes" | "no">;
  entrance: Sourced<never>;
  washroom: Sourced<never>;
  parking: Sourced<never>;
}

export interface ImportedRecord {
  /** `<sourceId>:<upstreamId>` */
  id: string;
  sourceId: string;
  upstreamId: string;
  kind: "building";
  name: Sourced<string>;
  nameFr: Sourced<string>;
  geometry: Geometry | null;
  facts: ImportedFacts;
  raw: Record<string, string>;
}

export interface PartitionEntry {
  file: string;
  records: number;
  bytes: number;
  sha256: string;
}

export interface SourceReport {
  sourceId: string;
  retrievedAt: string;
  /** In-scope rows read (Ontario rows, plus rows too malformed to classify). */
  read: number;
  emitted: number;
  rejected: { total: number; byReason: Record<string, number> };
  /** Rows deliberately left out, for example `skipped-out-of-province`. Not rejections. */
  skipped: Record<string, number>;
  unknownFieldCount: Record<string, number>;
  /** Why a fact is UNKNOWN, for example `score-missing`. */
  unknownReasons: Record<string, number>;
  heldByLicence: boolean;
  partitions: PartitionEntry[];
}

export interface ImportReport {
  reportVersion: 1;
  retrievedAt: string;
  /** Always true: counts describe this run only. */
  countsAreNotACoverageClaim: true;
  notice: { en: string; fr: string };
  summary: { en: string; fr: string };
  sources: SourceReport[];
}
