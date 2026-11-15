export type SegmentKind = "sidewalk" | "walkway" | "multi-use-path" | "crosswalk" | "sidewalk-area";
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
export const FACT_KEYS = ["widthM", "widthBand", "curbCut", "railing", "grade", "surfaceMaterial", "surfaceCondition", "conditionDate", "sidewalkPresence", "sidewalkCode", "sidewalkDescription", "typeEn", "typeFr", "pathType", "clearedBy"] as const;
export type FactKey = typeof FACT_KEYS[number];
export type FactValue = string | number;
export type GeoGeometry = { type: "Point" | "LineString" | "Polygon"; coordinates: unknown };
export interface ImportedRecord {
  id: string;
  sourceId: string;
  upstreamId: string;
  kind: SegmentKind;
  name: { en: Sourced<string>; fr: Sourced<string> };
  geometry: GeoGeometry | null;
  facts: Record<FactKey, Sourced<FactValue>>;
  raw: Record<string, unknown>;
}
export interface Part { file: string; records: number; bytes: number; sha256: string }
export interface ImportReport {
  sourceId: string;
  read: number;
  emitted: number;
  rejected: Record<string, number>;
  unknownFieldCount: Record<FactKey, number>;
  heldByLicence: boolean;
  retrievedAt: string;
  parts: Part[];
  coverageClaim: false;
  summary: { en: string; fr: string };
}
export interface LicenceRecord { checkedOn: string; urlRead: string; result: "approved" | "rejected" }
