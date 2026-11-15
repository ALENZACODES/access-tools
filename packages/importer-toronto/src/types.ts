export type Geometry =
  | { type: "Point"; coordinates: [number, number] }
  | { type: "LineString"; coordinates: [number, number][] }
  | { type: "Polygon"; coordinates: [number, number][][] };

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
export const FACT_KEYS = ["accessiblePedestrianSignal", "wheelchairAccessible", "accessibleWashroom"] as const;
export type FactKey = typeof FACT_KEYS[number];
export type Fact = Sourced<string>;
export interface ImportedRecord {
  id: string;
  sourceId: string;
  upstreamId: string;
  kind: "traffic-signal" | "pedestrian-crossover" | "pops" | "park-facility";
  name: { en: Sourced<string>; fr: Sourced<string> };
  geometry: Geometry | null;
  facts: Record<FactKey, Fact>;
  raw: Record<string, unknown>;
  reasons: ("bad-geometry")[];
}
export interface Partition { file: string; count: number; bytes: number; sha256: string }
export interface LicenceRecord { checkedOn: string; urlRead: string; result: "open" | "open-recorded" | "not-open" }
export interface ImportReport {
  sourceId: string;
  read: number;
  emitted: number;
  rejected: Record<string, number>;
  unknownFieldCount: Record<FactKey, number>;
  heldByLicence: boolean;
  retrievedAt: string;
  partitions: Partition[];
  coverageNotice: string;
  summary: { en: string; fr: string };
}
