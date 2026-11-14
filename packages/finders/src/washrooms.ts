import {
  distanceMetres,
  formatChangeTable,
  formatHoist,
  formatTransfer,
  isGeoPoint,
  isOpenAt,
  labelOf,
  tierPhrase,
  transferSideMatches,
  profileWashroomNotes,
  profileWashroomReasons,
  unknownLabel,
  useLabelText,
  type EquipmentProfile,
  washroomUseLabel,
  type CivilClock,
  type GeoPoint,
  type Lang,
  type PlacePack,
  type PlaceRecord,
  type Washroom,
} from "@access-tools/place";
import { coverageSentence } from "./coverage.js";
import { finderCopy } from "./i18n.js";

export interface WashroomQuery {
  text: string;
  lang: Lang;
  origin: GeoPoint | null;
  transferSide: "left" | "right" | "both" | "any";
  changeTable: boolean;
  hoist: boolean;
  registerOnly: boolean;
  openAt: CivilClock | null;
  showHidden: boolean;
  /** On-device equipment profile. A missing door width stays visible. Unknown step-free and change-table values are not matches. */
  profile?: EquipmentProfile | null;
}

export interface WashroomHit {
  placeId: string;
  washroomId: string;
  placeName: string;
  placeNameIsEnglish: boolean;
  washroomName: string;
  englishFragments: string[];
  municipality: string;
  distanceMetres: number | null;
  transferText: string;
  changeTableText: string;
  hoistText: string;
  accessText: string;
  hoursText: string;
  verificationDate: string;
  tierText: string;
  recommendation: string;
  phone: string | null;
  hiddenReasons: string[];
  /** Missing door-width notes. These do not hide the record. */
  profileNotes: string[];
}

export interface WashroomResult {
  hits: WashroomHit[];
  hidden: WashroomHit[];
  coverage: string;
  empty: boolean;
}

function reasons(place: PlaceRecord, washroom: Washroom, query: WashroomQuery): string[] {
  const list: string[] = [];
  const side = washroom.transfer.value?.side ?? null;
  if (query.transferSide !== "any" && !transferSideMatches(side, query.transferSide)) {
    list.push(finderCopy("finder.reason.transfer", query.lang));
  }
  if (query.changeTable && washroom.changeTable.value?.present !== "yes") {
    list.push(finderCopy("finder.reason.no-table", query.lang));
  }
  if (query.hoist && washroom.hoist.value?.present !== "yes") {
    list.push(finderCopy("finder.reason.no-hoist", query.lang));
  }
  const inRegister = washroom.changeTable.value?.present === "yes" || washroom.hoist.value?.present === "yes";
  if (query.registerOnly && !inRegister) list.push(finderCopy("finder.reason.no-register", query.lang));
  if (query.openAt) {
    const open = isOpenAt(washroom.hours, query.openAt);
    if (open === "unknown") list.push(finderCopy("finder.reason.hours-unknown", query.lang));
    else if (open === "closed") list.push(finderCopy("finder.closed", query.lang));
  }
  list.push(...profileWashroomReasons(place, washroom, query.profile ?? null, query.lang));
  return list;
}

export function findWashrooms(pack: PlacePack, query: WashroomQuery): WashroomResult {
  const needle = query.text.trim().toLowerCase();
  const hits: WashroomHit[] = [];
  for (const place of pack.places) {
    for (const washroom of place.washrooms) {
      const name = query.lang === "fr" && place.nameFr ? place.nameFr : place.identity.name;
      const blob = `${name} ${place.identity.municipality} ${washroom.name} ${place.identity.address ?? ""}`.toLowerCase();
      if (needle && !blob.includes(needle)) continue;
      const point = isGeoPoint(place.identity.latitude, place.identity.longitude);
      const provenance = washroom.turningDiameterMm.provenance ?? washroom.transfer.provenance ?? place.recordProvenance;
      const phone = washroom.accessPolicy.value?.phone ?? place.identity.phone;
      const hoist = washroom.hoist.value;
      const table = washroom.changeTable.value;
      const access = washroom.accessPolicy.value;
      hits.push({
        placeId: place.id,
        washroomId: washroom.id,
        placeName: name,
        placeNameIsEnglish: query.lang === "fr" && !place.nameFr,
        washroomName: washroom.name,
        englishFragments:
          query.lang === "fr"
            ? [hoist?.type, hoist?.slingPolicy, hoist?.operatorAvailability, table?.heightRange, table?.productLabel, access?.howToObtain].filter(
                (item): item is string => typeof item === "string" && item.trim().length > 0,
              )
            : [],
        municipality: place.identity.municipality,
        distanceMetres: query.origin && point ? distanceMetres(query.origin, point) : null,
        transferText: formatTransfer(washroom.transfer.value, query.lang),
        changeTableText: formatChangeTable(washroom.changeTable.value, query.lang),
        hoistText: formatHoist(washroom.hoist.value, query.lang),
        accessText: washroom.accessPolicy.value
          ? `${labelOf(`access.${washroom.accessPolicy.value.method}`, query.lang)}. ${washroom.accessPolicy.value.howToObtain ?? unknownLabel(query.lang)}`
          : unknownLabel(query.lang),
        hoursText: washroom.hoursReliability.value?.hoursText ?? unknownLabel(query.lang),
        verificationDate: provenance?.sourceDate ?? unknownLabel(query.lang),
        tierText: provenance ? tierPhrase(provenance, place.datasetStatus, query.lang, place.publicationContext) : unknownLabel(query.lang),
        recommendation: useLabelText(washroomUseLabel(place.datasetStatus, washroom), query.lang),
        phone,
        hiddenReasons: reasons(place, washroom, query),
        profileNotes: profileWashroomNotes(washroom, query.profile ?? null, query.lang, place),
      });
    }
  }
  const hidden = hits.filter((hit) => hit.hiddenReasons.length > 0);
  const shown = hits.filter((hit) => hit.hiddenReasons.length === 0);
  const byDistance = (a: WashroomHit, b: WashroomHit) => {
    if (a.distanceMetres === null && b.distanceMetres !== null) return 1;
    if (a.distanceMetres !== null && b.distanceMetres === null) return -1;
    if (a.distanceMetres !== null && b.distanceMetres !== null && a.distanceMetres !== b.distanceMetres) {
      return a.distanceMetres - b.distanceMetres;
    }
    return a.placeName.localeCompare(b.placeName, query.lang);
  };
  shown.sort(byDistance);
  hidden.sort(byDistance);
  return {
    hits: shown,
    hidden,
    coverage: coverageSentence(
      pack.places.filter((place) => place.washrooms.length > 0).map((place) => place.identity.municipality),
      query.lang,
    ),
    empty: shown.length === 0,
  };
}
