/// <reference types="node" />
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
// @ts-ignore Node strip-types uses TypeScript source paths
import type { ImportedRecord, Part } from "./types.ts";

/** A bounded chunk is compressed before admission, ensuring each on-disk part stays below maxBytes. */
export async function writePartitions(records: AsyncIterable<ImportedRecord>, directory: string, maxBytes = 20 * 1024 * 1024): Promise<Part[]> {
  if (maxBytes < 128) throw new Error("maxBytes must be >= 128");
  await mkdir(directory, { recursive: true });
  const parts: Part[] = [];
  let count = 0;
  let bytes = 0;
  let hash = createHash("sha256");
  let blocks: Buffer[] = [];
  const flush = async (): Promise<void> => {
    if (!count) return;
    const file = `part-${String(parts.length).padStart(5, "0")}.ndjson.gz`;
    await writeFile(join(directory, file), Buffer.concat(blocks, bytes));
    parts.push({ file, records: count, bytes, sha256: hash.digest("hex") });
    count = 0; bytes = 0; blocks = []; hash = createHash("sha256");
  };
  // Concatenated gzip members are a valid gzip stream. Compress each record once;
  // admission is exact and total runtime is linear rather than repeated re-compression.
  for await (const record of records) {
    const block = gzipSync(`${JSON.stringify(record)}\n`);
    if (block.length > maxBytes) throw new Error(`record exceeds maxBytes: ${record.id}`);
    if (count && bytes + block.length > maxBytes) await flush();
    blocks.push(block); hash.update(block); bytes += block.length; count += 1;
  }
  await flush();
  await writeFile(join(directory, "manifest.json"), `${JSON.stringify({ parts, records: parts.reduce((n, p) => n + p.records, 0) }, null, 2)}\n`);
  return parts;
}
