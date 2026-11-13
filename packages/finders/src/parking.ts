import {
  AVAILABILITY_DISCLAIMER,
  distanceMetres,
  formatMm,
  isGeoPoint,
  privilegeText,
  tierPhrase,
  unknownLabel,
  vanLiftReading,
  vanLiftText,
  winterClearanceText,
  type GeoPoint,
  type Lang,
  type ParkingBay,
  type PlacePack,
} from "@access-tools/place";

export interface ParkingQuery {
  text: string;
  lang: Lang;
  origin: GeoPoint | null;
  vanLift: boolean;
  showHidden: boolean;
  month: number;
}

export interface ParkingHit {
  placeId: string;
  bayId: string;
  placeName: string;
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
        bayName: bay.name,
        kindText: bay.kind,
        widthText: formatMm(bay.widthMm.value, query.lang),
        aisleText: formatMm(bay.aisleWidthMm.value, query.lang),
        distanceToEntranceText:
          bay.distanceToEntranceM.value === null ? unknownLabel(query.lang) : `${bay.distanceToEntranceM.value} m`,
        paymentText: place.parking.payment.value ?? unknownLabel(query.lang),
        verificationDate: provenance?.sourceDate ?? unknownLabel(query.lang),
        tierText: provenance ? tierPhrase(provenance.tier, place.datasetStatus, query.lang) : unknownLabel(query.lang),
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
    disclaimer: query.lang === "fr" ? AVAILABILITY_DISCLAIMER.fr : AVAILABILITY_DISCLAIMER.en,
    empty: shown.length === 0,
  };
}

function parkingReasons(bay: ParkingBay, query: ParkingQuery): string[] {
  if (!query.vanLift) return [];
  const reading = vanLiftReading(bay);
  if (reading === "aisle-recorded") return [];
  const en =
    reading === "no-deployment-space"
      ? "Type B bay. No side-lift deployment space is recorded."
      : "Lift space is unknown, so this bay is not shown for a side lift.";
  const fr =
    reading === "no-deployment-space"
      ? "Place de type B. Aucun espace de déploiement de hayon latéral n'est enregistré."
      : "L'espace de hayon est inconnu, donc cette place n'est pas affichée pour un hayon latéral.";
  return [query.lang === "fr" ? fr : en];
}
