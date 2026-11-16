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
  doorWidth: ["door:width", "entrance:width", "door_clear_width_mm", "door_width_mm"],
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

/**
 * Maps web-pack facts into the place page projection, retaining every original
 * field not consumed by a known place slot. Never infers missing access facts.
 */
export function fromPackRecord(record: PackRecord, sources: PackSourceEntry[]): PackPlaceProjection {
  const used = new Set<string>();
  const facts = {} as Record<PackFactName, PackDetail>;
  (Object.keys(FIELD_ALIASES) as PackFactName[]).forEach((name) => {
    const key = FIELD_ALIASES[name].find((candidate) => candidate in record.fields);
    if (key) used.add(key);
    facts[name] = detail(key ?? name, key ? record.fields[key] ?? null : null, sources);
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
