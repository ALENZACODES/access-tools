/** Standalone counterpart of the place package's Provenance and Sourced<T>. */
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
  derived?: boolean;
  derivedFrom?: string;
}
export type Boarding = "some-accessible-boarding" | "no-accessible-boarding" |
  "accessible-path" | "no-accessible-path";
export type LocationKind = "stop" | "station" | "entrance";
export interface ImportedRecord {
  id: string;
  sourceId: string;
  upstreamId: string;
  kind: LocationKind;
  name: Sourced<string> & { fr?: Sourced<string> };
  geometry: { type: "Point"; coordinates: [number, number] } | null;
  facts: {
    wheelchairBoarding: Sourced<Boarding>;
    parentStation: Sourced<string>;
  };
  raw: Record<string, string>;
}
export type LicenceStatus = "verify" | "unknown" | "open-recorded" | "open";
export interface Source {
  id: string;
  name: { en: string; fr: string };
  publisher: string;
  datasetUrl: string;
  apiUrl: string;
  licence: string;
  licenceUrl: string;
  licenceStatus: LicenceStatus;
  attribution: string;
  cadence: string;
}
export interface LicenceRecord {
  checkedOn: string;
  urlRead: string;
  result: "open" | "permission-granted" | "restricted";
}
export interface Partition { file: string; count: number; bytes: number; sha256: string }
export interface ImportReport {
  sourceId: string;
  read: number;
  emitted: number;
  rejected: Record<string, number>;
  byLocationType: Record<string, number>;
  wheelchairBoarding: { known: number; derived: number; unknown: number };
  unknownFieldCount: Record<string, number>;
  shareKnown: number;
  heldByLicence: boolean;
  retrievedAt: string;
  partitions: Partition[];
  coverageClaim: false;
  sourceDateNote?: "feed has no feed_info";
  summary: { en: string; fr: string };
}
