import type { Answer, EssentialKey, PackFact, PackRecord, PackSource, SourceRegistry } from './pack-types';

export const ESSENTIAL_KEYS: readonly EssentialKey[] = [
  'washroom_wheelchair', 'parking_accessible', 'adult_change_table',
  'hoist', 'open_without_purchase', 'staff_refuel', 'charging',
];
export type FilterValue = Answer | 'any';
export type Filters = Partial<Record<EssentialKey, FilterValue>>;
export interface Point { latitude: number; longitude: number }
export interface FinderOptions {
  filters?: Filters;
  origin?: Point;
  radiusKm?: number;
  registry: SourceRegistry;
}
export interface Match {
  record: PackRecord;
  distanceKm?: number;
}
export interface FinderResult {
  matches: Match[];
  nearbyCount: number;
  unknownNearby: number;
  unknownByFilter: Partial<Record<EssentialKey, number>>;
  heldCount: number;
}

const LICENCES = new Set(['ODbL', 'OGL-Ontario', 'OGL-Canada', 'CC-BY', 'CC0']);
const validDate = (date: string): boolean => /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(date) && !Number.isNaN(Date.parse(date));

export function knownFact(fact: PackFact | undefined, registry: SourceRegistry): PackFact | undefined {
  if (!fact || fact.tier === 0 || !LICENCES.has(fact.licence) || !validDate(fact.retrieved_at)) return undefined;
  const source = registry[fact.source_id];
  if (!source?.confirmed || source.held || source.licence !== fact.licence) return undefined;
  if (fact.value !== 'yes' && fact.value !== 'no') return undefined;
  return fact;
}

export function status(record: PackRecord, key: EssentialKey, registry: SourceRegistry): Answer {
  return knownFact(record.fields?.[key], registry)?.value ?? 'UNKNOWN';
}

function permitted(record: PackRecord, registry: SourceRegistry): boolean {
  if (record.held || !record.id || !record.name || !record.licence || !record.source_id) return false;
  const source = registry[record.source_id];
  return !!source?.confirmed && !source.held && source.licence === record.licence && LICENCES.has(record.licence);
}

function distanceKm(a: Point, b: Point): number {
  const r = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * r;
  const dLon = (b.longitude - a.longitude) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * r) * Math.cos(b.latitude * r) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function validPoint(p: Point): boolean {
  return Number.isFinite(p.latitude) && Number.isFinite(p.longitude)
    && Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180;
}

/** Unknown never satisfies a yes/no requirement. Explicit UNKNOWN selects unknowns only. */
export async function findEssentials(records: PackSource | readonly PackRecord[], options: FinderOptions): Promise<FinderResult> {
  const filters = options.filters ?? {};
  const selected = ESSENTIAL_KEYS.filter(key => filters[key] && filters[key] !== 'any');
  const unknownByFilter: Partial<Record<EssentialKey, number>> = {};
  for (const key of selected) unknownByFilter[key] = 0;
  const matches: Match[] = [];
  let heldCount = 0;
  let nearbyCount = 0;
  let unknownNearby = 0;
  if (options.origin && !validPoint(options.origin)) throw new RangeError('Invalid origin');
  if (options.radiusKm !== undefined && (!options.origin || !Number.isFinite(options.radiusKm) || options.radiusKm < 0)) {
    throw new RangeError('Radius requires a valid origin and a nonnegative distance');
  }
  for await (const record of records) {
    if (!permitted(record, options.registry)) { heldCount++; continue; }
    const point = record.latitude === undefined || record.longitude === undefined
      ? undefined : { latitude: record.latitude, longitude: record.longitude };
    const distance = options.origin && point && validPoint(point) ? distanceKm(options.origin, point) : undefined;
    if (options.origin && distance === undefined) continue;
    if (options.radiusKm !== undefined && distance! > options.radiusKm) continue;
    nearbyCount++;
    const unknownKeys = selected.filter(key => status(record, key, options.registry) === 'UNKNOWN');
    for (const key of unknownKeys) unknownByFilter[key] = (unknownByFilter[key] ?? 0) + 1;
    if (unknownKeys.length) unknownNearby++;
    if (selected.every(key => status(record, key, options.registry) === filters[key])) {
      matches.push({ record, ...(distance === undefined ? {} : { distanceKm: distance }) });
    }
  }
  matches.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
    || a.record.name.localeCompare(b.record.name) || a.record.id.localeCompare(b.record.id));
  return { matches, nearbyCount, unknownNearby, unknownByFilter, heldCount };
}
