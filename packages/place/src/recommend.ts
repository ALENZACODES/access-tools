import { evidenceComplete } from "./evidence.js";
import { copy, phrase } from "./i18n.js";
import type { ChargingPoint, DatasetStatus, Lang, ParkingBay, PlaceRecord, Provenance, Washroom } from "./types.js";

/**
 * A filled fixture is still not a recommendation.
 * "measured" is reserved for an access-maps record whose critical fields are peer or surveyor tier.
 * The UI must not shorten that to "usable".
 */
export type UseLabel = "not-a-recommendation" | "peer-or-surveyor-measurements";

function strong(provenance: Provenance | null, dataset: DatasetStatus): boolean {
  if (dataset !== "access-maps" || !provenance) return false;
  if (provenance.tier === 2) return true;
  if (provenance.tier === 3) return evidenceComplete(provenance.evidence);
  return false;
}

export function washroomUseLabel(dataset: DatasetStatus, washroom: Washroom): UseLabel {
  const door = washroom.doorClearWidthMm;
  const turning = washroom.turningDiameterMm;
  const transfer = washroom.transfer;
  const criticalKnown = door.value !== null && turning.value !== null && transfer.value !== null;
  const allStrong =
    strong(door.provenance, dataset) && strong(turning.provenance, dataset) && strong(transfer.provenance, dataset);
  return criticalKnown && allStrong ? "peer-or-surveyor-measurements" : "not-a-recommendation";
}

export function useLabelText(label: UseLabel, lang: Lang): string {
  if (label === "peer-or-surveyor-measurements") return copy("use.measured", lang);
  return copy("use.call-ahead", lang);
}

export function chargingUseLabel(dataset: DatasetStatus, point: ChargingPoint): UseLabel {
  const known = point.accessMethod.value !== null && point.locationNote.value !== null;
  const allStrong = strong(point.accessMethod.provenance, dataset) && strong(point.locationNote.provenance, dataset);
  return known && allStrong ? "peer-or-surveyor-measurements" : "not-a-recommendation";
}

export type VanLiftReading = "aisle-recorded" | "no-deployment-space" | "unknown" | "drop-off";

export function vanLiftReading(bay: ParkingBay): VanLiftReading {
  if (bay.kind === "drop-off") return "drop-off";
  if (bay.kind === "unverified") return "unknown";
  if (bay.kind === "type-b-standard") return "no-deployment-space";
  if (bay.widthMm.value === null || bay.aisleWidthMm.value === null) return "unknown";
  return "aisle-recorded";
}

export function vanLiftText(reading: VanLiftReading, lang: Lang): string {
  switch (reading) {
    case "aisle-recorded":
      return copy("lift.aisle", lang);
    case "no-deployment-space":
      return copy("lift.type-b", lang);
    case "drop-off":
      return copy("lift.drop-off", lang);
    case "unknown":
      return copy("lift.unknown", lang);
    default:
      return copy("value.unknown", lang);
  }
}

export function privilegeText(bay: ParkingBay, lang: Lang): string {
  const privilege = bay.privilege;
  const complete = Boolean(
    privilege.municipality && privilege.bylaw && privilege.statement && privilege.checkedOn,
  );
  if (!complete) return copy("privilege.unknown", lang);
  const page = privilege.page ? `, ${privilege.page}` : "";
  return phrase("privilege.quote", lang, {
    municipality: privilege.municipality ?? "",
    bylaw: privilege.bylaw ?? "",
    page,
    date: privilege.checkedOn ?? "",
    statement: privilege.statement ?? "",
  });
}

/**
 * The user's own tested range, compared with a straight-line distance.
 * Never a generic chair range, and never a statement that a route is within range.
 */
export function rangeNote(distanceMetres: number | null, userTestedRangeMetres: number | null, lang: Lang): string | null {
  if (userTestedRangeMetres === null) return null;
  const distance = distanceMetres === null ? copy("range.unknown", lang) : String(distanceMetres);
  return phrase("range.note", lang, { range: userTestedRangeMetres, distance });
}

export function transferSideMatches(side: "left" | "right" | "both" | null, needed: "left" | "right" | "both"): boolean {
  if (side === null) return false;
  if (needed === "both") return side === "both";
  return side === needed || side === "both";
}

export function placeHasAdultChangeTable(place: PlaceRecord): boolean {
  return place.washrooms.some((washroom) => washroom.changeTable.value?.present === "yes");
}

export function placeHasHoist(place: PlaceRecord): boolean {
  return place.washrooms.some((washroom) => washroom.hoist.value?.present === "yes");
}

export function placeHasVanBay(place: PlaceRecord): boolean {
  return place.parking.bays.some((bay) => vanLiftReading(bay) === "aisle-recorded");
}

export function placeHasStepFreeEntrance(place: PlaceRecord): boolean {
  return place.entrance.stepFree.value === "yes";
}

export const AVAILABILITY_DISCLAIMER = {
  en: copy("disclaimer.availability", "en"),
  fr: copy("disclaimer.availability", "fr"),
} as const;

export const REPAIR_DISCLAIMER = {
  en: copy("disclaimer.repair", "en"),
  fr: copy("disclaimer.repair", "fr"),
} as const;

export const SUPPLY_STOCK_NOTE = {
  en: copy("disclaimer.supply", "en"),
  fr: copy("disclaimer.supply", "fr"),
} as const;

export const PROTOTYPE_NOTICE = {
  en: copy("notice.prototype", "en"),
  fr: copy("notice.prototype", "fr"),
} as const;
