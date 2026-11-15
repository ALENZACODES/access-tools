import { layerNames, source } from "./sources.js";
import type { ArcFeature, ArcPage, Geometry, ImportedRecord, LayerMetadata, Position, Provenance, Sourced } from "./types.js";

export function accessible(value: unknown): "yes" | "no" | null {
  if (typeof value !== "string") return null;
  switch (value.trim().toLowerCase()) {
    case "yes/oui": case "y": return "yes";
    case "no/non": case "n": return "no";
    default: return null;
  }
}

function positions(value: unknown): Position[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const result: Position[] = [];
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length < 2 ||
      !entry.every((n) => typeof n === "number" && Number.isFinite(n))) return null;
    result.push(entry as number[]);
  }
  return result;
}

export function esriGeometry(input: Record<string, unknown> | null | undefined): {
  geometry: Geometry | null;
  reason: "missing-geometry" | "invalid-geometry" | null;
} {
  if (!input) return { geometry: null, reason: "missing-geometry" };
  if (typeof input.x === "number" && Number.isFinite(input.x) &&
    typeof input.y === "number" && Number.isFinite(input.y)) {
    return { geometry: { type: "Point", coordinates: [input.x, input.y] }, reason: null };
  }
  if (Array.isArray(input.paths)) {
    const paths = input.paths.map(positions);
    if (!paths.length || paths.some((p) => !p || p.length < 2)) return { geometry: null, reason: "invalid-geometry" };
    const valid = paths as Position[][];
    return { geometry: valid.length === 1
      ? { type: "LineString", coordinates: valid[0]! }
      : { type: "MultiLineString", coordinates: valid }, reason: null };
  }
  if (Array.isArray(input.rings)) {
    const rings = input.rings.map(positions);
    if (!rings.length || rings.some((r) => !r || r.length < 4)) return { geometry: null, reason: "invalid-geometry" };
    // ArcGIS ring order is preserved; no inferred winding or holes beyond first outer.
    return { geometry: { type: "Polygon", coordinates: rings as Position[][] }, reason: null };
  }
  return { geometry: null, reason: "invalid-geometry" };
}

function day(epoch: unknown): string | null {
  if (typeof epoch !== "number" || !Number.isFinite(epoch)) return null;
  const date = new Date(epoch);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function sourced<T>(value: T | null, provenance: Provenance): Sourced<T> {
  return { value, provenance: value === null ? null : provenance, photoSlotIds: [] };
}

const safeFields = new Set([
  "OBJECTID", "GLOBALID", "NAME", "NAME_FR", "NAME_EN", "NOM", "NOM_FR",
  "ACCESSIBLE", "PR_Park_Buildings_Info.ACCESSIBLE", "MODIFIED_DATE",
]);
const personalField = /(?:phone|email|contact|person|owner|staff|address|notes|description)/i;

function sourceName(attributes: Record<string, unknown>, candidates: string[]): string | null {
  for (const field of candidates) {
    const value = attributes[field];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

export function mapFeature(
  feature: ArcFeature, layerId: number, layerLabel: string, metadata: LayerMetadata,
  retrievedAt: string, runDate = retrievedAt,
): ImportedRecord | null {
  const a = feature.attributes;
  const objectId = metadata.objectIdField ?? metadata.objectIdFieldName ?? "OBJECTID";
  const upstream = a[objectId];
  if (typeof upstream !== "number" && typeof upstream !== "string") return null;
  if (String(upstream).trim() === "") return null;
  const upstreamId = `${layerId}:${upstream}`;
  const accessibleField = layerId === 5 ? "PR_Park_Buildings_Info.ACCESSIBLE" : "ACCESSIBLE";
  const flag = accessible(a[accessibleField]);
  const modified = day(a.MODIFIED_DATE);
  const edited = day(metadata.editingInfo?.lastEditDate);
  const provenance: Provenance = {
    sourceName: source.name.en, sourceId: source.id,
    sourceUrl: `${source.apiUrl}/${layerId}`, licence: source.licence,
    sourceDate: modified ?? edited ?? runDate,
    recordDate: runDate, retrievedAt, tier: 0,
    prototypeLabel: "SEEDED-OPEN-DATA", verifierType: "open-data-import",
  };
  const name = layerNames(layerLabel);
  const english = sourceName(a, ["NAME", "NAME_EN"]) ?? name.en;
  const french = sourceName(a, ["NAME_FR", "NOM_FR"]) ?? null;
  const geometry = esriGeometry(feature.geometry);
  const unknown = sourced<"yes" | "no">(null, provenance);
  const raw: Record<string, unknown> = {};
  for (const field of metadata.fields) {
    if (safeFields.has(field.name) && !personalField.test(field.name) &&
      Object.prototype.hasOwnProperty.call(a, field.name)) raw[field.name] = a[field.name];
  }
  // Include the dynamic object-id only when it has been explicitly declared in metadata.
  if (metadata.fields.some((f) => f.name === objectId) && !personalField.test(objectId)) raw[objectId] = upstream;
  return {
    id: `${source.id}:${upstreamId}`, sourceId: source.id, upstreamId, kind: name.en,
    name: { en: sourced(english, provenance), fr: sourced(french, provenance) },
    geometry: geometry.geometry, geometryReason: geometry.reason,
    facts: { cityAccessibleFlag: sourced<"yes" | "no">(flag, provenance), stepFree: unknown,
      washroom: unknown, entrance: unknown },
    unknownReasons: { ...(flag === null ? { cityAccessibleFlag: "unmapped-value" } : {}),
      stepFree: "not-stated", washroom: "not-stated", entrance: "not-stated" },
    notes: modified || edited ? [] : ["source-date-fallback-to-run-date"], raw,
  };
}

export async function* mapPages(
  pages: AsyncIterable<ArcPage>, layerId: number, name: string,
  metadata: LayerMetadata, retrievedAt: string,
  onRow?: (accepted: boolean, record?: ImportedRecord) => void,
): AsyncGenerator<ImportedRecord> {
  for await (const page of pages) {
    for (const feature of page.features) {
      const record = mapFeature(feature, layerId, name, metadata, retrievedAt);
      onRow?.(record !== null, record ?? undefined);
      if (record) yield record;
    }
  }
}
