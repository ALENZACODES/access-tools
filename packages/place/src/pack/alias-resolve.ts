import { booleanStatus, doorWidthMm } from "./fit.js";

/**
 * Shared alias lists and the recorded-no conflict rule for pack records.
 * Used by the place page and the pack finders so both agree.
 *
 * Do not reuse packages/sci-fields/src/aliases.ts here: that map treats
 * `change_table` as `adult_change_table`. A generic changing table is not
 * an adult table, and a first-key walk of that map would over-claim.
 */

export type PackFactName = "name" | "address" | "stepFree" | "washroom" | "doorWidth" | "changeTable" | "parking";

export type AdultChangeVerdict = "yes" | "no" | "unknown";

/** Minimal record shape shared by the place and finders pack contracts. */
export interface AliasFields {
  fields: Record<string, { value: unknown } | undefined>;
}

export const PACK_FIELD_ALIASES: Record<PackFactName, readonly string[]> = {
  name: ["name", "name:en", "official_name", "ref"],
  address: ["addr:full", "address", "addr:street"],
  stepFree: ["entrance:step_free", "step_free", "wheelchair:entrance", "wheelchair"],
  washroom: ["toilets:wheelchair", "wheelchair:toilet", "accessible_toilet", "washroom_accessible"],
  doorWidth: ["door_clear_width_mm", "door_width_mm", "door:width", "entrance:width"],
  changeTable: ["changing_table:adult", "adult_changing_table", "adult_change_table"],
  parking: ["parking:wheelchair", "disabled:parking", "accessible_parking", "parking:access"],
};

/** Adult-specific keys only. A generic changing_table / change_table tag is not an adult table. */
export const ADULT_CHANGE_KEYS = PACK_FIELD_ALIASES.changeTable;
export const DOOR_WIDTH_KEYS = PACK_FIELD_ALIASES.doorWidth;
const GENERIC_CHANGE_KEYS = ["changing_table", "change_table"] as const;
const BOOLEAN_FACTS = new Set<PackFactName>(["stepFree", "washroom", "changeTable", "parking"]);

export function isKnown(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "UNKNOWN" && value !== "";
}

function read(record: AliasFields, key: string): unknown {
  return record.fields[key]?.value;
}

function explicitDoorWidthMm(record: AliasFields): number[] {
  return DOOR_WIDTH_KEYS.flatMap((key) => {
    if (!(key in record.fields)) return [];
    const mm = doorWidthMm(key, record.fields[key]?.value);
    return mm === null ? [] : [mm];
  });
}

/**
 * True when two or more explicit-unit door-width aliases convert to different
 * millimetre values. A conflict cannot support a confident yes; the fit stays
 * Unknown and every original measurement remains on the record.
 */
export function explicitDoorWidthsDisagree(record: AliasFields): boolean {
  const values = explicitDoorWidthMm(record);
  return values.some((value) => value !== values[0]);
}

/**
 * Prefer a usable alias over first-key-wins when the first key would hide a
 * later, more specific fact. Door width prefers an explicit-unit key (for
 * example door_clear_width_mm) over a unitless door:width. Boolean needs
 * (step-free, washroom, adult change table, parking) prefer a known value
 * over UNKNOWN. When known aliases disagree (yes and no), the recorded no
 * wins: the result is never a confident yes.
 */
export function resolveAliasKey(name: PackFactName, record: AliasFields): string | undefined {
  const present = PACK_FIELD_ALIASES[name].filter((candidate) => candidate in record.fields);
  if (present.length === 0) return undefined;
  const known = present.filter((candidate) => isKnown(record.fields[candidate]?.value));
  if (BOOLEAN_FACTS.has(name)) {
    const nos = known.filter((candidate) => booleanStatus(record.fields[candidate]?.value) === "known-no");
    const yeses = known.filter((candidate) => booleanStatus(record.fields[candidate]?.value) === "known-yes");
    if (nos.length > 0 && yeses.length > 0) return nos[0];
    if (known.length > 0) return known[0];
    return present[0];
  }
  if (name === "doorWidth") {
    const explicit = known.filter((candidate) => doorWidthMm(candidate, record.fields[candidate]?.value) !== null);
    if (explicit.length > 0) return explicit[0];
    if (known.length > 0) return known[0];
  }
  return present[0];
}

/**
 * Adult change-table honesty: only an adult-specific yes is a known yes.
 * A generic changing_table tag alone is unknown. A recorded no wins over a
 * conflicting yes, and is not listed as a known yes. Returns null when the
 * record has no changing-table evidence at all.
 */
export function adultChangeVerdict(record: AliasFields): AdultChangeVerdict | null {
  const adultPresent = ADULT_CHANGE_KEYS.some((key) => key in record.fields);
  const adultStatuses = ADULT_CHANGE_KEYS.map((key) => booleanStatus(read(record, key)));
  const adultYes = adultStatuses.some((status) => status === "known-yes");
  const adultNo = adultStatuses.some((status) => status === "known-no");
  if (adultYes && adultNo) return "no";
  if (adultYes) return "yes";
  if (adultNo) return "no";
  const genericValues = GENERIC_CHANGE_KEYS.map((key) => read(record, key));
  const genericPresent = GENERIC_CHANGE_KEYS.some((key) => key in record.fields);
  if (adultPresent) return "unknown";
  if (genericValues.some((value) => booleanStatus(value) === "known-no")) return "no";
  if (genericValues.some((value) => booleanStatus(value) === "known-yes") || genericPresent) return "unknown";
  return null;
}
