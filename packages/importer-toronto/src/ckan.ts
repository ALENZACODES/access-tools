import type { Source } from "./sources.js";

export type CkanRow = Record<string, unknown>;
export interface CkanPage {
  records: CkanRow[];
  total: number;
  limit: number;
  offset: number;
}
export interface Resource { id: string; name: string; sourceDate: string }
export type JsonFetch = (url: string) => Promise<unknown>;

function result(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || !("result" in value)) throw new Error("Invalid CKAN response");
  const item = (value as { result: unknown }).result;
  if (typeof item !== "object" || item === null || Array.isArray(item)) throw new Error("Invalid CKAN result");
  return item as Record<string, unknown>;
}

export async function findResources(source: Source, fetchJson: JsonFetch): Promise<Resource[]> {
  const url = `${source.apiUrl}/package_show?id=${encodeURIComponent(source.packageId)}`;
  const data = result(await fetchJson(url));
  const resources = data.resources;
  if (!Array.isArray(resources)) throw new Error("CKAN resources missing");
  return source.resources.map((name) => {
    const item = resources.find((candidate: unknown) =>
      typeof candidate === "object" && candidate !== null && (candidate as Record<string, unknown>).name === name &&
      (candidate as Record<string, unknown>).datastore_active === true) as Record<string, unknown> | undefined;
    if (!item || typeof item.id !== "string") throw new Error(`Datastore resource missing: ${name}`);
    const date = item.last_refreshed;
    const sourceDate = typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : "";
    if (!sourceDate) throw new Error(`Missing last_refreshed: ${name}`);
    return { id: item.id, name, sourceDate };
  });
}

export async function* datastorePages(apiUrl: string, resourceId: string, fetchJson: JsonFetch, limit = 1000): AsyncGenerator<CkanPage> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new Error("Invalid CKAN page limit");
  let offset = 0;
  while (true) {
    const url = `${apiUrl}/datastore_search?resource_id=${encodeURIComponent(resourceId)}&limit=${limit}&offset=${offset}`;
    const data = result(await fetchJson(url));
    if (!Array.isArray(data.records) || typeof data.total !== "number" || !Number.isInteger(data.total) || data.total < 0) throw new Error("Invalid CKAN page");
    if (data.records.length === 0 && offset < data.total) throw new Error("CKAN returned empty incomplete page");
    const page: CkanPage = { records: data.records as CkanRow[], total: data.total, limit, offset };
    yield page;
    offset += data.records.length;
    if (offset >= data.total) break;
  }
}
