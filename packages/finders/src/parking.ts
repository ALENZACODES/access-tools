import {
  copy,
  AVAILABILITY_DISCLAIMER,
  distanceMetres,
  formatMm,
  isGeoPoint,
  labelOf,
  privilegeText,
  tierPhrase,
  profileStepFreeReason,
  unknownLabel,
  vanLiftReading,
  type EquipmentProfile,
  vanLiftText,
  winterClearanceText,
  type GeoPoint,
  type Lang,
  type ParkingBay,
  type PlacePack,
} from "@access-tools/place";
import { finderCopy } from "./i18n.js";

export interface ParkingQuery {
  text: string;
  lang: Lang;
  origin: GeoPoint | null;
  vanLift: boolean;
  showHidden: boolean;
  month: number;
  /** On-device equipment profile. An unknown step-free route is not a match. */
  profile?: EquipmentProfile | null;
}

export interface ParkingHit {
  placeId: string;
  bayId: string;
  placeName: string;
  placeNameIsEnglish: boolean;
  bayName: string;
  kindText: string;
  widthText: string;
  aisleText: string;
  distanceToEntranceText: string;
  paymentText: string;
  verificationDate: string;
  tierText: string;
  vanLiftText: string;
  privilegeText: string;
  winterText: string;
  straightLineMetres: number | null;
  hiddenReasons: string[];
}

export interface ParkingResult {
  hits: ParkingHit[];
  hidden: ParkingHit[];
  disclaimer: string;
  empty: boolean;
}

export function findParking(pack: PlacePack, query: ParkingQuery): ParkingResult {
  const needle = query.text.trim().toLowerCase();
  const hits: ParkingHit[] = [];
  for (const place of pack.places) {
    const placeName = query.lang === "fr" && place.nameFr ? place.nameFr : place.identity.name;
    for (const bay of place.parking.bays) {
      const blob = `${placeName} ${place.identity.municipality} ${bay.name} ${place.identity.address ?? ""}`.toLowerCase();
      if (needle && !blob.includes(needle)) continue;
      const point = isGeoPoint(place.identity.latitude, place.identity.longitude);
      const provenance = bay.widthMm.provenance ?? bay.aisleWidthMm.provenance ?? place.recordProvenance;
      hits.push({
        placeId: place.id,
        bayId: bay.id,
        placeName,
        placeNameIsEnglish: query.lang === "fr" && !place.nameFr,
        bayName: bay.name,
        kindText: labelOf(`bay.${bay.kind}`, query.lang),
        widthText: formatMm(bay.widthMm.value, query.lang),
        aisleText: formatMm(bay.aisleWidthMm.value, query.lang),
        distanceToEntranceText:
          bay.distanceToEntranceM.value === null ? unknownLabel(query.lang) : `${bay.distanceToEntranceM.value} m`,
        paymentText: place.parking.payment.value ?? unknownLabel(query.lang),
        verificationDate: provenance?.sourceDate ?? unknownLabel(query.lang),
        tierText: provenance ? tierPhrase(provenance, place.datasetStatus, query.lang, place.publicationContext) : unknownLabel(query.lang),
        vanLiftText: vanLiftText(vanLiftReading(bay), query.lang),
        privilegeText: privilegeText(bay, query.lang),
        winterText: winterClearanceText(bay.snowClearedOn.value, query.month, query.lang),
        straightLineMetres: query.origin && point ? distanceMetres(query.origin, point) : null,
        hiddenReasons: parkingReasons(bay, query),
      });
    }
  }
  const hidden = hits.filter((hit) => hit.hiddenReasons.length > 0);
  const shown = hits.filter((hit) => hit.hiddenReasons.length === 0);
  const sort = (a: ParkingHit, b: ParkingHit) => {
    if (a.straightLineMetres === null && b.straightLineMetres !== null) return 1;
    if (a.straightLineMetres !== null && b.straightLineMetres === null) return -1;
    if (a.straightLineMetres !== null && b.straightLineMetres !== null && a.straightLineMetres !== b.straightLineMetres) {
      return a.straightLineMetres - b.straightLineMetres;
    }
    return a.placeName.localeCompare(b.placeName, query.lang);
  };
  shown.sort(sort);
  hidden.sort(sort);
  return {
    hits: shown,
    hidden,
    disclaimer: AVAILABILITY_DISCLAIMER[query.lang],
    empty: shown.length === 0,
  };
}

function parkingReasons(bay: ParkingBay, query: ParkingQuery): string[] {
  const list: string[] = [];
  if (query.vanLift) {
    const reading = vanLiftReading(bay);
    if (reading !== "aisle-recorded") {
      list.push(reading === "no-deployment-space" ? copy("lift.type-b", query.lang) : finderCopy("finder.lift-hidden", query.lang));
    }
  }
  const stepFree = profileStepFreeReason(bay.stepFreeRoute.value, query.profile ?? null, query.lang);
  if (stepFree) list.push(stepFree);
  return list;
}
