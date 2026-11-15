import type { HousingRoom, Provenance, RoomFacts, Sourced } from "./types.js";
/** All records and values are fabricated demonstrations, NOT actual housing or measured premises. */
const provenance: Provenance = {
  sourceName: "Synthetic demonstration authored for the App",
  sourceId: "demo-housing-2026-11-15",
  licence: "CC0-1.0 synthetic demonstration data",
  sourceDate: "2026-11-15", recordDate: "2026-11-15", retrievedAt: "2026-11-15",
  tier: 0, prototypeLabel: "PROTOTYPE-UNVERIFIED", verifierType: "fixture-author",
};
const unknown = <T>(): Sourced<T> => ({ value: null, provenance: null, photoSlotIds: [] });
const demo = <T>(value: T): Sourced<T> => ({ value, provenance: { ...provenance }, photoSlotIds: [] });
function facts(): RoomFacts {
  return {
    entranceStepHeightMm: unknown(), doorClearWidthMm: unknown(), turningDiameterMm: unknown(),
    bathroomTransferSide: unknown(), bathroomTransferSpaceMm: unknown(), showerBathNotes: unknown(),
    bedHeightMm: unknown(), bedClearanceMm: unknown(), elevator: unknown(), parking: unknown(), washroom: unknown(),
  };
}
export const DEMONSTRATION_ROOMS: HousingRoom[] = [
  {
    schemaVersion: "housing-room-1", id: "demo-toronto-room-01",
    name: { en: "Demonstration overnight room A", fr: "Chambre de démonstration A" },
    city: "Toronto", province: "ON", placeType: "hotel-room", datasetStatus: "labelled-fixture",
    recordProvenance: { ...provenance },
    facts: { ...facts(), doorClearWidthMm: demo(920), turningDiameterMm: demo(1550), elevator: demo("yes") },
  },
  {
    schemaVersion: "housing-room-1", id: "demo-ottawa-dwelling-01",
    name: { en: "Demonstration dwelling B", fr: "Logement de démonstration B" },
    city: "Ottawa", province: "ON", placeType: "dwelling", datasetStatus: "labelled-fixture",
    recordProvenance: { ...provenance },
    facts: { ...facts(), doorClearWidthMm: demo(780), bathroomTransferSide: demo("left"), parking: demo("Illustrative parking note") },
  },
];
