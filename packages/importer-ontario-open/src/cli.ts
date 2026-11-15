import { createWriteStream } from 'node:fs';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { readRows } from './reader.js';
import { importRows, newReport } from './transform.js';
import type { SourceConfig, SourceKind } from './types.js';

// Local only: CLI <kind> <local-file> <licence> <confirmed|unconfirmed> <source-id> <retrieved-ISO> <output-prefix>
const [, , kind, localFile, licence, confirmed, sourceId, retrievedAt, outputPrefix] = process.argv;
const kinds: SourceKind[] = ['facility', 'address', 'adult-change-held', 'adult-change-open'];
if (!kinds.includes(kind as SourceKind) || !localFile || !licence || !confirmed || !['confirmed', 'unconfirmed'].includes(confirmed)
  || !sourceId || !retrievedAt || !outputPrefix) {
  process.stderr.write('Usage: cli <kind> <local-file> <licence> <confirmed|unconfirmed> <source-id> <retrieved-ISO> <output-prefix>\n');
  process.exitCode = 2;
} else {
  const config: SourceConfig = { kind: kind as SourceKind, id: sourceId, licence,
    licence_confirmed: confirmed === 'confirmed', retrieved_at: retrievedAt,
    input_origin: resolve(localFile) };
  const report = newReport(config);
  // No output data file is created for held sources.
  const { licenceGate } = await import('./transform.js');
  if (licenceGate(config)) {
    report.status = 'held';
    report.reason = licenceGate(config);
  } else {
    const outputs = new Map<string, ReturnType<typeof createWriteStream>>();
    try {
      for await (const record of importRows(readRows(localFile), config, report)) {
        const partition = `${record.silo}.${record.cell_id}`;
        let out = outputs.get(partition);
        if (!out) {
          out = createWriteStream(`${outputPrefix}.${partition}.ndjson`, { flags: 'w' });
          outputs.set(partition, out);
        }
        if (!out.write(`${JSON.stringify(record)}\n`)) await once(out, 'drain');
      }
    } finally {
      await Promise.all([...outputs.values()].map(async out => {
        out.end();
        await once(out, 'finish');
      }));
    }
  }
  process.stderr.write(`${JSON.stringify(report)}\n`);
  if (report.status === 'held') process.exitCode = 3;
}
