import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readRows } from '../src/reader.js';
import { importRows, licenceGate, mapRow, newReport } from '../src/transform.js';
import type { ImportedRecord, SourceConfig } from '../src/types.js';

const fixture = (name: string) => {
  const candidates = [
    join(process.cwd(), 'packages/importer-ontario-open/test/fixtures', name),
    join(process.cwd(), 'test/fixtures', name),
  ];
  try {
    candidates.unshift(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)));
  } catch {
    // Vitest/jsdom can leave import.meta.url as a non-file URL.
  }
  const found = candidates.find((path) => existsSync(path));
  if (!found) throw new Error(`Missing fixture ${name}`);
  return found;
};
const base: SourceConfig = { id: 'synthetic-source', kind: 'facility', licence: 'OGL-Ontario',
  licence_confirmed: true, input_origin: 'synthetic-test-fixture', retrieved_at: '2026-11-15T12:00:00Z' };
async function run(name: string, config: SourceConfig) {
  const report = newReport(config);
  const results: ImportedRecord[] = [];
  for await (const record of importRows(readRows(fixture(name)), config, report)) results.push(record);
  return { report, results };
}

describe('licence-gated local importer', () => {
  it('imports facility metadata without treating a list or score as accessibility', async () => {
    const { results, report } = await run('facility.csv', base);
    expect(report.records).toBe(1);
    expect(results[0]).toBeDefined();
    expect(results[0]).toMatchObject({ name: 'Example Clinic', cell_id: 'cell-437--794',
      licence: 'OGL-Ontario', tier: 0, raw_publisher_score: '92', fields: {},
      provenance: { input_origin: 'synthetic-test-fixture', share_alike: false, prototypeLabel: 'SEEDED-OPEN-DATA' } });
    expect(results[0]?.fields.step_free).toBeUndefined();
  });

  it('imports address seeds with no accessibility facts', async () => {
    const { results } = await run('addresses.csv', { ...base, kind: 'address', licence: 'ODbL' });
    expect(results[0]).toBeDefined();
    expect(results[0]?.address).toContain('Example Road');
    expect(results[0]?.fields).toEqual({});
    expect(results[0]).toMatchObject({ silo: 'odbl', provenance: { share_alike: true, prototypeLabel: 'SEEDED-OPEN-DATA' } });
  });

  it('holds unconfirmed adult-change register without producing records', async () => {
    const { results, report } = await run('held-register.csv', { ...base,
      kind: 'adult-change-held', licence: 'unconfirmed', licence_confirmed: false });
    expect(results).toEqual([]);
    expect(report).toMatchObject({ status: 'held', records: 0, reason: 'licence unconfirmed' });
  });

  it('maps only explicit columns from a synthetic CC0 register', async () => {
    const { results } = await run('open-register.geojson', { ...base,
      kind: 'adult-change-open', licence: 'CC0' });
    expect(results).toHaveLength(2);
    expect(results[0]).toBeDefined();
    expect(results[0]?.fields).toMatchObject({
      adult_change: { value: true, tier: 1, source_key: 'adult_change', licence: 'CC0' },
      hoist: { value: false, tier: 1, source_key: 'hoist' } });
    expect(results[0]?.raw_publisher_score).toBe('4.5');
    expect(results[0]?.fields.step_free).toBeUndefined();
    expect(results[1]?.fields).toMatchObject({
      adult_change: { value: 'UNKNOWN', tier: 0 }, hoist: { value: 'UNKNOWN', tier: 0 } });
  });

  it('rejects non-open, unspecified and falsely approved licences', async () => {
    for (const licence of ['unconfirmed', 'proprietary', 'CC-BY-NC']) {
      const config = { ...base, licence };
      expect(licenceGate(config)).toBeDefined();
      expect((await run('facility.csv', config)).results).toEqual([]);
    }
    expect(licenceGate({ ...base, licence_confirmed: false })).toBe('licence unconfirmed');
    expect(mapRow({ id: 'x', name: 'Example' }, { ...base, licence_confirmed: false })).toBeNull();
  });

  it('never transforms a publisher score or a licence list into access facts', () => {
    const result = mapRow({ name: 'Test', publisher_score: '100', licence: 'OGL-Ontario',
      accessibility: 'accessible', step_free: 'yes', id: 'f2' }, base);
    expect(result?.fields).toEqual({});
    expect(result?.raw_publisher_score).toBe('100');
  });

  it('preserves quoted commas, escaped quotes and newlines in CSV', async () => {
    // The facility fixture includes a quoted comma; reader output must preserve it.
    const rows = [];
    for await (const row of readRows(fixture('facility.csv'))) rows.push(row);
    expect(rows[0]?.address).toBe('123 Sample St, Ontario');
  });
});
