/// <reference types="node" />
import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { once } from "node:events";
import type { ImportedRecord, ImportReport } from "./types.js";

export type Partition = ImportReport["partitions"][number];

/** Each NDJSON line is an independent gzip member. Concatenated members are valid gzip. */
export async function writePartitions(
  records: AsyncIterable<ImportedRecord>, directory: string,
  maxBytes = 20 * 1024 * 1024,
): Promise<Partition[]> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 20 * 1024 * 1024) {
    throw new Error("maxBytes must be between 1 and 20 MiB");
  }
  await mkdir(directory, { recursive: true });
  const parts: Partition[] = [];
  let stream: ReturnType<typeof createWriteStream> | null = null;
  let hash = createHash("sha256");
  let bytes = 0;
  let count = 0;
  let filename = "";
  async function closePart(): Promise<void> {
    if (!stream) return;
    const closing = stream;
    closing.end();
    await once(closing, "finish");
    parts.push({ file: filename, records: count, bytes, sha256: hash.digest("hex") });
    stream = null;
  }
  try {
    for await (const record of records) {
      const member = gzipSync(Buffer.from(`${JSON.stringify(record)}\n`, "utf8"));
      if (member.byteLength > maxBytes) throw new Error(`Single record exceeds maxBytes: ${record.id}`);
      if (stream && bytes + member.byteLength > maxBytes) await closePart();
      if (!stream) {
        filename = `part-${String(parts.length + 1).padStart(5, "0")}.ndjson.gz`;
        stream = createWriteStream(join(directory, filename), { flags: "wx" });
        hash = createHash("sha256"); bytes = 0; count = 0;
      }
      if (!stream.write(member)) await once(stream, "drain");
      hash.update(member);
      bytes += member.byteLength;
      count += 1;
    }
    await closePart();
  } catch (error) {
    stream?.destroy();
    throw error;
  }
  await writeFile(join(directory, "manifest.json"), `${JSON.stringify({ partitions: parts }, null, 2)}\n`);
  return parts;
}

export async function writeReport(directory: string, report: ImportReport): Promise<void> {
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
}
