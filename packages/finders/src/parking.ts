import {
  copy,
  AVAILABILITY_DISCLAIMER,
  distanceMetres,
  formatMm,
  isGeoPoint,
  labelOf,
  localizeAuthored,
  formatYesNo,
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
  type PlaceRecord,
  type Provenance,
} from "@access-tools/place";
import { destinationMatches, parkingFilters, type FinderField, type FinderFilter, type SeededCount } from "./filters.js";
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
  /** Recorded as Type A, recorded as Type B, a drop-off point, or Unknown. */
  vanAccessibleText: string;
  surfaceText: string;
  /** Space type, van-accessible status, distance to the entrance, surface, payment, width, aisle and step-free route, each with tier, source and record date. */
  fields: FinderField[];
}

/** Bays that share one destination. */
export interface ParkingCluster {
  placeId: string;
  placeName: string;
  placeNameIsEnglish: boolean;
  municipality: string;
  straightLineMetres: number | null;
  bays: ParkingHit[];
}

export interface ParkingResult {
  hits: ParkingHit[];
  hidden: ParkingHit[];
  disclaimer: string;
  empty: boolean;
  /** Shown bays grouped by destination, in the same order as `hits`. */
  clusters: ParkingCluster[];
  filters: FinderFilter[];
  /** Bays in the pack, before the destination and the filters. */
  seeded: SeededCount;
  /** Bays at the searched destination, before the filters. */
  destinationCount: number;
}

function vanAccessibleText(bay: ParkingBay, lang: Lang): { text: string; unknown: boolean } {
  if (bay.kind === "type-a-van") return { text: finderCopy("finder.van.yes", lang), unknown: false };
  if (bay.kind === "type-b-standard") return { text: finderCopy("finder.van.no", lang), unknown: false };
  if (bay.kind === "drop-off") return { text: finderCopy("finder.van.drop-off", lang), unknown: false };
  return { text: unknownLabel(lang), unknown: true };
}

function field(
  place: PlaceRecord,
  id: string,
  label: string,
  valueText: string,
  unknown: boolean,
  provenance: Provenance | null,
  lang: Lang,
  english: string | null = null,
): FinderField {
  return {
    id,
    label,
    valueText,
    unknown,
    tierText: provenance ? tierPhrase(provenance, place.datasetStatus, lang, place.publicationContext) : copy("tier.none", lang),
    sourceName: provenance ? localizeAuthored(provenance.sourceName, lang) : copy("source.none", lang),
    recordDate: provenance?.recordDate ?? unknownLabel(lang),
    englishFragments: lang === "fr" && english ? [english] : [],
  };
}

function bayFields(place: PlaceRecord, bay: ParkingBay, lang: Lang): FinderField[] {
  const u = unknownLabel(lang);
  const van = vanAccessibleText(bay, lang);
  const payment = place.parking.payment;
  // The bay type has no field-level source. It carries the source of the record that names the bay.
  const named = bay.kind === "unverified" ? null : place.recordProvenance;
  return [
    field(place, `${bay.id}.type`, finderCopy("finder.space-type", lang), labelOf(`bay.${bay.kind}`, lang), false, named, lang),
    field(place, `${bay.id}.van`, finderCopy("finder.van", lang), van.text, van.unknown, named, lang),
    field(
      place,
      `${bay.id}.distance`,
      finderCopy("finder.entrance-distance", lang),
      bay.distanceToEntranceM.value === null ? u : `${bay.distanceToEntranceM.value} m`,
      bay.distanceToEntranceM.value === null,
      bay.distanceToEntranceM.provenance,
      lang,
    ),
    field(place, `${bay.id}.surface`, finderCopy("finder.surface", lang), bay.surface.value ?? u, bay.surface.value === null, bay.surface.provenance, lang, bay.surface.value),
    field(place, `${bay.id}.payment`, finderCopy("finder.payment-notes", lang), payment.value ?? u, payment.value === null, payment.provenance, lang, payment.value),
    field(place, `${bay.id}.width`, copy("bay.width", lang), formatMm(bay.widthMm.value, lang), bay.widthMm.value === null, bay.widthMm.provenance, lang),
    field(place, `${bay.id}.aisle`, copy("bay.aisle", lang), formatMm(bay.aisleWidthMm.value, lang), bay.aisleWidthMm.value === null, bay.aisleWidthMm.provenance, lang),
    field(
      place,
      `${bay.id}.step-free`,
      copy("bay.step-free", lang),
      formatYesNo(bay.stepFreeRoute.value, lang),
      bay.stepFreeRoute.value === null,
      bay.stepFreeRoute.provenance,
      lang,
    ),
  ];
}

export function findParking(pack: PlacePack, query: ParkingQuery): ParkingResult {
  const hits: ParkingHit[] = [];
  for (const place of pack.places) {
    const placeName = query.lang === "fr" && place.nameFr ? place.nameFr : place.identity.name;
    for (const bay of place.parking.bays) {
      if (!destinationMatches(place, query.text, [bay.name])) continue;
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
        vanAccessibleText: vanAccessibleText(bay, query.lang).text,
        surfaceText: bay.surface.value ?? unknownLabel(query.lang),
        fields: bayFields(place, bay, query.lang),
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
  const clusters: ParkingCluster[] = [];
  for (const hit of shown) {
    let cluster = clusters.find((item) => item.placeId === hit.placeId);
    if (!cluster) {
      const place = pack.places.find((item) => item.id === hit.placeId);
      cluster = {
        placeId: hit.placeId,
        placeName: hit.placeName,
        placeNameIsEnglish: hit.placeNameIsEnglish,
        municipality: place?.identity.municipality ?? unknownLabel(query.lang),
        straightLineMetres: hit.straightLineMetres,
        bays: [],
      };
      clusters.push(cluster);
    }
    cluster.bays.push(hit);
  }
  return {
    hits: shown,
    hidden,
    disclaimer: AVAILABILITY_DISCLAIMER[query.lang],
    empty: shown.length === 0,
    clusters,
    filters: parkingFilters(query),
    seeded: {
      records: pack.places.reduce((sum, place) => sum + place.parking.bays.length, 0),
      places: pack.places.filter((place) => place.parking.bays.length > 0).length,
    },
    destinationCount: hits.length,
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
