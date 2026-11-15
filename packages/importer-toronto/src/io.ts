/// <reference types="node" />
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import type { ImportedRecord, Partition } from "./types.js";

export const DEFAULT_MAX_BYTES = 20 * 1024 * 1024;
export async function writePartitions(
  records: AsyncIterable<ImportedRecord>, directory: string, maxBytes = DEFAULT_MAX_BYTES,
): Promise<Partition[]> {
  if (!Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > DEFAULT_MAX_BYTES) throw new Error("Invalid partition size");
  await mkdir(directory, { recursive: true });
  const parts: Partition[] = [];
  let lines: string[] = [];
  let current = Buffer.alloc(0);
  async function flush(): Promise<void> {
    if (!lines.length) return;
    const file = `part-${String(parts.length + 1).padStart(5, "0")}.ndjson.gz`;
    await writeFile(join(directory, file), current);
    parts.push({ file, count: lines.length, bytes: current.length, sha256: createHash("sha256").update(current).digest("hex") });
    lines = [];
    current = Buffer.alloc(0);
  }
  for await (const record of records) {
    const line = `${JSON.stringify(record)}\n`;
    const test = gzipSync(lines.join("") + line);
    if (test.length > maxBytes && lines.length) {
      await flush();
      const single = gzipSync(line);
      if (single.length > maxBytes) throw new Error(`Record ${record.id} exceeds maxBytes`);
      lines.push(line);
      current = single;
    } else if (test.length > maxBytes) {
      throw new Error(`Record ${record.id} exceeds maxBytes`);
    } else {
      lines.push(line);
      current = test;
    }
  }
  await flush();
  await writeFile(join(directory, "manifest.json"), JSON.stringify({ parts }, null, 2) + "\n");
  return parts;
}
