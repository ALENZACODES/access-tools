import type { CkanPage, CkanRow } from "./ckan.js";
import type { Source } from "./sources.js";
import { FACT_KEYS, type Geometry, type ImportedRecord, type Provenance, type Sourced } from "./types.js";

const SIGNAL = ["PX", "MAIN_STREET", "MIDBLOCK_ROUTE", "SIDE1_STREET", "SIDE2_STREET", "APS_OPERATION", "PEDWALKSPEED", "ACTIVATIONDATE", "AUDIBLEPEDSIGNAL"];
const CROSSOVER = ["PX", "MAIN_STREET", "MIDBLOCK_ROUTE", "SIDE1_STREET", "SIDE2_STREET"];
const POPS = ["Location", "Short Address", "Description", "Status", "Ward", "Ward and Number"];
const PARK = ["NAME", "Name", "LOCATION", "Location", "ADDRESS", "Address", "AMENITIES", "TYPE", "Type", "WARD", "Ward"];

function point(value: unknown): value is [number, number] {
  return Array.isArray(value) && value.length === 2 && value.every((item) => typeof item === "number" && Number.isFinite(item)) &&
    value[0] >= -180 && value[0] <= 180 && value[1] >= -90 && value[1] <= 90;
}
function geometry(raw: unknown): Geometry | null {
  try {
    const value: unknown = typeof raw === "string" ? JSON.parse(raw) : null;
    if (!value || typeof value !== "object") return null;
    const geo = value as { type?: unknown; coordinates?: unknown };
    if (geo.type === "Point" && point(geo.coordinates)) return { type: "Point", coordinates: geo.coordinates };
    if (geo.type === "LineString" && Array.isArray(geo.coordinates) && geo.coordinates.length >= 2 && geo.coordinates.every(point))
      return { type: "LineString", coordinates: geo.coordinates };
    if (geo.type === "Polygon" && Array.isArray(geo.coordinates) && geo.coordinates.length > 0 && geo.coordinates.every((ring: unknown) =>
      Array.isArray(ring) && ring.length >= 4 && ring.every(point) && JSON.stringify(ring[0]) === JSON.stringify(ring[ring.length - 1])))
      return { type: "Polygon", coordinates: geo.coordinates };
  } catch { /* malformed GeoJSON is UNKNOWN */ }
  return null;
}
const unknown = <T>(): Sourced<T> => ({ value: null, provenance: null, photoSlotIds: [] });
function stated(value: string, provenance: Provenance): Sourced<string> {
  return { value, provenance, photoSlotIds: [] };
}
function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() && value.trim().toLowerCase() !== "none" ? value : null;
}
function nameOf(row: CkanRow, kind: Source["kind"]): string | null {
  if (kind === "traffic-signal" || kind === "pedestrian-crossover") {
    const street = stringValue(row.MAIN_STREET);
    const side = stringValue(row.SIDE1_STREET);
    return street ? [street, side].filter(Boolean).join(" / ") : null;
  }
  if (kind === "pops") return stringValue(row.Location) ?? stringValue(row["Short Address"]);
  return stringValue(row.NAME) ?? stringValue(row.Name) ?? stringValue(row.LOCATION) ?? stringValue(row.Location);
}

export function mapRow(row: CkanRow, source: Source, sourceDate: string, retrievedAt: string): ImportedRecord | null {
  const candidate = (source.kind === "traffic-signal" || source.kind === "pedestrian-crossover") ? row.PX : row._id;
  const upstreamId = (typeof candidate === "string" && candidate.trim() ? candidate.trim() : String(row._id ?? "")).trim();
  if (!upstreamId) return null;
  const provenance: Provenance = {
    sourceName: source.name.en, sourceId: source.id, sourceUrl: source.datasetUrl, licence: source.licence,
    sourceDate, recordDate: retrievedAt, retrievedAt, tier: 0,
    prototypeLabel: "SEEDED-OPEN-DATA", verifierType: "open-data-import",
  };
  const keys = source.kind === "traffic-signal" ? SIGNAL : source.kind === "pedestrian-crossover" ? CROSSOVER : source.kind === "pops" ? POPS : PARK;
  const raw: Record<string, unknown> = {};
  for (const key of keys) if (Object.prototype.hasOwnProperty.call(row, key)) raw[key] = row[key];
  const facts = Object.fromEntries(FACT_KEYS.map((key) => [key, unknown<string>()])) as ImportedRecord["facts"];
  if (source.kind === "traffic-signal" && row.AUDIBLEPEDSIGNAL === 1) facts.accessiblePedestrianSignal = stated("present", provenance);
  const parsed = geometry(row.geometry);
  const label = nameOf(row, source.kind);
  const fr = stringValue(row.NAME_FR) ?? stringValue(row.Name_Fr);
  return {
    id: `${source.id}:${upstreamId}`, sourceId: source.id, upstreamId, kind: source.kind,
    name: { en: label ? stated(label, provenance) : unknown(), fr: fr ? stated(fr, provenance) : unknown() },
    geometry: parsed, facts, raw, reasons: parsed ? [] : ["bad-geometry"],
  };
}

export async function* mapPages(pages: AsyncIterable<CkanPage>, source: Source, sourceDate: string, retrievedAt: string): AsyncGenerator<ImportedRecord> {
  for await (const page of pages) for (const row of page.records) {
    const mapped = mapRow(row, source, sourceDate, retrievedAt);
    if (mapped) yield mapped;
  }
}
