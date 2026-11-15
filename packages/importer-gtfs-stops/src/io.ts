/// <reference types="node" />
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import type { ImportedRecord, Partition } from "./types.js";
import { validateRecord } from "./schema.js";

export interface WriteOptions { maxBytes?: number }
/** Compressed-size limit, tested for each candidate before a part is committed. */
export async function writePartitions(records: AsyncIterable<ImportedRecord>, directory: string, options: WriteOptions = {}): Promise<Partition[]> {
  const maxBytes = options.maxBytes ?? 20 * 1024 * 1024;
  if (maxBytes <= 0) throw new Error("maxBytes must be positive");
  await mkdir(directory, { recursive: true });
  const parts: Partition[] = [];
  let lines: string[] = [];
  let pending: Buffer | null = null;
  async function flush(): Promise<void> {
    if (!lines.length || !pending) return;
    const file = `part-${String(parts.length + 1).padStart(5, "0")}.ndjson.gz`;
    await writeFile(join(directory, file), pending);
    parts.push({ file, count: lines.length, bytes: pending.length,
      sha256: createHash("sha256").update(pending).digest("hex") });
    lines = [];
    pending = null;
  }
  for await (const record of records) {
    const recordId = record.id;
    if (!validateRecord(record)) throw new Error(`Invalid record ${recordId}: ${JSON.stringify(validateRecord.errors)}`);
    const line = JSON.stringify(record) + "\n";
    let candidate = gzipSync(lines.join("") + line, { mtime: 0 } as never);
    if (candidate.length > maxBytes && lines.length) {
      await flush();
      candidate = gzipSync(line, { mtime: 0 } as never);
    }
    if (candidate.length > maxBytes) throw new Error(`Record ${record.id} exceeds maxBytes`);
    lines.push(line);
    pending = candidate;
  }
  await flush();
  await writeFile(join(directory, "manifest.json"), JSON.stringify({ partitions: parts }, null, 2) + "\n");
  return parts;
}
