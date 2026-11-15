// @ts-ignore Node strip-types uses TypeScript source paths
import type { Source } from "./sources.ts";
export type JsonFetch = (url: string) => Promise<unknown>;
export interface Feature { attributes: Record<string, unknown>; geometry: unknown; id?: unknown }
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
export async function* parseJsonLines(lines: AsyncIterable<string>): AsyncGenerator<unknown> {
  for await (const line of lines) if (line.trim()) yield JSON.parse(line) as unknown;
}
export async function* arcgisPages(source: Source, fetchJson: JsonFetch, pageSize = 1000): AsyncGenerator<Feature> {
  let offset = 0;
  for (;;) {
    const url = new URL(source.apiUrl);
    for (const [key, value] of Object.entries({ where: "1=1", outFields: "*", outSR: "4326", f: "json", resultOffset: String(offset), resultRecordCount: String(pageSize) })) url.searchParams.set(key, value);
    const page = object(await fetchJson(url.toString()));
    if (page.error) throw new Error(`ArcGIS error: ${JSON.stringify(page.error)}`);
    const features = page.features;
    if (!Array.isArray(features)) throw new Error("ArcGIS response missing features");
    for (const feature of features) {
      const item = object(feature);
      yield { attributes: object(item.attributes), geometry: item.geometry };
    }
    offset += features.length;
    if (features.length === 0 || (page.exceededTransferLimit !== true && features.length < pageSize)) return;
  }
}
export async function* ckanPages(source: Source, fetchJson: JsonFetch, pageSize = 1000): AsyncGenerator<Feature> {
  if (!source.resourceId) throw new Error(`CKAN resource ID required for ${source.id}; supply a verified identifier`);
  let offset = 0;
  for (;;) {
    const url = new URL(source.apiUrl);
    url.searchParams.set("resource_id", source.resourceId);
    url.searchParams.set("limit", String(pageSize));
    url.searchParams.set("offset", String(offset));
    const page = object(await fetchJson(url.toString()));
    if (page.success === false) throw new Error(`CKAN error: ${JSON.stringify(page.error)}`);
    const result = object(page.result);
    if (!Array.isArray(result.records)) throw new Error("CKAN response missing records");
    for (const entry of result.records) {
      const row = object(entry);
      let geometry: unknown = null;
      if (typeof row.geometry === "string" && row.geometry.trim()) geometry = JSON.parse(row.geometry) as unknown;
      yield { attributes: row, geometry };
    }
    offset += result.records.length;
    if (!result.records.length || (typeof result.total === "number" && offset >= result.total) || result.records.length < pageSize) return;
  }
}
export function toGeometry(geometry: unknown): { type: "Point" | "LineString" | "Polygon"; coordinates: unknown } | null {
  const g = object(geometry);
  let type: "Point" | "LineString" | "Polygon";
  let coordinates: unknown;
  if (g.type === "Point" || g.type === "LineString" || g.type === "Polygon") {
    type = g.type; coordinates = g.coordinates;
  } else if (Array.isArray(g.paths)) {
    const paths = g.paths as unknown[];
    if (paths.length !== 1) throw new Error("multi-path polyline cannot be represented as one LineString");
    type = "LineString"; coordinates = paths[0];
  } else if (Array.isArray(g.rings)) {
    type = "Polygon"; coordinates = g.rings;
  } else if (typeof g.x === "number" && typeof g.y === "number") {
    type = "Point"; coordinates = [g.x, g.y];
  } else if (!Object.keys(g).length) return null;
  else throw new Error("unsupported geometry");
  if (!Array.isArray(coordinates)) throw new Error("invalid geometry coordinates");
  const validate = (value: unknown): void => {
    if (!Array.isArray(value)) throw new Error("invalid coordinate array");
    if (value.length >= 2 && value.every((v) => typeof v === "number")) {
      const [x, y] = value as number[];
      if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x ?? 999) > 180 || Math.abs(y ?? 999) > 90) throw new Error("coordinate outside EPSG:4326");
      return;
    }
    for (const child of value) validate(child);
  };
  validate(coordinates);
  return { type, coordinates };
}
