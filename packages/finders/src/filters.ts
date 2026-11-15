import { copy, labelOf, type EquipmentProfile, type Lang, type PlaceRecord } from "@access-tools/place";
import { finderCopy, finderFill } from "./i18n.js";
import type { ParkingQuery } from "./parking.js";
import type { WashroomQuery } from "./washrooms.js";

/** One record field as a finder shows it. A null value reads Unknown and carries no tier. */
export interface FinderField {
  id: string;
  label: string;
  valueText: string;
  unknown: boolean;
  tierText: string;
  sourceName: string;
  recordDate: string;
  /** Substrings of valueText that stay English on a French screen. */
  englishFragments: string[];
}

/** A filter that is on, with the rule it applies. */
export interface FinderFilter {
  id: string;
  label: string;
  explanation: string;
  /** "profile" comes from the saved equipment profile. "screen" was set on the finder. */
  origin: "profile" | "screen";
}

export interface SeededCount {
  records: number;
  places: number;
}

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Destination search. Matches the place name in either language, the address,
 * the municipality, and the record's own name. An empty search matches every place.
 */
export function destinationMatches(place: PlaceRecord, text: string, extra: string[] = []): boolean {
  const needle = fold(text.trim());
  if (!needle) return true;
  const blob = fold(
    [place.identity.name, place.nameFr ?? "", place.identity.municipality, place.identity.address ?? "", ...extra].join(" "),
  );
  return blob.includes(needle);
}

/** The name to put in the destination field when a finder opens for one place. */
export function destinationText(place: PlaceRecord, lang: Lang): string {
  return lang === "fr" && place.nameFr ? place.nameFr : place.identity.name;
}

export function washroomFilters(query: WashroomQuery): FinderFilter[] {
  const lang = query.lang;
  const profile = query.profile ?? null;
  const list: FinderFilter[] = [];
  if (profile?.adultChangeTable || query.changeTable) {
    list.push({
      id: "change-table",
      label: copy("profile.change-table", lang),
      explanation: finderCopy("finder.filter.change-table", lang),
      origin: profile?.adultChangeTable ? "profile" : "screen",
    });
  }
  if (profile && profile.widthMm !== null) {
    list.push({
      id: "width",
      label: finderFill("finder.filter.width.label", lang, { mm: profile.widthMm }),
      explanation: finderCopy("finder.filter.width", lang),
      origin: "profile",
    });
  }
  if (profile?.stepFreeRequired) {
    list.push({
      id: "step-free",
      label: copy("profile.step-free", lang),
      explanation: finderCopy("finder.filter.step-free.washroom", lang),
      origin: "profile",
    });
  }
  if (query.hoist) {
    list.push({ id: "hoist", label: finderCopy("finder.filter.hoist.label", lang), explanation: finderCopy("finder.filter.hoist", lang), origin: "screen" });
  }
  if (query.registerOnly) {
    list.push({ id: "register", label: finderCopy("demo.register", lang), explanation: finderCopy("finder.filter.register", lang), origin: "screen" });
  }
  if (query.transferSide !== "any") {
    list.push({
      id: "transfer",
      label: finderFill("finder.filter.transfer.label", lang, { side: labelOf(`side.${query.transferSide}`, lang) }),
      explanation: finderCopy("finder.filter.transfer", lang),
      origin: "screen",
    });
  }
  if (query.openAt) {
    list.push({ id: "open-at", label: finderCopy("finder.filter.open-at.label", lang), explanation: finderCopy("finder.filter.open-at", lang), origin: "screen" });
  }
  return list;
}

export function parkingFilters(query: ParkingQuery): FinderFilter[] {
  const lang = query.lang;
  const list: FinderFilter[] = [];
  if (query.profile?.stepFreeRequired) {
    list.push({
      id: "step-free",
      label: copy("profile.step-free", lang),
      explanation: finderCopy("finder.filter.step-free.parking", lang),
      origin: "profile",
    });
  }
  if (query.vanLift) {
    list.push({ id: "van-lift", label: finderCopy("demo.lift", lang), explanation: finderCopy("finder.filter.van-lift", lang), origin: "screen" });
  }
  return list;
}

/** True when the profile holds a setting that parking does not use. The finder says so. */
export function parkingProfileUnused(profile: EquipmentProfile | null | undefined): boolean {
  return Boolean(profile && (profile.widthMm !== null || profile.adultChangeTable));
}

function withoutProfileFilters(profile: EquipmentProfile | null | undefined): EquipmentProfile | null {
  if (!profile) return null;
  return { ...profile, widthMm: null, stepFreeRequired: false, adultChangeTable: false };
}

/** The same search with every filter off. The destination text and the saved profile are untouched. */
export function broadenWashroomQuery(query: WashroomQuery): WashroomQuery {
  return {
    ...query,
    transferSide: "any",
    changeTable: false,
    hoist: false,
    registerOnly: false,
    openAt: null,
    profile: withoutProfileFilters(query.profile),
  };
}

export function broadenParkingQuery(query: ParkingQuery): ParkingQuery {
  return { ...query, vanLift: false, profile: withoutProfileFilters(query.profile) };
}
