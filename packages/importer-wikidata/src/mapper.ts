import type {
  Binding,
  Geometry,
  ImportedRecord,
  ImportProvenance,
  Sourced,
  SparqlResult,
  WheelchairAccessibilityStatement,
} from "./types";
import type { SourceDef } from "./sources";

/** P2846 value mapping. Any other value is UNKNOWN (unmapped-value). */
export const P2846_VALUES: Readonly<Record<string, WheelchairAccessibilityStatement>> = {
  Q24192067: "accessible",
  Q24192069: "partially-accessible",
  Q24192068: "inaccessible",
};

export interface ImportStats {
  /** Bindings (rows) read. */
  read: number;
  rejected: Record<string, number>;
  /** Reasons a value is UNKNOWN: unmapped-value, conflicting-statements, no-coordinates. */
  unknownReasons: Record<string, number>;
}

export function newStats(): ImportStats {
  return { read: 0, rejected: {}, unknownReasons: {} };
}

export interface MapContext {
  source: SourceDef;
  /** Query date, YYYY-MM-DD. Used as sourceDate, recordDate and retrievedAt. */
  retrievedAt: string;
}

const ENTITY_RE = /^https?:\/\/www\.wikidata\.org\/entity\/(Q[1-9]\d*)$/;
const NUM = "-?\\d+(?:\\.\\d+)?";
const POINT_RE = new RegExp(`^Point\\(\\s*(${NUM})\\s+(${NUM})\\s*\\)$`);

function bump(counter: Record<string, number>, key: string): void {
  counter[key] = (counter[key] ?? 0) + 1;
}

/** Yields the bindings of a parsed SPARQL JSON result one at a time. */
export async function* bindingsOf(result: SparqlResult): AsyncGenerator<Binding> {
  const list = result?.results?.bindings;
  if (!Array.isArray(list)) throw new Error("Not a SPARQL JSON result: results.bindings is missing");
  for (const b of list) yield b;
}

/** Parses `Point(lon lat)` WKT. Returns null when it is missing or malformed. */
export function parsePointWkt(wkt: string | null | undefined): Geometry | null {
  if (!wkt) return null;
  const m = POINT_RE.exec(wkt.trim());
  if (!m) return null;
  const lon = Number(m[1]);
  const lat = Number(m[2]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 90) return null;
  return { type: "Point", coordinates: [lon, lat] };
}

interface Row {
  qid: string;
  v: string;
  labelEn: string | null;
  labelFr: string | null;
  coord: string | null;
}

function label(term: Binding[string]): string | null {
  const s = term?.value?.trim();
  return s ? s : null;
}

function parseRow(b: Binding): Row | string {
  const m = ENTITY_RE.exec(b.item?.value ?? "");
  if (!m) return "missing-item";
  const v = b.v?.value;
  if (v === undefined || v.trim() === "") return "missing-statement";
  return {
    qid: m[1] as string,
    v,
    labelEn: label(b.itemLabel_en),
    labelFr: label(b.itemLabel_fr),
    coord: label(b.coord),
  };
}

function unknown<T>(): Sourced<T> {
  return { value: null, provenance: null, photoSlotIds: [] };
}

function known<T>(value: T, provenance: ImportProvenance): Sourced<T> {
  return { value, provenance, photoSlotIds: [] };
}

function valueKey(v: string): string {
  const m = ENTITY_RE.exec(v);
  return m ? (m[1] as string) : v;
}

function buildRecord(rows: Row[], ctx: MapContext, stats: ImportStats): ImportedRecord {
  const first = rows[0] as Row;
  const qid = first.qid;
  const prov: ImportProvenance = {
    sourceName: "Wikidata",
    sourceId: ctx.source.id,
    sourceUrl: `https://www.wikidata.org/wiki/${qid}`,
    licence: ctx.source.licenceName,
    sourceDate: ctx.retrievedAt,
    recordDate: ctx.retrievedAt,
    retrievedAt: ctx.retrievedAt,
    tier: 0,
    prototypeLabel: "SEEDED-OPEN-DATA",
    verifierType: "open-data-import",
  };

  const distinct = [...new Set(rows.map((r) => r.v))];
  const unknownReasons: Record<string, string> = {};
  let statement: Sourced<WheelchairAccessibilityStatement> = unknown();
  const mapped = distinct.map((v) => P2846_VALUES[valueKey(v)]);
  if (distinct.length > 1 && new Set(mapped).size > 1) {
    unknownReasons.wheelchairAccessibilityStatement = "conflicting-statements";
    bump(stats.unknownReasons, "conflicting-statements");
  } else if (mapped[0] === undefined) {
    unknownReasons.wheelchairAccessibilityStatement = "unmapped-value";
    bump(stats.unknownReasons, "unmapped-value");
  } else {
    statement = known(mapped[0], prov);
  }

  const labelEn = rows.find((r) => r.labelEn)?.labelEn ?? null;
  const labelFr = rows.find((r) => r.labelFr)?.labelFr ?? null;
  const coord = rows.find((r) => r.coord)?.coord ?? null;
  const geometry = parsePointWkt(coord);
  if (!geometry) bump(stats.unknownReasons, "no-coordinates");

  return {
    id: `${ctx.source.id}:${qid}`,
    sourceId: ctx.source.id,
    upstreamId: qid,
    kind: "wikidata-item",
    name: {
      en: labelEn === null ? unknown() : known(labelEn, prov),
      fr: labelFr === null ? unknown() : known(labelFr, prov),
    },
    geometry,
    facts: {
      wheelchairAccessibilityStatement: statement,
      // The statement is never mapped onto these. They stay UNKNOWN.
      stepFree: unknown(),
      entranceDescription: unknown(),
      washroomAccessible: unknown(),
      parkingAccessible: unknown(),
    },
    unknownReasons,
    raw: {
      item: `http://www.wikidata.org/entity/${qid}`,
      itemLabel_en: labelEn,
      itemLabel_fr: labelFr,
      v: distinct,
      coord,
    },
  };
}

/**
 * Streams bindings and yields one record per item. Bindings must arrive ordered by
 * item (the query does this), so only one item is held in memory at a time.
 * An item that reappears after its group has ended is rejected as `out-of-order-item`.
 */
export async function* mapBindings(
  bindings: AsyncIterable<Binding>,
  ctx: MapContext,
  stats: ImportStats,
): AsyncGenerator<ImportedRecord> {
  let group: Row[] = [];
  let lastQid: string | null = null;
  const closed = new Set<string>();

  for await (const b of bindings) {
    stats.read += 1;
    const row = parseRow(b);
    if (typeof row === "string") {
      bump(stats.rejected, row);
      continue;
    }
    if (row.qid !== lastQid) {
      if (group.length > 0) {
        closed.add(lastQid as string);
        yield buildRecord(group, ctx, stats);
        group = [];
      }
      if (closed.has(row.qid)) {
        bump(stats.rejected, "out-of-order-item");
        lastQid = null;
        continue;
      }
      lastQid = row.qid;
    }
    group.push(row);
  }
  if (group.length > 0) yield buildRecord(group, ctx, stats);
}
