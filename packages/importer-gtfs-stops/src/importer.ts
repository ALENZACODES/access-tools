import { csvRows } from "./csv.js";
import { COPY } from "./catalog.js";
import type { Boarding, ImportedRecord, ImportReport, LicenceRecord, Provenance, Source, Sourced } from "./types.js";

const RAW_COLUMNS = ["stop_id", "stop_name", "stop_name_fr", "stop_lat", "stop_lon", "location_type", "parent_station", "wheelchair_boarding"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
export function licenceHeld(source: Source, record?: LicenceRecord): boolean {
  if (source.licenceStatus === "open" || source.licenceStatus === "open-recorded") return false;
  if (!record || !DATE.test(record.checkedOn) || !Number.isFinite(Date.parse(record.checkedOn)) ||
      !/^https?:\/\//.test(record.urlRead) || record.result === "restricted") return true;
  return false;
}
export function blankReport(source: Source, date: string, held: boolean): ImportReport {
  return {
    sourceId: source.id, read: 0, emitted: 0, rejected: {}, byLocationType: {},
    wheelchairBoarding: { known: 0, derived: 0, unknown: 0 },
    unknownFieldCount: { wheelchairBoarding: 0, parentStation: 0 },
    shareKnown: 0, heldByLicence: held, retrievedAt: date, partitions: [], coverageClaim: false,
    summary: { en: `${held ? COPY.held.en : COPY.open.en} ${COPY.coverage.en}`,
      fr: `${held ? COPY.held.fr : COPY.open.fr} ${COPY.coverage.fr}` },
  };
}
function sourced<T>(value: T | null, provenance: Provenance): Sourced<T> {
  return { value, provenance: value === null ? null : provenance, photoSlotIds: [] };
}
function mapped(code: string, kind: string): Boarding | null {
  if (code === "1") return kind === "entrance" ? "accessible-path" : "some-accessible-boarding";
  if (code === "2") return kind === "entrance" ? "no-accessible-path" : "no-accessible-boarding";
  return null;
}
function coordinates(row: Record<string, string>): ImportedRecord["geometry"] {
  const lat = row.stop_lat?.trim() ?? "";
  const lon = row.stop_lon?.trim() ?? "";
  if (!lat || !lon) return null;
  const a = Number(lat), b = Number(lon);
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180
    ? { type: "Point", coordinates: [b, a] } : null;
}
export interface ImportOptions {
  sourceDate?: string;
  runDate: string;
  licenceRecord?: LicenceRecord;
  report: ImportReport;
}
/** The yielded stream has one object per valid location. Only unresolved children are buffered. */
export async function* importStops(lines: AsyncIterable<string>, source: Source, options: ImportOptions): AsyncGenerator<ImportedRecord> {
  const report = options.report;
  const sourceDate = options.sourceDate ?? options.runDate;
  if (!DATE.test(sourceDate) || !DATE.test(options.runDate)) throw new Error("Dates must use YYYY-MM-DD");
  const provenance: Provenance = {
    sourceName: source.publisher, sourceId: source.id, sourceUrl: source.datasetUrl,
    licence: source.licence, sourceDate, recordDate: options.runDate, retrievedAt: options.runDate,
    tier: 0, prototypeLabel: "SEEDED-OPEN-DATA", verifierType: "open-data-import",
  };
  const parentValues = new Map<string, Boarding | null>();
  const waiting = new Map<string, ImportedRecord[]>();
  const seen = new Set<string>();
  function complete(record: ImportedRecord): ImportedRecord {
    report.emitted++;
    const board = record.facts.wheelchairBoarding;
    if (board.value === null) {
      report.wheelchairBoarding.unknown++;
      report.unknownFieldCount.wheelchairBoarding = (report.unknownFieldCount.wheelchairBoarding ?? 0) + 1;
    } else if (board.derived) report.wheelchairBoarding.derived++;
    else report.wheelchairBoarding.known++;
    if (record.facts.parentStation.value === null) {
      report.unknownFieldCount.parentStation = (report.unknownFieldCount.parentStation ?? 0) + 1;
    }
    if (!record.geometry) report.rejected["bad-coordinates"] = (report.rejected["bad-coordinates"] ?? 0) + 1;
    report.shareKnown = (report.wheelchairBoarding.known + report.wheelchairBoarding.derived) / report.emitted;
    return record;
  }
  function inherit(child: ImportedRecord, parentId: string, value: Boarding | null): void {
    if (child.facts.wheelchairBoarding.value !== null || value === null) return;
    child.facts.wheelchairBoarding = {
      ...sourced(value, provenance), derived: true, derivedFrom: parentId,
    };
  }
  for await (const row of csvRows(lines)) {
    report.read++;
    const type = row.location_type || "0";
    report.byLocationType[type] = (report.byLocationType[type] ?? 0) + 1;
    if (type === "3" || type === "4") { report.rejected[`location-type-${type}`] = (report.rejected[`location-type-${type}`] ?? 0) + 1; continue; }
    if (!["0", "1", "2"].includes(type)) { report.rejected["invalid-location-type"] = (report.rejected["invalid-location-type"] ?? 0) + 1; continue; }
    const id = row.stop_id ?? "";
    if (!id || seen.has(id)) { report.rejected["missing-or-duplicate-id"] = (report.rejected["missing-or-duplicate-id"] ?? 0) + 1; continue; }
    seen.add(id);
    const kind = type === "1" ? "station" : type === "2" ? "entrance" : "stop";
    const parentId = row.parent_station || null;
    const raw = Object.fromEntries(RAW_COLUMNS.filter((key) => Object.hasOwn(row, key)).map((key) => [key, row[key] ?? ""]));
    const record: ImportedRecord = {
      id: `${source.id}:${id}`, sourceId: source.id, upstreamId: id, kind,
      name: { ...sourced(row.stop_name || null, provenance),
        ...(row.stop_name_fr ? { fr: sourced(row.stop_name_fr, provenance) } : {}) },
      geometry: coordinates(row),
      facts: { wheelchairBoarding: sourced(mapped(row.wheelchair_boarding ?? "", kind), provenance),
        parentStation: sourced(parentId, provenance) }, raw,
    };
    // A parent may follow a child. Only children awaiting an explicit parent's status are delayed.
    if (kind === "stop" && parentId && record.facts.wheelchairBoarding.value === null && !parentValues.has(parentId)) {
      const pending = waiting.get(parentId) ?? [];
      pending.push(record);
      waiting.set(parentId, pending);
    } else {
      if (kind === "stop" && parentId) inherit(record, parentId, parentValues.get(parentId) ?? null);
      yield complete(record);
    }
    if (kind === "station") {
      parentValues.set(id, record.facts.wheelchairBoarding.value);
      for (const child of waiting.get(id) ?? []) {
        inherit(child, id, record.facts.wheelchairBoarding.value);
        yield complete(child);
      }
      waiting.delete(id);
    }
  }
  // Orphan parent references remain unknown; never infer a feed-wide value.
  for (const children of waiting.values()) for (const child of children) yield complete(child);
}
