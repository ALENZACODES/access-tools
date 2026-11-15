/// <reference types="node" />
import { createHash } from "node:crypto";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import type { Manifest, PartitionInfo } from "./types";

export const DEFAULT_MAX_BYTES = 20 * 1024 * 1024;

export interface PartitionOptions {
  dir: string;
  /** File name prefix, e.g. "wikidata-p2846-ontario". */
  prefix: string;
  /** Maximum compressed size of one part. Default 20 MB. */
  maxBytes?: number;
  /** Uncompressed bytes buffered before one gzip member is written. Default 256 KiB. */
  chunkBytes?: number;
}

interface OpenPart {
  info: PartitionInfo;
  hash: ReturnType<typeof createHash>;
}

/**
 * Writes gzip NDJSON. Each flush is one gzip member, and members concatenate into a
 * valid gzip file. A new part starts before a member would push the part past maxBytes.
 * A single member larger than maxBytes still gets a part of its own.
 */
export class PartitionWriter {
  private readonly dir: string;
  private readonly prefix: string;
  private readonly maxBytes: number;
  private readonly chunkBytes: number;
  private lines: string[] = [];
  private pendingBytes = 0;
  private pendingRecords = 0;
  private current: OpenPart | null = null;
  private readonly done: PartitionInfo[] = [];
  private closed = false;

  constructor(o: PartitionOptions) {
    this.dir = o.dir;
    this.prefix = o.prefix;
    this.maxBytes = o.maxBytes ?? DEFAULT_MAX_BYTES;
    this.chunkBytes = o.chunkBytes ?? 256 * 1024;
  }

  async write(record: unknown): Promise<void> {
    if (this.closed) throw new Error("PartitionWriter is closed");
    const line = JSON.stringify(record) + "\n";
    this.lines.push(line);
    this.pendingBytes += Buffer.byteLength(line);
    this.pendingRecords += 1;
    if (this.pendingBytes >= this.chunkBytes) await this.flush();
  }

  private async flush(): Promise<void> {
    if (this.pendingRecords === 0) return;
    const member = gzipSync(Buffer.from(this.lines.join("")));
    const records = this.pendingRecords;
    this.lines = [];
    this.pendingBytes = 0;
    this.pendingRecords = 0;

    if (this.current && this.current.info.bytes + member.length > this.maxBytes) this.finishPart();
    if (!this.current) {
      await mkdir(this.dir, { recursive: true });
      const n = String(this.done.length + 1).padStart(4, "0");
      const file = `${this.prefix}-${n}.ndjson.gz`;
      this.current = { info: { file, records: 0, bytes: 0, sha256: "" }, hash: createHash("sha256") };
      await writeFile(join(this.dir, file), member);
    } else {
      await appendFile(join(this.dir, this.current.info.file), member);
    }
    this.current.hash.update(member);
    this.current.info.bytes += member.length;
    this.current.info.records += records;
  }

  private finishPart(): void {
    if (!this.current) return;
    this.current.info.sha256 = this.current.hash.digest("hex");
    this.done.push(this.current.info);
    this.current = null;
  }

  /** Flushes, writes manifest.json and returns it. */
  async close(): Promise<Manifest> {
    if (this.closed) throw new Error("PartitionWriter is closed");
    await this.flush();
    this.finishPart();
    this.closed = true;
    await mkdir(this.dir, { recursive: true });
    const manifest: Manifest = {
      maxBytes: this.maxBytes,
      totalRecords: this.done.reduce((a, p) => a + p.records, 0),
      parts: this.done,
    };
    await writeFile(join(this.dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    return manifest;
  }
}
