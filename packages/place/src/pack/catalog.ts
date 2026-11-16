import { copy, fill, type CopyKey } from "../i18n.js";
import type { Lang } from "../types.js";
import type { FitNeed, FitStatus } from "./fit.js";

export function packCopy(key: CopyKey, lang: Lang): string {
  return copy(key, lang);
}

export function fitLabel(need: FitNeed, lang: Lang): string {
  const key: Record<FitNeed, CopyKey> = {
    stepFree: "pack.step-free",
    washroom: "pack.washroom-need",
    doorWidth: "pack.door-width",
    changeTable: "pack.change-table",
    parking: "pack.parking",
  };
  return copy(key[need], lang);
}

export function fitStatusLabel(status: FitStatus, lang: Lang): string {
  return copy(status === "known-yes" ? "pack.yes" : status === "known-no" ? "pack.no" : "pack.unknown", lang);
}

export function recordedLine(id: string, lang: Lang): string {
  return fill(copy("pack.recorded", lang), { id });
}

export function photoCreditLine(author: string, lang: Lang): string {
  return fill(copy("pack.photo-credit", lang), { author });
}

export function fitItemLine(need: FitNeed, status: FitStatus, lang: Lang): string {
  return fill(copy("pack.fit-item", lang), { need: fitLabel(need, lang), status: fitStatusLabel(status, lang) });
}

export function sourceIdIsOsm(sourceId: string): boolean {
  return sourceId.startsWith("osm");
}

const FIELD_LABELS: Record<string, CopyKey> = {
  name: "pack.field-key.name",
  address: "pack.field-key.address",
  "addr:full": "pack.field-key.addr-full",
  "addr:street": "pack.field-key.addr-street",
  official_name: "pack.field-key.official-name",
  "name:en": "pack.field-key.name",
  ref: "pack.field-key.ref",
  "entrance:step_free": "pack.field-key.entrance-step-free",
  step_free: "pack.field-key.step-free",
  wheelchair: "pack.field-key.wheelchair",
  "wheelchair:entrance": "pack.field-key.wheelchair-entrance",
  "toilets:wheelchair": "pack.field-key.toilets-wheelchair",
  "wheelchair:toilet": "pack.field-key.wheelchair-toilet",
  accessible_toilet: "pack.field-key.accessible-toilet",
  washroom_accessible: "pack.field-key.washroom-accessible",
  "door:width": "pack.field-key.door-width",
  doorWidth: "pack.field-key.door-width",
  "entrance:width": "pack.field-key.entrance-width",
  door_clear_width_mm: "pack.field-key.door-clear-width-mm",
  door_width_mm: "pack.field-key.door-width-mm",
  "changing_table:adult": "pack.field-key.changing-table-adult",
  adult_changing_table: "pack.field-key.adult-changing-table",
  adult_change_table: "pack.field-key.adult-change-table",
  changing_table: "pack.field-key.changing-table",
  "parking:wheelchair": "pack.field-key.parking-wheelchair",
  "disabled:parking": "pack.field-key.disabled-parking",
  accessible_parking: "pack.field-key.accessible-parking",
  "parking:access": "pack.field-key.parking-access",
  "survey:note": "pack.field-key.survey-note",
  wikimedia_commons: "pack.field-key.wikimedia-commons",
  image: "pack.field-key.image",
  changeTable: "pack.field-key.change-table",
};

export function packFieldLabel(key: string, lang: Lang): string {
  const catalogKey = FIELD_LABELS[key];
  if (catalogKey) return copy(catalogKey, lang);
  const english = key.replaceAll("_", " ").replaceAll(":", " ");
  return `${english} (${copy("pack.english-only-note", lang)})`;
}
