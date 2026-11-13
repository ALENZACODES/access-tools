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
  profilePlaceReasons,
  transferSideMatches,
  type EquipmentProfile,
  type GeoPoint,
  type Lang,
  type PlacePack,
  type PlaceRecord,
  type PlaceType,
  type SupplyCategory,
} from "@access-tools/place";
import { searchCopy } from "./i18n.js";
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
  /** On-device equipment profile. Unknown record values are not matches. */
  profile?: EquipmentProfile | null;
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

function reasons(place: PlaceRecord, pack: PlacePack, sci: SciFilters, lang: Lang, profile: EquipmentProfile | null): string[] {
  const list: string[] = [];
  if (sci.stepFreeEntrance && !placeHasStepFreeEntrance(place)) list.push(searchCopy("search.reason.step-free", lang));
  if (sci.transferSide) {
    const needed = sci.transferSide;
    const ok = place.washrooms.some((washroom) => transferSideMatches(washroom.transfer.value?.side ?? null, needed));
    if (!ok) list.push(searchCopy("search.reason.transfer", lang));
  }
  if (sci.adultChangeTable && !placeHasAdultChangeTable(place)) list.push(searchCopy("search.reason.change-table", lang));
  if (sci.hoist && !placeHasHoist(place)) list.push(searchCopy("search.reason.hoist", lang));
  if (sci.vanAccessibleBay && !placeHasVanBay(place)) list.push(searchCopy("search.reason.van", lang));
  if (sci.chargingRecorded && place.chargingPoints.length === 0) list.push(searchCopy("search.reason.charging", lang));
  if (sci.repairLinked && place.linkedRepairerIds.length === 0) list.push(searchCopy("search.reason.repair", lang));
  if (sci.supplyCategory) {
    const wanted = sci.supplyCategory;
    const stores = pack.supplyStores.filter((store) => place.linkedSupplyStoreIds.includes(store.id));
    const ok = stores.some((store) => store.categoriesPublished.includes(wanted));
    if (!ok) list.push(searchCopy("search.reason.supply", lang));
  }
  list.push(...profilePlaceReasons(place, profile, lang));
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
      hiddenReasons: reasons(place, pack, query.sci, query.lang, query.profile ?? null),
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
