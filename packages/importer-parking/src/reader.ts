import { esriGeometry, geojson, mapRow } from "./model.js";
import type { ImportedRecord, Row } from "./model.js";
import type { ParkingSource } from "./sources.js";

export type PageFetch = (url: string) => Promise<unknown>;
export interface ImportEvent {
  record?: ImportedRecord;
  rejection?: { reason: "missing-id" | "invalid-row" | "invalid-page" };
}
/** Stream JSON lines without buffering prior rows. */
export async function* jsonLines(lines: AsyncIterable<string>): AsyncGenerator<Row> {
  for await (const line of lines) {
    if (!line.trim()) continue;
    const parsed: unknown = JSON.parse(line);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid-row");
    yield parsed as Row;
  }
}
/** One page is retained at a time. Never accumulate all pages. */
export async function* apiPages(source: ParkingSource, fetchPage: PageFetch, size = 200): AsyncGenerator<unknown> {
  if (!Number.isSafeInteger(size) || size < 1) throw new Error("invalid page size");
  let offset = 0;
  for (;;) {
    const url = new URL(source.apiUrl + (source.kind === "arcgis" ? "/query" : ""));
    if (source.kind === "ckan") {
      url.searchParams.set("offset", String(offset));
      url.searchParams.set("limit", String(size));
    } else {
      url.searchParams.set("where", "1=1");
      url.searchParams.set("outFields", "*");
      url.searchParams.set("returnGeometry", "true");
      url.searchParams.set("outSR", "4326");
      url.searchParams.set("f", "json");
      url.searchParams.set("resultOffset", String(offset));
      url.searchParams.set("resultRecordCount", String(size));
    }
    const page = await fetchPage(url.toString());
    if (!page || typeof page !== "object") throw new Error("invalid-page");
    const root = page as Record<string, unknown>;
    if (root.error || root.success === false) throw new Error(`API error: ${JSON.stringify(root.error ?? root)}`);
    const content = source.kind === "ckan" ? root.result as Record<string, unknown> | undefined : root;
    const features = source.kind === "ckan" ? content?.records : content?.features;
    if (!Array.isArray(features)) throw new Error("invalid-page");
    if (!features.length) return;
    yield page;
    offset += features.length;
    const total = source.kind === "ckan" ? content?.total : undefined;
    if (typeof total === "number" && offset >= total) return;
    if (source.kind === "arcgis" && root.exceededTransferLimit === false) return;
    if (features.length < size && root.exceededTransferLimit !== true) return;
  }
}
/** Pages are injected in tests; rejected records retain reason codes. */
export async function* parsePages(source: ParkingSource, pages: AsyncIterable<unknown>, day: string): AsyncGenerator<ImportEvent> {
  for await (const page of pages) {
    if (!page || typeof page !== "object") throw new Error("invalid-page");
    const root = page as Record<string, unknown>;
    const result = source.kind === "ckan" ? root.result as Record<string, unknown> | undefined : root;
    const rows = source.kind === "ckan" ? result?.records : result?.features;
    if (!Array.isArray(rows)) throw new Error("invalid-page");
    for (const entry of rows) {
      if (!entry || typeof entry !== "object") { yield { rejection: { reason: "invalid-row" } }; continue; }
      const feature = entry as Record<string, unknown>;
      const attributes = source.kind === "arcgis" ? feature.attributes : feature;
      if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
        yield { rejection: { reason: "invalid-row" } }; continue;
      }
      const row = attributes as Row;
      try {
        yield { record: mapRow(source, row, day, source.kind === "ckan" ? geojson(row.geometry) : esriGeometry(feature.geometry)) };
      } catch { yield { rejection: { reason: "missing-id" } }; }
    }
  }
}
