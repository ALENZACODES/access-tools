import {
  DOOR_WIDTH_KEYS,
  explicitDoorWidthsDisagree,
  isKnown,
  resolveAliasKey,
  type PackFactName,
} from "./alias-resolve.js";
import type { PackField, PackRecord, PackSourceEntry } from "./pack-types.js";

export type { PackFactName } from "./alias-resolve.js";
export { explicitDoorWidthsDisagree, isKnown, resolveAliasKey } from "./alias-resolve.js";

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
  const factNames: PackFactName[] = ["name", "address", "stepFree", "washroom", "doorWidth", "changeTable", "parking"];
  for (const name of factNames) {
    const key = resolveAliasKey(name, record);
    const projected = detail(key ?? name, key ? record.fields[key] ?? null : null, sources);
    if (name === "doorWidth" && explicitDoorWidthsDisagree(record)) {
      // Keep both original measurements visible; do not display a nulled yes.
      for (const alias of DOOR_WIDTH_KEYS) {
        if (alias in record.fields) used.add(alias);
      }
      facts[name] = { id: "doorWidth", key: "doorWidth", field: null, value: null, source: null };
    } else {
      if (key) used.add(key);
      facts[name] = projected;
    }
  }
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
