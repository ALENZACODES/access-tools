import type { Source } from "./sources.js";
import { FACT_KEYS } from "./types.js";
import type { FactKey, FactValue, ImportedRecord, Provenance, Sourced, SegmentKind } from "./types.js";
import type { Feature } from "./readers.js";
import { toGeometry } from "./readers.js";
const ALLOWED: Record<string, readonly string[]> = {
  "brampton-sidewalks": ["OBJECTID", "ID", "DESCR"],
  "toronto-pedestrian-network": ["OBJECTID", "ROAD_TYPE", "SIDEWALK_CODE", "SIDEWALK_DESCRIPTION", "CROSSWALK", "CROSSWALK_TYPE", "PX", "PX_TYPE"],
  "toronto-topo-sidewalks": ["OBJECTID", "SUBTYPE_DESC"],
  "ottawa-pedestrian-network": ["OBJECTID", "WALK_TYPE", "TYPE_EN", "TYPE_FR"],
  "london-sidewalks": ["OBJECTID", "Width", "Material"],
  "london-walkways": ["OBJECTID"],
  "kitchener-sidewalks": ["OBJECTID", "WIDTH_M", "GRADE", "CURBCUT", "RAILING", "SURFACE_MATERIAL", "SURFACE_CONDITION", "CONDITION_DATE", "STATUS_DATE"],
  "waterloo-sidewalks": ["OBJECTID", "SURFACE", "PATH_TYPE", "CLEARED_BY"],
};
const clean = (value: unknown): string | null => typeof value === "string" && value.trim() && !["UNKNOWN", "NONE", "N/A", "-1"].includes(value.trim().toUpperCase()) ? value : null;
const yesNo = (value: unknown): "yes" | "no" | null => value === "Y" ? "yes" : value === "N" ? "no" : null;
const provenance = (source: Source, date: string): Provenance => ({ sourceName: source.publisher, sourceId: source.id, sourceUrl: source.datasetUrl, licence: source.licence, sourceDate: date, recordDate: date, retrievedAt: date, tier: 0, prototypeLabel: "SEEDED-OPEN-DATA", verifierType: "open-data-import" });
const sourced = <T>(value: T | null, p: Provenance): Sourced<T> => ({ value, provenance: value === null ? null : p, photoSlotIds: [] });
export function mapFeature(source: Source, feature: Feature, date: string): ImportedRecord {
  const a = feature.attributes;
  const upstream = a.OBJECTID ?? a.objectid ?? a._id ?? feature.id;
  if ((typeof upstream !== "string" && typeof upstream !== "number") || String(upstream).trim() === "") throw new Error("missing-id");
  const facts = Object.fromEntries(FACT_KEYS.map((key) => [key, sourced<FactValue>(null, provenance(source, date))])) as Record<FactKey, Sourced<FactValue>>;
  const p = provenance(source, date);
  const set = (key: FactKey, value: string | number | null): void => { facts[key] = sourced(value, p); };
  let kind: SegmentKind = source.id === "london-walkways" ? "walkway" : source.id === "toronto-topo-sidewalks" ? "sidewalk-area" : "sidewalk";
  let nameEn: string | null = null;
  let nameFr: string | null = null;
  if (source.id === "kitchener-sidewalks") {
    if (typeof a.WIDTH_M === "number" && Number.isFinite(a.WIDTH_M) && a.WIDTH_M > 0 && a.WIDTH_M <= 10) set("widthM", a.WIDTH_M);
    set("curbCut", yesNo(a.CURBCUT)); set("railing", yesNo(a.RAILING));
    if (a.GRADE === "FLAT") set("grade", "flat");
    set("surfaceMaterial", clean(a.SURFACE_MATERIAL));
    const condition = clean(a.SURFACE_CONDITION);
    set("surfaceCondition", condition);
    if (condition) set("conditionDate", clean(a.CONDITION_DATE));
  }
  if (source.id === "london-sidewalks") {
    set("widthBand", clean(a.Width)); set("surfaceMaterial", clean(a.Material));
  }
  if (source.id === "waterloo-sidewalks") {
    set("surfaceMaterial", clean(a.SURFACE)); set("pathType", clean(a.PATH_TYPE)); set("clearedBy", clean(a.CLEARED_BY));
    const path = clean(a.PATH_TYPE)?.toUpperCase();
    if (path === "WALKWAY") kind = "walkway";
    if (path === "MULTI-USE PATH" || path === "MUP") kind = "multi-use-path";
  }
  if (source.id === "ottawa-pedestrian-network") {
    const type = clean(a.WALK_TYPE)?.toUpperCase();
    if (type === "MUP") kind = "multi-use-path";
    if (type === "PATH") kind = "walkway";
    set("typeEn", clean(a.TYPE_EN)); set("typeFr", clean(a.TYPE_FR));
    nameEn = clean(a.TYPE_EN); nameFr = clean(a.TYPE_FR);
  }
  if (source.id === "toronto-pedestrian-network") {
    const code = typeof a.SIDEWALK_CODE === "number" && a.SIDEWALK_CODE > 0 ? a.SIDEWALK_CODE : null;
    set("sidewalkCode", code); set("sidewalkDescription", clean(a.SIDEWALK_DESCRIPTION));
    if (code !== null && clean(a.SIDEWALK_DESCRIPTION)) set("sidewalkPresence", `${code}: ${a.SIDEWALK_DESCRIPTION as string}`);
    if (a.CROSSWALK === 1 || clean(a.CROSSWALK_TYPE) || clean(a.PX)) kind = "crosswalk";
  }
  const raw: Record<string, unknown> = {};
  for (const column of ALLOWED[source.id] ?? []) if (Object.hasOwn(a, column)) raw[column] = a[column];
  return {
    id: `${source.id}:${String(upstream)}`, sourceId: source.id, upstreamId: String(upstream), kind,
    name: { en: sourced(nameEn, p), fr: sourced(nameFr, p) }, geometry: toGeometry(feature.geometry), facts, raw,
  };
}
