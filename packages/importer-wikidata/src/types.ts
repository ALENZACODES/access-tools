/**
 * Record types emitted by this importer. They are declared locally and kept
 * compatible with `Provenance` and `Sourced<T>` in packages/place/src/types.ts.
 * A null value is UNKNOWN. It is never a guess.
 */

export interface ImportProvenance {
  sourceName: string;
  sourceId: string;
  sourceUrl: string;
  licence: string;
  /** YYYY-MM-DD */
  sourceDate: string;
  /** YYYY-MM-DD */
  recordDate: string;
  /** YYYY-MM-DD */
  retrievedAt: string;
  tier: 0;
  prototypeLabel: "SEEDED-OPEN-DATA";
  verifierType: "open-data-import";
}

export interface Sourced<T> {
  value: T | null;
  provenance: ImportProvenance | null;
  photoSlotIds: string[];
}

export type WheelchairAccessibilityStatement = "accessible" | "partially-accessible" | "inaccessible";

export interface GeoPoint {
  type: "Point";
  /** [longitude, latitude] in EPSG:4326 */
  coordinates: [number, number];
}

export type Geometry =
  | GeoPoint
  | { type: "LineString"; coordinates: number[][] }
  | { type: "Polygon"; coordinates: number[][][] };

export interface ImportedFacts {
  /** A Wikidata statement about the item. It is not a measurement. */
  wheelchairAccessibilityStatement: Sourced<WheelchairAccessibilityStatement>;
  /** Never filled by this importer. */
  stepFree: Sourced<"yes" | "no">;
  entranceDescription: Sourced<string>;
  washroomAccessible: Sourced<"yes" | "no">;
  parkingAccessible: Sourced<"yes" | "no">;
}

export interface ImportedRecord {
  /** `<sourceId>:<upstreamId>` */
  id: string;
  sourceId: string;
  upstreamId: string;
  kind: "wikidata-item";
  name: { en: Sourced<string>; fr: Sourced<string> };
  geometry: Geometry | null;
  facts: ImportedFacts;
  /** Why a fact is UNKNOWN, when the source had something we refused to map. */
  unknownReasons: Record<string, string>;
  /** Listed source columns, verbatim. */
  raw: {
    item: string;
    itemLabel_en: string | null;
    itemLabel_fr: string | null;
    v: string[];
    coord: string | null;
  };
}

export interface SparqlTerm {
  type: string;
  value: string;
  datatype?: string;
  "xml:lang"?: string;
}
export type Binding = Record<string, SparqlTerm | undefined>;
export interface SparqlResult {
  head: { vars: string[] };
  results: { bindings: Binding[] };
}

export interface PartitionInfo {
  file: string;
  records: number;
  bytes: number;
  sha256: string;
}

export interface Manifest {
  maxBytes: number;
  totalRecords: number;
  parts: PartitionInfo[];
}

export interface LicenceRecord {
  /** YYYY-MM-DD */
  checkedOn: string;
  urlRead: string;
  result: string;
}

export interface ImportReport {
  sourceId: string;
  retrievedAt: string;
  read: number;
  emitted: number;
  rejected: Record<string, number>;
  unknownFieldCount: Record<string, number>;
  unknownReasons: Record<string, number>;
  heldByLicence: boolean;
  licenceRecord: LicenceRecord | null;
  partitions: PartitionInfo[];
  coverageNotice: { en: string; fr: string };
  summary: { en: string; fr: string };
}
