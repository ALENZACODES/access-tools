// @ts-expect-error TS5097: explicit .ts extension is required by node --experimental-strip-types
import { bindingsOf, mapBindings, newStats } from "./mapper.ts";
// @ts-expect-error TS5097: explicit .ts extension is required by node --experimental-strip-types
import { licenceGate } from "./sources.ts";
// @ts-expect-error TS5097: explicit .ts extension is required by node --experimental-strip-types
import { validateRecord } from "./schema.ts";
import type { ImportStats } from "./mapper";
import type { SourceDef } from "./sources";
import type { Binding, ImportedRecord, LicenceRecord, SparqlResult } from "./types";

export interface RunOptions {
  source: SourceDef;
  bindings: AsyncIterable<Binding>;
  /** Query date, YYYY-MM-DD. */
  retrievedAt: string;
  licenceRecord?: LicenceRecord | null;
  /** Receives each valid record. Nothing is buffered here. */
  sink: (record: ImportedRecord) => Promise<void> | void;
}

export interface RunResult {
  stats: ImportStats;
  emitted: number;
  unknownFieldCount: Record<string, number>;
  held: boolean;
}

export async function runImport(o: RunOptions): Promise<RunResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.retrievedAt)) throw new Error("retrievedAt must be YYYY-MM-DD");
  // Throws LicenceGateError before anything is read or written.
  const { held } = licenceGate(o.source, o.licenceRecord);
  const stats = newStats();
  const unknownFieldCount: Record<string, number> = {};
  let emitted = 0;
  for await (const record of mapBindings(o.bindings, { source: o.source, retrievedAt: o.retrievedAt }, stats)) {
    if (!validateRecord(record).ok) {
      stats.rejected["schema-invalid"] = (stats.rejected["schema-invalid"] ?? 0) + 1;
      continue;
    }
    for (const [name, fact] of Object.entries(record.facts)) {
      if (fact.value === null) unknownFieldCount[name] = (unknownFieldCount[name] ?? 0) + 1;
    }
    await o.sink(record);
    emitted += 1;
  }
  return { stats, emitted, unknownFieldCount, held };
}

export function importResult(result: SparqlResult, o: Omit<RunOptions, "bindings">): Promise<RunResult> {
  return runImport({ ...o, bindings: bindingsOf(result) });
}
