import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import manifestSchema from "./manifest.schema.json";

export interface TileKey {
  z: number;
  x: number;
  y: number;
}

export type Verification =
  | "UNKNOWN" | "0" | "1" | "2" | "4" | "E"
  | "PROTOTYPE-UNVERIFIED" | "SEEDED-OPEN-DATA";

export interface TileManifest {
  key: TileKey;
  byteLength: number;
  storedAt: string;
  expiresAt: string;
  source: string;
  licence: string;
  attribution: string;
  retrievedOn: string;
  verification: Verification;
}

export interface TileRecord {
  manifest: TileManifest;
  bytes: Uint8Array;
}

export interface TileForDisplay extends TileRecord {
  credit: { text: string; licence: string };
}

export interface CacheStatus {
  entries: number;
  bytesUsed: number;
  capBytes: number;
  asOf: string | null;
  credits: { text: string; licence: string }[];
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile<TileManifest>(manifestSchema);
export const OSM_CREDIT = "© OpenStreetMap contributors";
const FORBIDDEN = /(?:live[\s_-]*)?(?:traffic|elevators?|disruptions?)/i;

function checkedKey(key: TileKey): string {
  if (!Number.isInteger(key.z) || key.z < 0 || key.z > 24 ||
      !Number.isInteger(key.x) || !Number.isInteger(key.y) ||
      key.x < 0 || key.y < 0 || key.x >= 2 ** key.z || key.y >= 2 ** key.z) {
    throw new Error("Invalid tile coordinate");
  }
  return `${key.z}/${key.x}/${key.y}`;
}

function checkedDate(value: string): number {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) throw new Error("Invalid timestamp");
  return ms;
}

export function attributionForDisplay(manifest: TileManifest): { text: string; licence: string } {
  if (!manifest.attribution?.trim() || !manifest.licence?.trim()) {
    throw new Error("Attribution and licence are required for display");
  }
  if (manifest.licence === "ODbL-1.0" && manifest.attribution !== OSM_CREDIT) {
    throw new Error("OpenStreetMap attribution is required for display");
  }
  return { text: manifest.attribution, licence: manifest.licence };
}

export function validateManifest(manifest: unknown): asserts manifest is TileManifest {
  if (!validate(manifest)) throw new Error(`Invalid tile manifest: ${ajv.errorsText(validate.errors)}`);
  const m = manifest as TileManifest;
  checkedKey(m.key);
  if (checkedDate(m.expiresAt) <= checkedDate(m.storedAt)) {
    throw new Error("Expiry must follow storage timestamp");
  }
  attributionForDisplay(m);
  if (FORBIDDEN.test(m.source)) throw new Error("Live or disruption payloads cannot be cached");
  if (/openstreetmap|\bosm\b/i.test(m.source) &&
      (m.licence !== "ODbL-1.0" || m.attribution !== OSM_CREDIT)) {
    throw new Error("OpenStreetMap licence and attribution are required");
  }
}

function copy(record: TileRecord): TileRecord {
  return { manifest: structuredClone(record.manifest), bytes: new Uint8Array(record.bytes) };
}

/** In-memory implementation. A renderer may substitute persistent storage later. */
export class TileCache {
  private readonly records = new Map<string, TileRecord>();
  readonly capBytes: number;

  constructor(capMB: number, private readonly now: () => number = Date.now) {
    if (!Number.isFinite(capMB) || capMB <= 0 || capMB > 1024) {
      throw new Error("Storage cap must be between 0 and 1024 MB");
    }
    this.capBytes = Math.floor(capMB * 1024 * 1024);
    if (this.capBytes < 1) throw new Error("Storage cap too small");
  }

  put(record: TileRecord): void {
    validateManifest(record.manifest);
    if (!(record.bytes instanceof Uint8Array) || record.bytes.byteLength !== record.manifest.byteLength) {
      throw new Error("Tile byte length mismatch");
    }
    if (checkedDate(record.manifest.expiresAt) <= this.now()) throw new Error("Tile is expired");
    if (record.bytes.byteLength > this.capBytes) throw new Error("Tile exceeds storage cap");
    const key = checkedKey(record.manifest.key);
    const previous = this.records.get(key);
    this.records.delete(key);
    try {
      this.evictExpired();
      this.evictToQuota(this.capBytes - record.bytes.byteLength);
      this.records.set(key, copy(record));
    } catch (error) {
      if (previous) this.records.set(key, previous);
      throw error;
    }
  }

  get(key: TileKey): TileRecord | undefined {
    const id = checkedKey(key);
    const record = this.records.get(id);
    if (!record) return undefined;
    if (checkedDate(record.manifest.expiresAt) <= this.now()) {
      this.records.delete(id);
      return undefined;
    }
    return copy(record);
  }

  getForDisplay(key: TileKey): TileForDisplay | undefined {
    const record = this.get(key);
    if (!record) return undefined;
    return { ...record, credit: attributionForDisplay(record.manifest) };
  }

  has(key: TileKey): boolean { return this.get(key) !== undefined; }
  delete(key: TileKey): boolean { return this.records.delete(checkedKey(key)); }

  list(): TileManifest[] {
    this.evictExpired();
    return [...this.records.values()].map(({ manifest }) => structuredClone(manifest));
  }

  evictExpired(): number {
    let removed = 0;
    for (const [key, record] of this.records) {
      if (checkedDate(record.manifest.expiresAt) <= this.now()) {
        this.records.delete(key);
        removed++;
      }
    }
    return removed;
  }

  evictToQuota(targetBytes = this.capBytes): number {
    if (!Number.isSafeInteger(targetBytes) || targetBytes < 0 || targetBytes > this.capBytes) {
      throw new Error("Invalid quota target");
    }
    this.evictExpired();
    let removed = 0;
    while (this.bytesUsed > targetBytes) {
      const oldest = [...this.records.entries()].sort((a, b) =>
        checkedDate(a[1].manifest.storedAt) - checkedDate(b[1].manifest.storedAt))[0];
      if (!oldest) break;
      this.records.delete(oldest[0]);
      removed++;
    }
    return removed;
  }

  get bytesUsed(): number {
    let total = 0;
    for (const record of this.records.values()) total += record.bytes.byteLength;
    return total;
  }

  status(): CacheStatus {
    const records = this.list();
    const credits = new Map<string, { text: string; licence: string }>();
    for (const manifest of records) {
      const credit = attributionForDisplay(manifest);
      credits.set(`${credit.licence}\0${credit.text}`, credit);
    }
    return {
      entries: records.length,
      bytesUsed: this.bytesUsed,
      capBytes: this.capBytes,
      asOf: records.length ? records.map((record) => record.retrievedOn).sort().at(-1) ?? null : null,
      credits: [...credits.values()],
    };
  }
}
