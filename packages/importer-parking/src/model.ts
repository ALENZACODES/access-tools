import type { ParkingSource } from "./sources.js";

/** Local counterparts of place Sourced<T> and Provenance; UNKNOWN is null. */
export interface Provenance {
  sourceName: string;
  sourceId: string;
  sourceUrl: string;
  licence: string;
  sourceDate: string;
  recordDate: string;
  retrievedAt: string;
  tier: 0;
  prototypeLabel: "SEEDED-OPEN-DATA";
  verifierType: "open-data-import";
  note?: string;
}
export interface Sourced<T> {
  value: T | null;
  provenance: Provenance | null;
  photoSlotIds: string[];
}
export interface Geometry {
  type: "Point" | "LineString" | "Polygon";
  coordinates: unknown;
}
export interface ImportedRecord {
  id: string;
  sourceId: string;
  upstreamId: string;
  kind: "accessible-stall" | "parking-lot";
  name: { en: Sourced<string>; fr: Sourced<string> };
  geometry: Geometry | null;
  facts: {
    aodaType: Sourced<"type-a" | "type-b">;
    accessibleSpaces: Sourced<number>;
    cityAccessibleFlag: Sourced<"yes" | "no">;
  };
  raw: Record<string, unknown>;
}
export const unknown = <T>(): Sourced<T> => ({ value: null, provenance: null, photoSlotIds: [] });
export function sourced<T>(value: T | null, source: ParkingSource, day: string, note?: string): Sourced<T> {
  if (value === null) return unknown<T>();
  return { value, provenance: {
    sourceName: source.publisher, sourceId: source.id, sourceUrl: source.datasetUrl,
    licence: source.licence, sourceDate: source.sourceDate, recordDate: day,
    retrievedAt: day, tier: 0, prototypeLabel: "SEEDED-OPEN-DATA",
    verifierType: "open-data-import", ...(note ? { note } : {}),
  }, photoSlotIds: [] };
}

export type Row = Record<string, unknown>;
const only = (row: Row, columns: string[]): Row => Object.fromEntries(
  columns.filter((column) => Object.hasOwn(row, column)).map((column) => [column, row[column]]),
);
function label(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
export function positiveCount(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !/^\d+$/.test(value.trim())) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}
function yn(value: unknown, kind: "waterloo" | "ottawa"): "yes" | "no" | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (kind === "waterloo") return normalized === "y" ? "yes" : normalized === "n" ? "no" : null;
  return normalized === "yes" || normalized === "oui" ? "yes" : normalized === "no" || normalized === "non" ? "no" : null;
}
function validPoint(coordinates: unknown): boolean {
  return Array.isArray(coordinates) && coordinates.length >= 2 &&
    typeof coordinates[0] === "number" && typeof coordinates[1] === "number" &&
    Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1]) &&
    Math.abs(coordinates[0]) <= 180 && Math.abs(coordinates[1]) <= 90;
}
function validLine(line: unknown): boolean {
  return Array.isArray(line) && line.length >= 2 && line.every(validPoint);
}
export function geojson(value: unknown): Geometry | null {
  if (typeof value === "string") {
    try { return geojson(JSON.parse(value) as unknown); } catch { return null; }
  }
  if (!value || typeof value !== "object") return null;
  const object = value as Record<string, unknown>;
  if (object.type === "Point" && validPoint(object.coordinates)) return { type: "Point", coordinates: object.coordinates };
  if (object.type === "LineString" && validLine(object.coordinates)) return { type: "LineString", coordinates: object.coordinates };
  if (object.type === "Polygon" && Array.isArray(object.coordinates) && object.coordinates.length > 0 &&
      object.coordinates.every((ring) => Array.isArray(ring) && ring.length >= 4 && ring.every(validPoint))) {
    return { type: "Polygon", coordinates: object.coordinates };
  }
  return null;
}
export function esriGeometry(value: unknown): Geometry | null {
  if (!value || typeof value !== "object") return null;
  const geometry = value as Record<string, unknown>;
  if (typeof geometry.x === "number" && typeof geometry.y === "number") {
    return geojson({ type: "Point", coordinates: [geometry.x, geometry.y] });
  }
  if (Array.isArray(geometry.paths) && geometry.paths.length === 1) {
    return geojson({ type: "LineString", coordinates: geometry.paths[0] });
  }
  if (Array.isArray(geometry.rings)) {
    return geojson({ type: "Polygon", coordinates: geometry.rings });
  }
  return null;
}
export function mapRow(source: ParkingSource, row: Row, day: string, geometry: Geometry | null): ImportedRecord {
  const isToronto = source.id === "toronto-accessible-stalls";
  const idValue = row._id ?? row.OBJECTID ?? row.ObjectId ?? row.objectid ?? row.FID;
  if (typeof idValue !== "string" && typeof idValue !== "number") throw new Error("missing-id");
  const upstreamId = String(idValue);
  if (!upstreamId.trim()) throw new Error("missing-id");
  const type = row.AODA_TYPE === "A" ? "type-a" : row.AODA_TYPE === "B" ? "type-b" : null;
  const capacityField = source.id === "mississauga-parking-facilities" ? row.Accessible :
    source.id === "london-parking" ? row.CountDisabledSpaces :
    source.id === "ottawa-parks-parking" ? row.ACCESSIBLE_PARKING_CAPACITY : null;
  const cityFlag = source.id === "waterloo-parking-lots" ? yn(row.ACCESSIBLE, "waterloo") :
    source.id === "ottawa-parks-parking" ? yn(row.ACCESSIBLE, "ottawa") : null;
  const note = isToronto ? label(row.SOURCE) ?? undefined : undefined;
  const nameEn = label(row.NAME) ?? label(row.Name) ?? label(row.LOT_NAME) ?? label(row.PARK_NAME);
  const nameFr = label(row.NAME_FR) ?? label(row.NAME_F);
  const rawColumns = isToronto ? ["_id", "CP_ID_TEXT", "CP_ID_NUM", "AODA_TYPE", "SOURCE"] :
    source.id === "mississauga-parking-facilities" ? ["OBJECTID", "Name", "NAME", "Accessible"] :
    source.id === "london-parking" ? ["OBJECTID", "Name", "NAME", "CountDisabledSpaces"] :
    source.id === "waterloo-parking-lots" ? ["OBJECTID", "NAME", "Name", "ACCESSIBLE", "CAPACITY"] :
    ["OBJECTID", "NAME", "NAME_FR", "ACCESSIBLE_PARKING_CAPACITY", "ACCESSIBLE"];
  return {
    id: `${source.id}:${upstreamId}`, sourceId: source.id, upstreamId,
    kind: isToronto ? "accessible-stall" : "parking-lot",
    name: { en: sourced(nameEn, source, day, note), fr: sourced(nameFr, source, day, note) },
    geometry,
    facts: {
      aodaType: sourced(isToronto ? type : null, source, day, note),
      accessibleSpaces: sourced(isToronto || source.id === "waterloo-parking-lots" ? null : positiveCount(capacityField), source, day),
      cityAccessibleFlag: sourced(cityFlag, source, day),
    },
    raw: only(row, rawColumns),
  };
}
