import { ADULT_CHANGE_KEYS, adultChangeVerdict, type AdultChangeVerdict } from "@access-tools/place/pack-aliases";
import type { FieldValue, PackManifest, PackRecord, PackSource, PackSourceEntry, Tranche } from "./pack-types.js";

export { ADULT_CHANGE_KEYS, adultChangeVerdict };
export type { AdultChangeVerdict };

export type FinderKind = "washroom" | "parking" | "changing" | "charging" | "repair";
export const FINDER_KINDS: readonly FinderKind[] = ["washroom", "parking", "changing", "charging", "repair"];
export const FINDER_KIND_KEYS: Record<FinderKind, "finder.pack.kind.washroom" | "finder.pack.kind.parking" | "finder.pack.kind.changing" | "finder.pack.kind.charging" | "finder.pack.kind.repair"> = {
  washroom: "finder.pack.kind.washroom",
  parking: "finder.pack.kind.parking",
  changing: "finder.pack.kind.changing",
  charging: "finder.pack.kind.charging",
  repair: "finder.pack.kind.repair",
};
export type FinderLang = "en" | "fr";
export interface FinderRequest {
  kind: FinderKind;
  text?: string;
  near?: { lat: number; lon: number; radiusM: number };
  needs?: string[];
  broaden?: boolean;
  signal?: AbortSignal;
}
export interface FinderFact {
  key: string;
  value: unknown | "UNKNOWN";
  unknown: boolean;
  source: string;
  licence: string;
  retrieved: string;
  tier: string;
  attribution: string;
}
export interface PackFinderRow {
  id: string;
  tranche: Tranche;
  name: string | "UNKNOWN";
  kind: FinderKind;
  fields: FinderFact[];
  knownYes: number;
  knownNo: number;
  unknownNeeds: number;
  excluded: boolean;
}
export interface PackFinderResult {
  rows: PackFinderRow[];
  /** Known-yes changing-table records only appear in `rows`. Unknown records, if shown, are only here. */
  unknownRows: PackFinderRow[];
  hidden: PackFinderRow[];
  count: number;
  examined: number;
  kind: FinderKind;
}

/** The fourteen recorded washroom facts, never inferred from a venue's accessibility. */
export const WASHROOM_KEYS = [
  "name", "wheelchair", "access", "door_width", "turning_diameter",
  "transfer_side", "grab_rails", "toilet_height", "sink_height", "step_free",
  "changing_table", "adult_changing_table", "hoist", "opening_hours",
] as const;
const PARKING_KEYS = ["name", "amenity", "parking", "capacity_disabled", "wheelchair", "access", "surface", "fee"];
const CHARGING_KEYS = ["name", "wheelchair_charging", "mobility_device_charging", "charging_point", "power_supply", "socket", "access", "opening_hours"];
const REPAIR_KEYS = ["name", "wheelchair_repair", "mobility_device_repair", "repair", "service", "shop", "access", "opening_hours"];
const TRUE = new Set(["yes", "true", "1", "designated"]);
const FALSE = new Set(["no", "false", "0"]);
const recognised = (value: unknown): boolean => value !== null && value !== undefined && value !== "UNKNOWN" && value !== "";
const scalar = (value: unknown): string => typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value).toLowerCase() : "";
const read = (record: PackRecord, key: string): unknown => record.fields[key]?.value;
const has = (record: PackRecord, key: string): boolean => recognised(read(record, key));
const isYes = (value: unknown): boolean => TRUE.has(scalar(value));
const isNo = (value: unknown): boolean => FALSE.has(scalar(value));


/** A kind requires source-backed evidence; merely being a venue is not enough. */
export function supportsKind(record: PackRecord, kind: FinderKind): boolean {
  if (kind === "washroom") return record.tranche === "washroom" || (record.tranche === "venue" && scalar(read(record, "amenity")) === "toilets");
  if (kind === "parking") return record.tranche === "venue" && (scalar(read(record, "amenity")) === "parking" || has(record, "capacity_disabled"));
  if (kind === "changing") {
    return (record.tranche === "washroom" || scalar(read(record, "amenity")) === "toilets") && adultChangeVerdict(record) !== null;
  }
  if (kind === "charging") return CHARGING_KEYS.slice(1, 6).some((key) => has(record, key));
  return REPAIR_KEYS.slice(1, 6).some((key) => has(record, key));
}

function allowed(record: PackRecord, manifest: PackManifest): boolean {
  const accepted = new Set(manifest.sources.filter((source) => source.inWebPack && !source.heldReason).map((source) => source.sourceId));
  const fields = Object.values(record.fields);
  return fields.length > 0 && fields.every((field) => accepted.has(field.source_id));
}
function provenance(key: string, field: FieldValue | undefined, sources: Map<string, PackSourceEntry>): FinderFact {
  const entry = field ? sources.get(field.source_id) : undefined;
  return {
    key, value: field && recognised(field.value) ? field.value : "UNKNOWN",
    unknown: !field || !recognised(field.value),
    source: entry?.name ?? "UNKNOWN",
    licence: field?.licence ?? entry?.licence ?? "UNKNOWN",
    retrieved: field?.retrieved_at ?? entry?.retrieved ?? "UNKNOWN",
    tier: field?.tier ?? "UNKNOWN",
    attribution: entry?.attribution ?? "UNKNOWN",
  };
}
function keysFor(kind: FinderKind): readonly string[] {
  if (kind === "washroom") return WASHROOM_KEYS;
  if (kind === "parking") return PARKING_KEYS;
  if (kind === "changing") return ["name", "changing_table", "adult_changing_table", "wheelchair", "access"];
  if (kind === "charging") return CHARGING_KEYS;
  return REPAIR_KEYS;
}
function rowFor(record: PackRecord, kind: FinderKind, needs: readonly string[], broaden: boolean, sources: Map<string, PackSourceEntry>): PackFinderRow {
  const fields = Array.from(new Set([...keysFor(kind), ...needs, ...Object.keys(record.fields)])).map((key) => provenance(key, record.fields[key], sources));
  let knownYes = 0;
  let knownNo = 0;
  let unknownNeeds = 0;
  for (const key of needs) {
    const value = read(record, key);
    if (!recognised(value)) unknownNeeds++;
    else if (isYes(value)) knownYes++;
    else if (isNo(value) || !isYes(value)) knownNo++;
  }
  return {
    id: record.id, tranche: record.tranche, kind,
    name: has(record, "name") ? String(read(record, "name")) : "UNKNOWN",
    fields, knownYes, knownNo, unknownNeeds,
    // Unknown is neither a positive match nor a reason to hide. Broaden relaxes known-no.
    excluded: !broaden && knownNo > 0,
  };
}

/** One query path for both the shell and React UI. No demonstration data or network submission. */
export async function queryPackFinders(source: PackSource, request: FinderRequest): Promise<PackFinderResult> {
  const manifest = await source.manifest();
  const sources = new Map(manifest.sources.filter((entry) => entry.inWebPack).map((entry) => [entry.sourceId, entry]));
  const tranches: Tranche[] = ["washroom", "venue", "transit"];
  const records = new Map<string, PackRecord>();
  if (request.text?.trim()) {
    const hits = await source.search(request.text.trim(), {
      tranches, limit: 500,
      ...(request.near ? { near: { lat: request.near.lat, lon: request.near.lon } } : {}),
    });
    for (const hit of hits) {
      request.signal?.throwIfAborted();
      const record = await source.get(hit.id);
      if (record && allowed(record, manifest)) records.set(record.id, record);
    }
  } else {
    const cells = request.near
      ? await source.cellsFor(request.near)
      : [...new Set(manifest.regions.flatMap((region) => region.cells))];
    for (const cell of cells) {
      for (const tranche of tranches) {
        for await (const record of source.records(tranche, cell, request.signal)) {
          request.signal?.throwIfAborted();
          if (allowed(record, manifest)) records.set(record.id, record);
        }
      }
    }
  }
  const rows = [...records.values()].filter((record) => supportsKind(record, request.kind))
    .map((record) => rowFor(record, request.kind, request.needs ?? [], request.broaden ?? false, sources));
  if (request.kind === "changing") {
    const yes: PackFinderRow[] = [];
    const unknown: PackFinderRow[] = [];
    for (const row of rows) {
      const record = records.get(row.id);
      if (!record) continue;
      const verdict = adultChangeVerdict(record);
      if (verdict === "yes") yes.push(row);
      else if (verdict === "unknown") unknown.push(row);
      // known-no is not listed, including in hidden or unknown groups
    }
    yes.sort((a, b) => a.name.localeCompare(b.name));
    unknown.sort((a, b) => a.name.localeCompare(b.name));
    return { rows: yes, unknownRows: unknown, hidden: [], count: yes.length, examined: records.size, kind: request.kind };
  }
  const shown = rows.filter((row) => !row.excluded).sort((a, b) => a.name.localeCompare(b.name));
  return { rows: shown, unknownRows: [], hidden: rows.filter((row) => row.excluded), count: shown.length, examined: records.size, kind: request.kind };
}
