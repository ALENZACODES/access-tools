/// <reference types="node" />
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import type { PartInfo } from "./report.js";

/** Concatenated gzip members form a valid gzip stream; each member holds one NDJSON row. */
export class PartitionWriter {
  readonly partitions: PartInfo[] = [];
  private chunks: Buffer[] = [];
  private count = 0;
  private bytes = 0;
  private part = 0;
  constructor(private readonly directory: string, private readonly maxBytes = 20 * 1024 * 1024) {
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 20 * 1024 * 1024) {
      throw new Error("maxBytes must be between 1 and 20971520");
    }
  }
  async write(record: unknown): Promise<void> {
    const chunk = gzipSync(Buffer.from(`${JSON.stringify(record)}\n`, "utf8"));
    if (chunk.length > this.maxBytes) throw new Error("single compressed record exceeds maxBytes");
    if (this.count && this.bytes + chunk.length > this.maxBytes) await this.flush();
    this.chunks.push(chunk);
    this.bytes += chunk.length;
    this.count++;
  }
  private async flush(): Promise<void> {
    if (!this.count) return;
    await mkdir(this.directory, { recursive: true });
    const filename = `part-${String(++this.part).padStart(5, "0")}.ndjson.gz`;
    const content = Buffer.concat(this.chunks, this.bytes);
    await writeFile(join(this.directory, filename), content);
    this.partitions.push({ file: filename, count: this.count, bytes: content.length,
      sha256: createHash("sha256").update(content).digest("hex") });
    this.chunks = [];
    this.bytes = 0;
    this.count = 0;
  }
  async close(): Promise<PartInfo[]> {
    await this.flush();
    await mkdir(this.directory, { recursive: true });
    await writeFile(join(this.directory, "manifest.json"), JSON.stringify({ partitions: this.partitions }, null, 2) + "\n");
    return this.partitions;
  }
}
