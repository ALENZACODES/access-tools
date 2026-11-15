/// <reference types="node" />
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createInterface } from "node:readline";
import type { Readable } from "node:stream";
import { constants, createGzip, gzipSync } from "node:zlib";
import { licenceGate, type LicenceRecord, type SourceDef } from "#src/sources";
import type { ImportedRecord, PartitionEntry } from "#src/types";

export const DEFAULT_MAX_BYTES = 20 * 1024 * 1024;

/** Lines from any Node readable (file or fetch body), without loading it whole. */
export function linesFromStream(input: Readable): AsyncIterable<string> {
  return createInterface({ input, crlfDelay: Infinity });
}

export function linesFromFile(path: string): AsyncIterable<string> {
  return linesFromStream(createReadStream(path, { encoding: "utf8" }));
}

export interface Manifest {
  parts: PartitionEntry[];
  totalRecords: number;
}

// Room for the gzip trailer and the final block written when a part is closed.
const TRAILER_MARGIN = 32;

class Part {
  bytes = 0;
  records = 0;
  private hash = createHash("sha256");
  private gz = createGzip();
  private out;
  private closed: Promise<void>;
  readonly file: string;

  constructor(file: string, path: string) {
    this.file = file;
    this.out = createWriteStream(path);
    this.closed = new Promise((res, rej) => {
      this.out.on("close", () => res());
      this.out.on("error", rej);
    });
    this.gz.on("data", (c: Buffer) => {
      this.bytes += c.length;
      this.hash.update(c);
      this.out.write(c);
    });
    this.gz.on("end", () => this.out.end());
  }

  async add(line: string): Promise<void> {
    this.gz.write(line);
    await new Promise<void>((res) => this.gz.flush(constants.Z_SYNC_FLUSH, res));
    this.records++;
  }

  async close(): Promise<PartitionEntry> {
    this.gz.end();
    await this.closed;
    return { file: this.file, records: this.records, bytes: this.bytes, sha256: this.hash.digest("hex") };
  }
}

/**
 * Writes gzip NDJSON parts. Starts a new part before a record would push the current one
 * past `maxBytes` (compressed). A single record larger than `maxBytes` gets its own part.
 */
export async function writePartitions(
  records: AsyncIterable<ImportedRecord>,
  dir: string,
  opts: { prefix: string; maxBytes?: number },
): Promise<Manifest> {
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  await mkdir(dir, { recursive: true });
  const parts: PartitionEntry[] = [];
  let current: Part | null = null;
  for await (const rec of records) {
    const line = JSON.stringify(rec) + "\n";
    // Compressing the line alone over-estimates its cost inside a shared gzip stream.
    const estimate = gzipSync(line).length;
    if (current && current.records > 0 && current.bytes + estimate + TRAILER_MARGIN > maxBytes) {
      parts.push(await current.close());
      current = null;
    }
    if (!current) {
      const file = `${opts.prefix}-${String(parts.length + 1).padStart(3, "0")}.ndjson.gz`;
      current = new Part(file, join(dir, file));
    }
    await current.add(line);
  }
  if (current) parts.push(await current.close());
  const manifest: Manifest = { parts, totalRecords: parts.reduce((n, p) => n + p.records, 0) };
  await writeFile(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

/**
 * Licence gate in front of the writer. A held source writes nothing:
 * the caller lists it as held in the report.
 */
export async function writeGated(
  source: SourceDef,
  records: AsyncIterable<ImportedRecord>,
  dir: string,
  opts: { prefix: string; maxBytes?: number },
  licence?: LicenceRecord,
): Promise<{ held: boolean; manifest: Manifest | null }> {
  const { held } = licenceGate(source, licence);
  if (held) {
    // Drain nothing and write nothing: held output must not be committed.
    return { held: true, manifest: null };
  }
  return { held: false, manifest: await writePartitions(records, dir, opts) };
}
