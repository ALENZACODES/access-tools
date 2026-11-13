import {
  distanceMetres,
  isGeoPoint,
  labelOf,
  localizeAuthored,
  placeHasAdultChangeTable,
  tierPhrase,
  placeHasHoist,
  placeHasStepFreeEntrance,
  placeHasVanBay,
  transferSideMatches,
  type GeoPoint,
  type Lang,
  type PlacePack,
  type PlaceRecord,
  type PlaceType,
  type SupplyCategory,
} from "@access-tools/place";
import { tokenSet } from "./tokenize.js";

export interface SciFilters {
  transferSide?: "left" | "right" | "both";
  adultChangeTable?: boolean;
  hoist?: boolean;
  vanAccessibleBay?: boolean;
  chargingRecorded?: boolean;
  stepFreeEntrance?: boolean;
  repairLinked?: boolean;
  supplyCategory?: SupplyCategory;
}

export interface SearchQuery {
  text: string;
  lang: Lang;
  municipality?: string;
  category?: string;
  placeType?: PlaceType;
  sci: SciFilters;
  showHidden: boolean;
  sort: "name" | "source-date" | "distance";
  origin: GeoPoint | null;
  page: number;
  pageSize: number;
}

export interface SearchHit {
  placeId: string;
  name: string;
  /** True when the French screen is showing the English record name. */
  nameIsEnglish: boolean;
  municipality: string;
  category: string;
  tier: string;
  sourceName: string;
  sourceDate: string;
  recordDate: string;
  datasetStatus: PlaceRecord["datasetStatus"];
  distanceMetres: number | null;
  hiddenReasons: string[];
}

export interface SearchResponse {
  hits: SearchHit[];
  hidden: SearchHit[];
  matched: number;
  empty: boolean;
  queryText: string;
  page: number;
  pageCount: number;
}

export function emptySearchQuery(lang: Lang): SearchQuery {
  return {
    text: "",
    lang,
    sci: {},
    showHidden: false,
    sort: "name",
    origin: null,
    page: 1,
    pageSize: 20,
  };
}

function documentText(place: PlaceRecord): string {
  return JSON.stringify(place);
}

function reasons(place: PlaceRecord, pack: PlacePack, sci: SciFilters, lang: Lang): string[] {
  const list: string[] = [];
  const say = (en: string, fr: string) => list.push(lang === "fr" ? fr : en);
  if (sci.stepFreeEntrance && !placeHasStepFreeEntrance(place)) {
    say(
      "Step-free entrance is not recorded as yes, so this place is not shown as step-free.",
      "L'entrée sans marche n'est pas enregistrée comme oui, donc ce lieu n'est pas affiché comme sans marche.",
    );
  }
  if (sci.transferSide) {
    const needed = sci.transferSide;
    const ok = place.washrooms.some((washroom) => transferSideMatches(washroom.transfer.value?.side ?? null, needed));
    if (!ok) {
      say(
        "No washroom record matches that transfer side. Unknown is not a match.",
        "Aucune fiche de toilettes ne correspond à ce côté de transfert. Inconnu n'est pas une correspondance.",
      );
    }
  }
  if (sci.adultChangeTable && !placeHasAdultChangeTable(place)) {
    say(
      "No adult change table is recorded as present.",
      "Aucune table de change adulte n'est enregistrée comme présente.",
    );
  }
  if (sci.hoist && !placeHasHoist(place)) {
    say("No hoist is recorded as present.", "Aucun lève-personne n'est enregistré comme présent.");
  }
  if (sci.vanAccessibleBay && !placeHasVanBay(place)) {
    say(
      "No Type A bay with a recorded width and aisle is in this record.",
      "Aucune place de type A avec largeur et allée enregistrées n'est dans cette fiche.",
    );
  }
  if (sci.chargingRecorded && place.chargingPoints.length === 0) {
    say("No charging-point record is linked.", "Aucune fiche de point de recharge n'est liée.");
  }
  if (sci.repairLinked && place.linkedRepairerIds.length === 0) {
    say("No repairer record is linked.", "Aucune fiche de réparateur n'est liée.");
  }
  if (sci.supplyCategory) {
    const wanted = sci.supplyCategory;
    const stores = pack.supplyStores.filter((store) => place.linkedSupplyStoreIds.includes(store.id));
    const ok = stores.some((store) => store.categoriesPublished.includes(wanted));
    if (!ok) {
      say(
        "No linked supply record publishes that category.",
        "Aucune fiche de fournitures liée ne publie cette catégorie.",
      );
    }
  }
  return list;
}

function compare(query: SearchQuery, a: SearchHit, b: SearchHit): number {
  if (query.sort === "source-date") {
    const byDate = b.sourceDate.localeCompare(a.sourceDate);
    if (byDate !== 0) return byDate;
  }
  if (query.sort === "distance") {
    if (a.distanceMetres === null && b.distanceMetres !== null) return 1;
    if (a.distanceMetres !== null && b.distanceMetres === null) return -1;
    if (a.distanceMetres !== null && b.distanceMetres !== null && a.distanceMetres !== b.distanceMetres) {
      return a.distanceMetres - b.distanceMetres;
    }
  }
  return a.name.localeCompare(b.name, query.lang);
}

export function searchPack(pack: PlacePack, query: SearchQuery): SearchResponse {
  const tokens = tokenSet(query.text);
  const prepared: SearchHit[] = [];
  for (const place of pack.places) {
    if (query.municipality && place.identity.municipality !== query.municipality) continue;
    if (query.category && place.identity.category !== query.category) continue;
    if (query.placeType && place.identity.placeType !== query.placeType) continue;
    if (tokens.size > 0) {
      const haystack = tokenSet(documentText(place));
      const missing = [...tokens].some((token) => !haystack.has(token));
      if (missing) continue;
    }
    const point = isGeoPoint(place.identity.latitude, place.identity.longitude);
    const distance = query.origin && point ? distanceMetres(query.origin, point) : null;
    prepared.push({
      placeId: place.id,
      name: query.lang === "fr" && place.nameFr ? place.nameFr : place.identity.name,
      nameIsEnglish: query.lang === "fr" && !place.nameFr,
      municipality: place.identity.municipality,
      category: labelOf(`category.${place.identity.category}`, query.lang),
      tier: tierPhrase(place.recordProvenance, place.datasetStatus, query.lang, place.publicationContext),
      sourceName: localizeAuthored(place.recordProvenance.sourceName, query.lang),
      sourceDate: place.recordProvenance.sourceDate,
      recordDate: place.recordProvenance.recordDate,
      datasetStatus: place.datasetStatus,
      distanceMetres: distance,
      hiddenReasons: reasons(place, pack, query.sci, query.lang),
    });
  }
  const hidden = prepared.filter((hit) => hit.hiddenReasons.length > 0);
  const shown = prepared.filter((hit) => hit.hiddenReasons.length === 0);
  shown.sort((a, b) => compare(query, a, b));
  hidden.sort((a, b) => compare(query, a, b));
  const pageSize = Math.max(1, query.pageSize);
  const pageCount = Math.max(1, Math.ceil(shown.length / pageSize));
  const page = Math.min(Math.max(1, query.page), pageCount);
  const start = (page - 1) * pageSize;
  return {
    hits: shown.slice(start, start + pageSize),
    hidden,
    matched: prepared.length,
    empty: shown.length === 0,
    queryText: query.text,
    page,
    pageCount,
  };
}
