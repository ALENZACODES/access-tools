import { copy } from "./i18n.js";
import { placeHasAdultChangeTable } from "./recommend.js";
import type { Lang, PlaceRecord, Washroom, YesNo } from "./types.js";

export const EQUIPMENT_PROFILE_VERSION = "equipment-profile-1.0.0" as const;
export const EQUIPMENT_PROFILE_KEY = "access-tools.equipment-profile";

export const CHAIR_TYPES = ["manual", "power", "scooter", "other"] as const;
export type ChairType = (typeof CHAIR_TYPES)[number];

/** Equipment and access preferences. Every field is optional. No health or timing fields. */
export interface EquipmentProfile {
  schemaVersion: typeof EQUIPMENT_PROFILE_VERSION;
  chairType: ChairType | null;
  /** Millimetres of clear width the chair needs. Null means the width is not used. */
  widthMm: number | null;
  stepFreeRequired: boolean;
  adultChangeTable: boolean;
}

export type ProfileSaveResult = { ok: true; profile: EquipmentProfile } | { ok: false; error: "width" | "storage" };

export type DoorWidthJudgement = "unused" | "clears" | "narrower" | "missing";

const MAX_WIDTH_MM = 3000;

export function parseWidthMm(text: string): number | null | "invalid" {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  if (!/^[1-9]\d{0,3}$/.test(trimmed)) return "invalid";
  const value = Number(trimmed);
  if (value > MAX_WIDTH_MM) return "invalid";
  return value;
}

function isChairType(value: unknown): value is ChairType {
  return typeof value === "string" && (CHAIR_TYPES as readonly string[]).includes(value);
}

/** Returns a profile built only from the allowed fields. A stored name and any other extra key are ignored. */
export function parseProfile(value: unknown): EquipmentProfile | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== EQUIPMENT_PROFILE_VERSION) return null;
  const chairType = record.chairType === null ? null : isChairType(record.chairType) ? record.chairType : undefined;
  if (chairType === undefined) return null;
  const widthMm =
    record.widthMm === null
      ? null
      : typeof record.widthMm === "number" && Number.isInteger(record.widthMm) && record.widthMm > 0 && record.widthMm <= MAX_WIDTH_MM
        ? record.widthMm
        : undefined;
  if (widthMm === undefined) return null;
  if (typeof record.stepFreeRequired !== "boolean" || typeof record.adultChangeTable !== "boolean") return null;
  return {
    schemaVersion: EQUIPMENT_PROFILE_VERSION,
    chairType,
    widthMm,
    stepFreeRequired: record.stepFreeRequired,
    adultChangeTable: record.adultChangeTable,
  };
}

export function readProfile(storage: Storage): EquipmentProfile | null {
  try {
    const raw = storage.getItem(EQUIPMENT_PROFILE_KEY);
    if (!raw) return null;
    return parseProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveProfile(
  storage: Storage,
  input: {
    chairType: ChairType | null;
    widthMm: number | null;
    stepFreeRequired: boolean;
    adultChangeTable: boolean;
  },
): ProfileSaveResult {
  if (input.widthMm !== null && (!Number.isInteger(input.widthMm) || input.widthMm < 1 || input.widthMm > MAX_WIDTH_MM)) {
    return { ok: false, error: "width" };
  }
  const profile: EquipmentProfile = {
    schemaVersion: EQUIPMENT_PROFILE_VERSION,
    chairType: input.chairType,
    widthMm: input.widthMm,
    stepFreeRequired: input.stepFreeRequired,
    adultChangeTable: input.adultChangeTable,
  };
  try {
    storage.setItem(EQUIPMENT_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    return { ok: false, error: "storage" };
  }
  return { ok: true, profile };
}

/** Removes the stored profile. A later read is null. */
export function deleteProfile(storage: Storage): void {
  storage.removeItem(EQUIPMENT_PROFILE_KEY);
}

export function doorClears(recordedMm: number | null, neededMm: number): boolean {
  return judgeDoorWidth(recordedMm, neededMm) === "clears";
}

/** A missing measurement is not a match and is not treated as narrower. */
export function judgeDoorWidth(recordedMm: number | null, neededMm: number | null): DoorWidthJudgement {
  if (neededMm === null) return "unused";
  if (typeof recordedMm !== "number" || !Number.isFinite(recordedMm)) return "missing";
  return recordedMm >= neededMm ? "clears" : "narrower";
}

function doorSentences(recordedMm: number | null, neededMm: number | null, lang: Lang): { reason: string | null; note: string | null } {
  const judgement = judgeDoorWidth(recordedMm, neededMm);
  if (judgement === "narrower") return { reason: copy("profile.reason.narrower", lang), note: null };
  if (judgement === "missing") return { reason: null, note: copy("profile.reason.missing", lang) };
  return { reason: null, note: null };
}

export function profilePlaceReasons(place: PlaceRecord, profile: EquipmentProfile | null, lang: Lang): string[] {
  if (!profile) return [];
  const reasons: string[] = [];
  if (profile.stepFreeRequired && place.entrance.stepFree.value !== "yes") reasons.push(copy("profile.reason.step-free", lang));
  if (profile.adultChangeTable && !placeHasAdultChangeTable(place)) reasons.push(copy("profile.reason.change-table", lang));
  const door = doorSentences(place.entrance.doorClearWidthMm.value, profile.widthMm, lang).reason;
  if (door) reasons.push(door);
  return reasons;
}

/** Shown on a record that stays visible because the door width was not measured. */
export function profilePlaceNotes(place: PlaceRecord, profile: EquipmentProfile | null, lang: Lang): string[] {
  if (!profile) return [];
  const note = doorSentences(place.entrance.doorClearWidthMm.value, profile.widthMm, lang).note;
  return note ? [note] : [];
}

export function profileWashroomReasons(place: PlaceRecord, washroom: Washroom, profile: EquipmentProfile | null, lang: Lang): string[] {
  if (!profile) return [];
  const reasons: string[] = [];
  if (profile.stepFreeRequired && place.entrance.stepFree.value !== "yes") reasons.push(copy("profile.reason.step-free", lang));
  if (profile.adultChangeTable && washroom.changeTable.value?.present !== "yes") reasons.push(copy("profile.reason.change-table", lang));
  const door = doorSentences(washroom.doorClearWidthMm.value, profile.widthMm, lang).reason;
  if (door) reasons.push(door);
  return reasons;
}

export function profileWashroomNotes(washroom: Washroom, profile: EquipmentProfile | null, lang: Lang): string[] {
  if (!profile) return [];
  const note = doorSentences(washroom.doorClearWidthMm.value, profile.widthMm, lang).note;
  return note ? [note] : [];
}

export function profileStepFreeReason(recorded: YesNo | null, profile: EquipmentProfile | null, lang: Lang): string | null {
  if (!profile?.stepFreeRequired || recorded === "yes") return null;
  return copy("profile.reason.step-free", lang);
}

export function appendProfileNote(valueText: string, fails: boolean, lang: Lang): string {
  if (!fails) return valueText;
  return `${valueText} ${copy("profile.highlight", lang)}`;
}
