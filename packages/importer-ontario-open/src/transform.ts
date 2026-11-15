import { createHash } from 'node:crypto';
import { OPEN_LICENCES } from './types.js';
import type { AccessFact, ImportedRecord, InputRow, OpenLicence, RunReport, SourceConfig } from './types.js';
import { address } from './sources/address.js';
import { adultChangeHeld } from './sources/adult-change-held.js';
import { adultChangeOpen } from './sources/adult-change-open.js';
import { facility } from './sources/facility.js';

export function value(v: unknown): string { return typeof v === 'string' || typeof v === 'number' ? String(v).trim() : ''; }
function coordinate(v: unknown, min: number, max: number): number | undefined {
  if (v === null || v === undefined || value(v) === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}
interface Seed { key: string; name?: string; address?: string; latitude?: number; longitude?: number;
  rawScore?: string; explicit?: Record<string, unknown>; }
export function place(input: { key: string; name?: string; address?: string; latitude?: unknown;
  longitude?: unknown; rawScore?: unknown }): Seed | null {
  if (!input.key) return null;
  const latitude = coordinate(input.latitude, -90, 90);
  const longitude = coordinate(input.longitude, -180, 180);
  if ((latitude === undefined) !== (longitude === undefined)) throw new Error('Coordinate pair required');
  return { key: input.key, name: input.name || undefined, address: input.address || undefined,
    latitude, longitude, rawScore: value(input.rawScore) || undefined };
}

export function licenceGate(config: SourceConfig): string | undefined {
  if (!config.licence_confirmed) return 'licence unconfirmed';
  if (!OPEN_LICENCES.includes(config.licence as OpenLicence)) return 'licence not open or unsupported';
  if (!/^\d{4}-\d{2}-\d{2}T/.test(config.retrieved_at) || !Number.isFinite(Date.parse(config.retrieved_at))) {
    return 'invalid retrieved date';
  }
  if (!config.id || !config.input_origin) return 'missing provenance';
  if (config.kind === 'adult-change-held') return 'register licence not confirmed';
  return undefined;
}

const mappers = { facility, address, 'adult-change-held': adultChangeHeld, 'adult-change-open': adultChangeOpen };
function explicitBoolean(raw: unknown): boolean | 'UNKNOWN' {
  // Do not treat blank, unknown or scored fields as an accessibility assertion.
  if (raw === true || raw === 'yes' || raw === 'YES' || raw === 'true' || raw === '1') return true;
  if (raw === false || raw === 'no' || raw === 'NO' || raw === 'false' || raw === '0') return false;
  return 'UNKNOWN';
}
function fact(raw: unknown, key: string, config: SourceConfig, licence: OpenLicence): AccessFact {
  const parsed = explicitBoolean(raw);
  return { value: parsed, source_id: config.id, licence, retrieved_at: config.retrieved_at,
    tier: parsed === 'UNKNOWN' ? 0 : 1, source_key: key,
    ...(parsed === 'UNKNOWN' ? {} : { raw }) };
}
function cell(lat?: number, lon?: number): string {
  if (lat === undefined || lon === undefined) return 'unlocated';
  // Stable 0.1-degree geographic partitions, including negative coordinates.
  return `cell-${Math.floor(lat * 10)}-${Math.floor(lon * 10)}`;
}
export function mapRow(row: InputRow, config: SourceConfig): ImportedRecord | null {
  if (licenceGate(config)) return null;
  const seed = mappers[config.kind](row);
  if (!seed) return null;
  const licence = config.licence as OpenLicence;
  const hash = createHash('sha256').update(`${config.id}\0${seed.key}`).digest('hex').slice(0, 20);
  const fields: Record<string, AccessFact> = {};
  if (config.kind === 'adult-change-open') {
    for (const key of ['adult_change', 'hoist'] as const) {
      fields[key] = fact(seed.explicit?.[key], key, config, licence);
    }
  }
  return { id: `${config.id}:${hash}`, source_id: config.id, name: seed.name,
    address: seed.address, latitude: seed.latitude, longitude: seed.longitude,
    cell_id: cell(seed.latitude, seed.longitude), silo: licence === 'ODbL' ? 'odbl' : 'open',
    licence, retrieved_at: config.retrieved_at,
    tier: Object.values(fields).some(f => f.tier === 1) ? 1 : 0, fields,
    ...(seed.rawScore === undefined ? {} : { raw_publisher_score: seed.rawScore }),
    provenance: { source_id: config.id, input_origin: config.input_origin, licence,
      retrieved_at: config.retrieved_at, share_alike: licence === 'ODbL',
      prototypeLabel: 'SEEDED-OPEN-DATA' } };
}

export async function* importRows(rows: AsyncIterable<InputRow>, config: SourceConfig,
  report: RunReport): AsyncGenerator<ImportedRecord> {
  const reason = licenceGate(config);
  if (reason) { report.status = 'held'; report.reason = reason; return; }
  for await (const row of rows) {
    const mapped = mapRow(row, config);
    if (mapped) { report.records++; yield mapped; }
  }
}
export function newReport(config: SourceConfig): RunReport {
  return { source_id: config.id, status: 'imported', records: 0,
    retrieved_at: config.retrieved_at, licence: config.licence };
}
