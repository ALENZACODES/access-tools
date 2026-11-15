/** Local counterpart of packages/place/src/types.ts; null is UNKNOWN. */
export interface Provenance {
  sourceName: string;
  sourceId: string;
  sourceUrl: string;
  licence: string;
  sourceDate: string;
  recordDate: string;
  retrievedAt: string;
  tier: 0;
  prototypeLabel: "SEEDED-OPEN-DATA";
  verifierType: "open-data-import";
}
export interface Sourced<T> {
  value: T | null;
  provenance: Provenance | null;
  photoSlotIds: string[];
}
export type Position = number[];
export type Geometry =
  | { type: "Point"; coordinates: Position }
  | { type: "LineString"; coordinates: Position[] }
  | { type: "MultiLineString"; coordinates: Position[][] }
  | { type: "Polygon"; coordinates: Position[][] }
  | { type: "MultiPolygon"; coordinates: Position[][][] };
export interface ImportedRecord {
  id: string;
  sourceId: string;
  upstreamId: string;
  kind: string;
  name: { en: Sourced<string>; fr: Sourced<string> };
  geometry: Geometry | null;
  geometryReason: "missing-geometry" | "invalid-geometry" | null;
  facts: {
    cityAccessibleFlag: Sourced<"yes" | "no">;
    stepFree: Sourced<"yes" | "no">;
    washroom: Sourced<"yes" | "no">;
    entrance: Sourced<"yes" | "no">;
  };
  unknownReasons: Record<string, string>;
  notes: string[];
  raw: Record<string, unknown>;
}
export interface ArcFeature {
  attributes: Record<string, unknown>;
  geometry?: Record<string, unknown> | null;
}
export interface ArcPage {
  features: ArcFeature[];
  exceededTransferLimit?: boolean;
  error?: { message: string };
}
export interface LayerMetadata {
  fields: { name: string; type?: string }[];
  objectIdField?: string;
  objectIdFieldName?: string;
  editingInfo?: { lastEditDate?: number };
  error?: { message: string };
}
export interface LicenceRecord {
  checkedOn: string;
  urlRead: string;
  result: "open" | "open-recorded" | "not-open";
}
export interface ImportReport {
  sourceId: string;
  read: number;
  emitted: number;
  rejected: Record<string, number>;
  unknownFieldCount: Record<string, number>;
  heldByLicence: boolean;
  retrievedAt: string;
  partitions: { file: string; records: number; bytes: number; sha256: string }[];
  coverageClaim: false;
  summary: { en: string; fr: string };
}
