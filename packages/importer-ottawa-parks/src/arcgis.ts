import { API_URL } from "./sources.js";
import type { ArcPage, LayerMetadata } from "./types.js";

type Fetcher = typeof fetch;

async function requestJson<T extends { error?: { message: string } }>(
  url: URL, fetcher: Fetcher,
): Promise<T> {
  const response = await fetcher(url.toString(), { headers: { "User-Agent": "access-tools-ottawa-parks-importer/0.1 (+open-data)" } });
  if (!response.ok) throw new Error(`ArcGIS HTTP ${response.status} for ${url.pathname}`);
  const data = await response.json() as T;
  if (data.error) throw new Error(`ArcGIS: ${data.error.message}`);
  return data;
}

export async function layerMetadata(
  id: number, fetcher: Fetcher = fetch, baseUrl: string = API_URL,
): Promise<LayerMetadata> {
  const url = new URL(`${baseUrl}/${id}`);
  url.searchParams.set("f", "json");
  const metadata = await requestJson<LayerMetadata>(url, fetcher);
  if (!Array.isArray(metadata.fields)) throw new Error(`Layer ${id} has no fields`);
  return metadata;
}

export async function* featurePages(
  id: number, fetcher: Fetcher = fetch, baseUrl: string = API_URL,
  pageSize = 2000, objectIdField = "OBJECTID",
): AsyncGenerator<ArcPage> {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) throw new Error("Invalid page size");
  for (let offset = 0; ; offset += pageSize) {
    const url = new URL(`${baseUrl}/${id}/query`);
    for (const [key, value] of Object.entries({
      where: "1=1", outFields: "*", outSR: "4326", f: "json",
      resultOffset: String(offset), resultRecordCount: String(pageSize),
      orderByFields: objectIdField,
    })) url.searchParams.set(key, value);
    const page = await requestJson<ArcPage>(url, fetcher);
    if (!Array.isArray(page.features)) throw new Error(`Layer ${id} has no features array`);
    if (page.features.length === 0 && page.exceededTransferLimit) {
      throw new Error(`Layer ${id} returned an empty truncated page`);
    }
    yield page;
    if (!page.exceededTransferLimit && page.features.length < pageSize) break;
  }
}
