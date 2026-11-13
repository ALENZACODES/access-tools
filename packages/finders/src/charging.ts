import {
  chargingUseLabel,
  distanceMetres,
  formatYesNo,
  isGeoPoint,
  labelOf,
  isOpenAt,
  rangeNote,
  tierPhrase,
  unknownLabel,
  useLabelText,
  type CivilClock,
  type GeoPoint,
  type Lang,
  type PlacePack,
} from "@access-tools/place";
import { finderCopy } from "./i18n.js";

export interface ChargingQuery {
  text: string;
  lang: Lang;
  origin: GeoPoint | null;
  openAt: CivilClock | null;
  showHidden: boolean;
  userTestedRangeMetres: number | null;
}

export interface ChargingHit {
  placeId: string;
  pointId: string;
  placeName: string;
  placeNameIsEnglish: boolean;
  pointName: string;
  distanceMetres: number | null;
  accessText: string;
  hoursText: string;
  seatingText: string;
  verificationDate: string;
  tierText: string;
  recommendation: string;
  phone: string | null;
  rangeText: string | null;
  hiddenReasons: string[];
}

export interface ChargingResult {
  hits: ChargingHit[];
  hidden: ChargingHit[];
  empty: boolean;
  rangeReminder: string;
}

export function findCharging(pack: PlacePack, query: ChargingQuery): ChargingResult {
  const needle = query.text.trim().toLowerCase();
  const hits: ChargingHit[] = [];
  for (const place of pack.places) {
    const placeName = query.lang === "fr" && place.nameFr ? place.nameFr : place.identity.name;
    for (const point of place.chargingPoints) {
      const blob = `${placeName} ${point.name} ${place.identity.municipality}`.toLowerCase();
      if (needle && !blob.includes(needle)) continue;
      const geo = isGeoPoint(place.identity.latitude, place.identity.longitude);
      const metres = query.origin && geo ? distanceMetres(query.origin, geo) : null;
      const provenance = point.accessMethod.provenance ?? point.locationNote.provenance ?? place.recordProvenance;
      const reasons: string[] = [];
      if (query.openAt) {
        const open = isOpenAt(point.hours, query.openAt);
        if (open !== "open") {
          reasons.push(finderCopy(open === "unknown" ? "finder.hours-unknown-open" : "finder.closed", query.lang));
        }
      }
      hits.push({
        placeId: place.id,
        pointId: point.id,
        placeName,
        placeNameIsEnglish: query.lang === "fr" && !place.nameFr,
        pointName: point.name,
        distanceMetres: metres,
        accessText: point.accessMethod.value ? labelOf(`access.${point.accessMethod.value}`, query.lang) : unknownLabel(query.lang),
        hoursText: point.hoursText.value ?? unknownLabel(query.lang),
        seatingText: formatYesNo(point.seating.value, query.lang),
        verificationDate: provenance?.sourceDate ?? unknownLabel(query.lang),
        tierText: provenance ? tierPhrase(provenance, place.datasetStatus, query.lang, place.publicationContext) : unknownLabel(query.lang),
        recommendation: useLabelText(chargingUseLabel(place.datasetStatus, point), query.lang),
        phone: point.permissionContact.value ?? place.identity.phone,
        rangeText: rangeNote(metres, query.userTestedRangeMetres, query.lang),
        hiddenReasons: reasons,
      });
    }
  }
  const hidden = hits.filter((hit) => hit.hiddenReasons.length > 0);
  const shown = hits.filter((hit) => hit.hiddenReasons.length === 0);
  const sort = (a: ChargingHit, b: ChargingHit) => {
    if (a.distanceMetres === null && b.distanceMetres !== null) return 1;
    if (a.distanceMetres !== null && b.distanceMetres === null) return -1;
    if (a.distanceMetres !== null && b.distanceMetres !== null && a.distanceMetres !== b.distanceMetres) {
      return a.distanceMetres - b.distanceMetres;
    }
    return a.placeName.localeCompare(b.placeName, query.lang);
  };
  shown.sort(sort);
  hidden.sort(sort);
  return {
    hits: shown,
    hidden,
    empty: shown.length === 0,
    rangeReminder: finderCopy("finder.range-reminder", query.lang),
  };
}
