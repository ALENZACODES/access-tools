/** Stateless, conservative normalisation of synthetic or open-licence place facts. */
export const OPEN_LICENCES = ["ODbL", "OGL-Ontario", "OGL-Canada", "CC-BY", "CC0"] as const;
export type OpenLicence = (typeof OPEN_LICENCES)[number];
export type Silo = "odbl" | "open";
export type Tier = 0 | 1 | 2 | 3;
export type Unknown = "UNKNOWN";
export type FactValue = string | number | boolean | Unknown;

/** Uses the App's existing per-field shape; no unsupported evidence is fabricated. */
export interface PackField {
  value: FactValue;
  source_id: string;
  licence: OpenLicence | Unknown;
  retrieved_at: string | Unknown;
  tier: Tier;
  source_key?: string;
  raw?: unknown;
  derived?: boolean;
}

export type PackRecord = Record<string, PackField>;
export interface IncomingField {
  value?: unknown;
  source_id?: string;
  licence?: string;
  retrieved_at?: string;
  tier?: number;
  source_key?: string;
  raw?: unknown;
  derived?: boolean;
}
export interface NormaliseInput {
  /** A caller-provided, stable source record identifier, never an inferred identity. */
  id?: string;
  fields: Record<string, unknown | IncomingField>;
}
export interface NormaliseOptions {
  source_id?: string;
  licence?: string;
  retrieved_at?: string;
  tier?: number;
  /** Source metadata can be supplied separately, without replacing per-field metadata. */
  field_meta?: Record<string, Partial<IncomingField>>;
}
export interface NormaliseResult {
  record: PackRecord;
  silo: Silo;
  warnings: string[];
  /** Identifies the source record, not a verified match between places. */
  sameAsCandidate?: string;
}

const ALIASES: Readonly<Record<string, string>> = {
  name: "name", title: "name", display_name: "name",
  street_address: "address", addr_full: "address", address: "address",
  lat: "latitude", latitude: "latitude", lon: "longitude", lng: "longitude",
  longitude: "longitude", wheelchair: "wheelchair", wheelchair_access: "wheelchair",
  entrance_step_free: "step_free_entrance", step_free_entrance: "step_free_entrance",
  accessible_toilet: "accessible_toilet", toilet_wheelchair: "accessible_toilet",
};

function fieldName(key: string): string {
  const snake = key.trim().toLowerCase().replace(/[\s.-]+/g, "_");
  return ALIASES[snake] ?? snake;
}

export function registerLicence(licence: unknown): OpenLicence | Unknown {
  return typeof licence === "string" &&
    (OPEN_LICENCES as readonly string[]).includes(licence)
    ? licence as OpenLicence : "UNKNOWN";
}

function isField(value: unknown): value is IncomingField {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    ("value" in value || "licence" in value || "source_id" in value || "tier" in value);
}

function safeValue(value: unknown): FactValue {
  if (value === null || value === undefined || value === "" || value === "UNKNOWN") return "UNKNOWN";
  if (typeof value === "string" || typeof value === "number" && Number.isFinite(value) ||
      typeof value === "boolean") return value;
  return "UNKNOWN";
}

function safeDate(value: unknown): string | Unknown {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) ||
      !Number.isFinite(Date.parse(value))) return "UNKNOWN";
  return value;
}

function safeTier(value: unknown): 0 | 1 {
  // This lane cannot verify protocols or confer evidence-backed tier 2/3.
  return value === 1 ? 1 : 0;
}

function numericCoordinate(value: FactValue, latitude: boolean): number | undefined {
  if (value === "UNKNOWN" || typeof value === "boolean") return undefined;
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && Math.abs(n) <= (latitude ? 90 : 180) ? n : undefined;
}

/**
 * A mixed-source record yields ONLY its ODbL fields; open fields must be
 * separately normalised and kept outside this output. Never silently blend.
 */
export function normalise(input: NormaliseInput, opts: NormaliseOptions = {}): NormaliseResult {
  const warnings: string[] = [];
  const prepared: PackRecord = {};
  const fields = input.fields ?? {};
  for (const [key, incoming] of Object.entries(fields)) {
    const name = fieldName(key);
    if (!name || name === "__proto__" || name === "constructor" || name === "prototype") {
      warnings.push(`Ignored unsafe field name: ${key}`);
      continue;
    }
    if (Object.hasOwn(prepared, name)) {
      warnings.push(`Collision on ${name}: preserved first field, did not overwrite`);
      continue;
    }
    const original = isField(incoming) ? incoming : { value: incoming };
    const meta = opts.field_meta?.[key] ?? {};
    const licence = registerLicence(original.licence ?? meta.licence ?? opts.licence);
    const source_id = original.source_id ?? meta.source_id ?? opts.source_id ?? "UNKNOWN";
    const retrieved_at = safeDate(original.retrieved_at ?? meta.retrieved_at ?? opts.retrieved_at);
    const requestedTier = original.tier ?? meta.tier ?? opts.tier;
    let value = safeValue(original.value);
    if (licence === "UNKNOWN") {
      warnings.push(`${name}: licence missing or outside allowed open set; value held UNKNOWN`);
      value = "UNKNOWN";
    }
    if (source_id === "UNKNOWN" || retrieved_at === "UNKNOWN") {
      warnings.push(`${name}: missing source or retrieved date; value held UNKNOWN`);
      value = "UNKNOWN";
    }
    if (requestedTier === 2 || requestedTier === 3) {
      warnings.push(`${name}: evidence tier ${requestedTier} not awarded by normaliser; set to 0`);
    }
    prepared[name] = {
      value, source_id, licence, retrieved_at, tier: safeTier(requestedTier),
      source_key: original.source_key ?? meta.source_key ?? key,
      ...(original.raw !== undefined ? { raw: original.raw } : {}),
      ...(original.derived !== undefined ? { derived: original.derived } : {}),
    };
  }

  // Coordinates are a pair. Do not present an orphan or invalid component as a point.
  const lat = prepared.latitude;
  const lon = prepared.longitude;
  if (lat || lon) {
    const a = lat && numericCoordinate(lat.value, true);
    const b = lon && numericCoordinate(lon.value, false);
    if (a === undefined || b === undefined) {
      if (lat) lat.value = "UNKNOWN";
      if (lon) lon.value = "UNKNOWN";
      warnings.push("Coordinates incomplete or invalid; no point inferred from address");
    } else if (lat && lon && (lat.source_id !== lon.source_id || lat.licence !== lon.licence)) {
      lat.value = "UNKNOWN";
      lon.value = "UNKNOWN";
      warnings.push("Coordinates from different sources/licences cannot form one point");
    }
  } else {
    warnings.push("Coordinates UNKNOWN; no network geocoding or address inference");
  }

  const silo: Silo = Object.values(prepared).some(f => f.licence === "ODbL") ? "odbl" : "open";
  const record: PackRecord = {};
  for (const [name, fact] of Object.entries(prepared)) {
    if (silo === "odbl" && fact.licence !== "ODbL") {
      warnings.push(`${name}: excluded from ODbL output; normalise independently in open silo`);
      continue;
    }
    record[name] = fact;
  }
  return { record, silo, warnings, ...(input.id ? { sameAsCandidate: input.id } : {}) };
}

export interface CandidateRecord {
  id: string;
  record: PackRecord;
}
export interface DedupeCandidate {
  a: string;
  b: string;
  reason: "nearby-name" | "same-address-name";
  score: number;
}

function normalisedText(value: FactValue | undefined): string {
  if (typeof value !== "string" || value === "UNKNOWN") return "";
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0] ?? 0;
    previous[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = previous[j] ?? 0;
      previous[j] = Math.min((previous[j] ?? 0) + 1, (previous[j - 1] ?? 0) + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = old;
    }
  }
  return 1 - (previous[b.length] ?? 0) / Math.max(a.length, b.length);
}

function point(record: PackRecord): [number, number] | undefined {
  const lat = record.latitude;
  const lon = record.longitude;
  if (!lat || !lon || lat.value === "UNKNOWN" || lon.value === "UNKNOWN" ||
      lat.licence === "UNKNOWN" || lon.licence === "UNKNOWN" ||
      lat.source_id !== lon.source_id || lat.licence !== lon.licence) return undefined;
  const a = numericCoordinate(lat.value, true);
  const b = numericCoordinate(lon.value, false);
  return a === undefined || b === undefined ? undefined : [a, b];
}

function distanceM(a: [number, number], b: [number, number]): number {
  const radians = Math.PI / 180;
  const dLat = (b[0] - a[0]) * radians;
  const dLon = (b[1] - a[1]) * radians;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * radians) *
    Math.cos(b[0] * radians) * Math.sin(dLon / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Suggestions for human review only: never mutates, combines, or confirms records. */
export function candidates(records: readonly CandidateRecord[], maxDistanceM = 30): DedupeCandidate[] {
  if (!Number.isFinite(maxDistanceM) || maxDistanceM < 0) throw new RangeError("Invalid distance");
  const result: DedupeCandidate[] = [];
  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const a = records[i];
      const b = records[j];
      if (!a || !b || !a.id || !b.id || a.id === b.id) continue;
      const nameScore = similarity(normalisedText(a.record.name?.value), normalisedText(b.record.name?.value));
      if (nameScore < 0.7) continue;
      const p = point(a.record);
      const q = point(b.record);
      let reason: DedupeCandidate["reason"];
      let score: number;
      if (p && q) {
        const metres = distanceM(p, q);
        if (metres > maxDistanceM) continue;
        reason = "nearby-name";
        score = nameScore * (maxDistanceM === 0 ? 1 : 0.5 + 0.5 * (1 - metres / maxDistanceM));
      } else if (!p && !q) {
        const addressA = normalisedText(a.record.address?.value);
        const addressB = normalisedText(b.record.address?.value);
        if (!addressA || addressA !== addressB) continue;
        reason = "same-address-name";
        score = nameScore * 0.8;
      } else continue; // No coordinate-to-address proximity guess.
      result.push({ a: a.id, b: b.id, reason, score: Math.round(score * 1000) / 1000 });
    }
  }
  return result;
}
