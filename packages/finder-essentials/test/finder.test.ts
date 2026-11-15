import { describe, expect, it } from 'vitest';
import { findEssentials, status } from '../src/finder';
import type { PackRecord, SourceRegistry } from '../src/pack-types';

// Entirely synthetic locations and source IDs; no person or real-world venue data.
const registry: SourceRegistry = {
  local: { name: 'Synthetic operator', licence: 'CC0', confirmed: true },
  osm: { name: 'Synthetic OSM-like source', licence: 'ODbL', confirmed: true },
  pending: { name: 'Unconfirmed feed', licence: 'CC0', confirmed: false },
};
const fact = (value: 'yes' | 'no' | 'UNKNOWN') => ({
  value, source_id: 'local', licence: 'CC0' as const, retrieved_at: '2026-01-01', tier: 1 as const,
});
const station: PackRecord = { id: 'station', name: 'Synthetic fuel stop', source_id: 'local', licence: 'CC0',
  latitude: 43, longitude: -79, fields: {} };
const washroom: PackRecord = { id: 'washroom', name: 'Synthetic washroom', source_id: 'local', licence: 'CC0',
  latitude: 43.001, longitude: -79, fields: { open_without_purchase: fact('yes'), washroom_wheelchair: fact('yes') } };
const held: PackRecord = { ...washroom, id: 'held', held: true };
const noLicence: PackRecord = { ...washroom, id: 'no-licence', licence: undefined };
const unconfirmed: PackRecord = { ...washroom, id: 'feed', source_id: 'pending' };

describe('essentials honesty', () => {
  it('does not convert an absent staff refuel fact to no or yes', async () => {
    const found = await findEssentials([station], { registry, filters: { staff_refuel: 'yes' } });
    expect(found.matches).toHaveLength(0);
    expect(found.unknownNearby).toBe(1);
    expect(found.unknownByFilter.staff_refuel).toBe(1);
    expect(status(station, 'staff_refuel', registry)).toBe('UNKNOWN');
  });
  it('matches a sourced open-without-purchase washroom', async () => {
    const found = await findEssentials([station, washroom], {
      registry, filters: { open_without_purchase: 'yes' }, origin: { latitude: 43, longitude: -79 }, radiusKm: 2,
    });
    expect(found.matches.map(item => item.record.id)).toEqual(['washroom']);
    expect(found.unknownNearby).toBe(1);
  });
  it('holds records with missing, held or unconfirmed licences', async () => {
    const found = await findEssentials([held, noLicence, unconfirmed, washroom], { registry });
    expect(found.matches.map(item => item.record.id)).toEqual(['washroom']);
    expect(found.heldCount).toBe(3);
  });
  it('does not present tier zero, mismatched source licence or unknown as known', async () => {
    const draft: PackRecord = { ...washroom, id: 'draft', fields: {
      charging: { ...fact('yes'), tier: 0 }, staff_refuel: { ...fact('no'), licence: 'ODbL' },
      hoist: fact('UNKNOWN'),
    } };
    for (const key of ['charging', 'staff_refuel', 'hoist'] as const) {
      expect(status(draft, key, registry)).toBe('UNKNOWN');
    }
    expect((await findEssentials([draft], { registry, filters: { charging: 'yes' } })).matches).toHaveLength(0);
  });
  it('sorts by distance and supports an async pack iterator', async () => {
    async function* stream() { yield washroom; yield station; }
    const found = await findEssentials(stream(), { registry, origin: { latitude: 43, longitude: -79 } });
    expect(found.matches.map(item => item.record.id)).toEqual(['station', 'washroom']);
  });
  it('keeps explicit UNKNOWN distinct from no', async () => {
    const found = await findEssentials([station, washroom], { registry, filters: { staff_refuel: 'UNKNOWN' } });
    expect(found.matches).toHaveLength(2);
  });
});
