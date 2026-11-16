import { booleanStatus, doorWidthMm } from "./fit.js";
import type { PackField, PackRecord, PackSourceEntry } from "./pack-types.js";

export type PackFactName = "name" | "address" | "stepFree" | "washroom" | "doorWidth" | "changeTable" | "parking";

export interface PackDetail {
  id: string;
  key: string;
  field: PackField | null;
  value: unknown | null;
  source: PackSourceEntry | null;
}

export interface PackPlaceProjection {
  id: string;
  tranche: PackRecord["tranche"];
  region: string;
  name: string | null;
  facts: Record<PackFactName, PackDetail>;
  otherDetails: PackDetail[];
  /** Every original field, with its original evidence, remains available for the full record table. */
  allDetails: PackDetail[];
}

const FIELD_ALIASES: Record<PackFactName, readonly string[]> = {
  name: ["name", "name:en", "official_name", "ref"],
  address: ["addr:full", "address", "addr:street"],
  stepFree: ["entrance:step_free", "step_free", "wheelchair:entrance", "wheelchair"],
  washroom: ["toilets:wheelchair", "wheelchair:toilet", "accessible_toilet", "washroom_accessible"],
  doorWidth: ["door_clear_width_mm", "door_width_mm", "door:width", "entrance:width"],
  changeTable: ["changing_table:adult", "adult_changing_table", "adult_change_table"],
  parking: ["parking:wheelchair", "disabled:parking", "accessible_parking", "parking:access"],
};

export function isKnown(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "UNKNOWN" && value !== "";
}

function sourceFor(field: PackField | null, sources: PackSourceEntry[]): PackSourceEntry | null {
  if (!field) return null;
  return sources.find((source) => source.sourceId === field.source_id) ?? null;
}

function detail(key: string, field: PackField | null, sources: PackSourceEntry[]): PackDetail {
  return {
    id: key,
    key,
    field,
    value: field && isKnown(field.value) ? field.value : null,
    source: sourceFor(field, sources),
  };
}


function explicitDoorWidthMm(record: PackRecord): number[] {
  return FIELD_ALIASES.doorWidth.flatMap((key) => {
    if (!(key in record.fields)) return [];
    const mm = doorWidthMm(key, record.fields[key]?.value);
    return mm === null ? [] : [mm];
  });
}

/**
 * True when two or more explicit-unit door-width aliases convert to different
 * millimetre values. A conflict cannot support a confident yes; the fit stays
 * Unknown and every original measurement remains in allDetails.
 */
export function explicitDoorWidthsDisagree(record: PackRecord): boolean {
  const values = explicitDoorWidthMm(record);
  return values.some((value) => value !== values[0]);
}

/**
 * Prefer a usable alias over first-key-wins when the first key would hide a
 * later, more specific fact. Door width prefers an explicit-unit key (for
 * example door_clear_width_mm) over a unitless door:width. Adult change-table
 * aliases prefer a known value over UNKNOWN. When known adult aliases disagree
 * (yes and no), the recorded no wins: the result is never a confident yes.
 */
export function resolveAliasKey(name: PackFactName, record: PackRecord): string | undefined {
  const present = FIELD_ALIASES[name].filter((candidate) => candidate in record.fields);
  if (present.length === 0) return undefined;
  const known = present.filter((candidate) => isKnown(record.fields[candidate]?.value));
  if (name === "changeTable") {
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
 * Maps web-pack facts into the place page projection, retaining every original
 * field not consumed by a known place slot. Never infers missing access facts.
 */
export function fromPackRecord(record: PackRecord, sources: PackSourceEntry[]): PackPlaceProjection {
  const used = new Set<string>();
  const facts = {} as Record<PackFactName, PackDetail>;
  (Object.keys(FIELD_ALIASES) as PackFactName[]).forEach((name) => {
    const key = resolveAliasKey(name, record);
    if (key) used.add(key);
    const projected = detail(key ?? name, key ? record.fields[key] ?? null : null, sources);
    // Disagreeing explicit-unit widths cannot be a single measured yes.
    facts[name] = name === "doorWidth" && explicitDoorWidthsDisagree(record)
      ? { ...projected, value: null }
      : projected;
  });
  const allDetails = Object.keys(record.fields)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => detail(key, record.fields[key] ?? null, sources));
  return {
    id: record.id,
    tranche: record.tranche,
    region: record.region,
    name: typeof facts.name.value === "string" ? facts.name.value : null,
    facts,
    otherDetails: allDetails.filter((item) => !used.has(item.key)),
    allDetails,
  };
}
