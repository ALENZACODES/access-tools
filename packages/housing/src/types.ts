/** Compatible with the provenance and Sourced<T> shape in @access-tools/place. */
export type Language = "en" | "fr";
export interface Bilingual { en: string; fr: string }
export interface Provenance {
  sourceName: string;
  sourceId: string;
  sourceUrl?: string;
  licence: string;
  sourceDate: string;
  recordDate: string;
  retrievedAt: string;
  tier: 0 | 1 | 2 | "E";
  prototypeLabel: "PROTOTYPE-UNVERIFIED" | "SEEDED-OPEN-DATA";
  verifierType: "open-data-import" | "business" | "peer" | "surveyor" | "operator-feed" | "fixture-author" | "desk-reviewer";
}
export interface Sourced<T> { value: T | null; provenance: Provenance | null; photoSlotIds: [] }
export interface RoomFacts {
  entranceStepHeightMm: Sourced<number>;
  doorClearWidthMm: Sourced<number>;
  turningDiameterMm: Sourced<number>;
  bathroomTransferSide: Sourced<"left" | "right" | "both">;
  bathroomTransferSpaceMm: Sourced<number>;
  showerBathNotes: Sourced<string>;
  bedHeightMm: Sourced<number>;
  bedClearanceMm: Sourced<number>;
  elevator: Sourced<"yes" | "no">;
  parking: Sourced<string>;
  washroom: Sourced<string>;
}
export interface HousingRoom {
  schemaVersion: "housing-room-1";
  id: string;
  name: Bilingual;
  city: string;
  province: "ON";
  placeType: "dwelling" | "hotel-room";
  datasetStatus: "labelled-fixture";
  recordProvenance: Provenance;
  facts: RoomFacts;
}
export type BarrierCategory = "applied" | "waited" | "refused" | "unsuitable";
export interface BarrierReport { category: BarrierCategory; city?: string }
