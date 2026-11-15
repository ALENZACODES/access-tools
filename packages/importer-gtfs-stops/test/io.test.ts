// @vitest-environment node
import { expect, it } from "vitest";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateRawSync, gunzipSync, gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { extractGtfs } from "../src/zip.js";
import { blankReport, importStops } from "../src/importer.js";
import { sourceById } from "../src/sources.js";
import { textLines } from "../src/csv.js";
import { writePartitions } from "../src/io.js";
import type { ImportedRecord } from "../src/types.js";

function tinyZip(files: Array<{ name: string; body: string; method: 0 | 8 }>): Buffer {
  const locals: Buffer[] = [], centers: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name);
    const body = Buffer.from(file.body);
    const packed = file.method === 8 ? deflateRawSync(body) : body;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(file.method, 8);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(body.length, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, packed);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(file.method, 10);
    central.writeUInt32LE(packed.length, 20);
    central.writeUInt32LE(body.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centers.push(central, name);
    offset += local.length + name.length + packed.length;
  }
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(Buffer.concat(centers).length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centers, end]);
}
it.each([0, 8] as const)("reads only GTFS entries in method %i ZIP", (method) => {
  const archive = tinyZip([
    { name: "other.txt", body: "ignored", method },
    { name: "stops.txt", body: "stop_id,stop_name\na,Demo", method },
    { name: "feed_info.txt", body: "feed_start_date\n20261115", method },
  ]);
  expect(extractGtfs(archive)).toEqual({ stops: "stop_id,stop_name\na,Demo", feedInfo: "feed_start_date\n20261115" });
  expect(() => extractGtfs(tinyZip([{ name: "other.txt", body: "", method }]))).toThrow("stops.txt missing");
});
it("writes bounded gzip NDJSON partitions, sha256 and manifest", async () => {
  const dir = await mkdtemp(join(tmpdir(), "gtfs-parts-"));
  try {
    const source = sourceById("gtfs-kingston-transit");
    const report = blankReport(source, "2026-11-15", false);
    const input = "stop_id,stop_name,stop_lat,stop_lon,wheelchair_boarding\n" +
      Array.from({ length: 8 }, (_, i) => `${i},Demo Stop ${i},43,-79,${i % 3}`).join("\n");
    const collected: ImportedRecord[] = [];
    for await (const record of importStops(textLines(input), source, { runDate: "2026-11-15", report })) {
      collected.push(record);
    }
    const one = gzipSync(`${JSON.stringify(collected[0])}\n`, { mtime: 0 } as never).length;
    const cap = one + 32;
    async function* replay() { yield* collected; }
    const parts = await writePartitions(replay(), dir, { maxBytes: cap });
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.reduce((sum, part) => sum + part.count, 0)).toBe(8);
    for (const part of parts) {
      const bytes = await readFile(join(dir, part.file));
      expect(bytes.length).toBe(part.bytes);
      expect(bytes.length).toBeLessThanOrEqual(cap);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(part.sha256);
      expect(gunzipSync(bytes).toString().trim().split("\n")).toHaveLength(part.count);
    }
    expect(JSON.parse(await readFile(join(dir, "manifest.json"), "utf8"))).toEqual({ partitions: parts });
    expect((await readdir(dir)).length).toBe(parts.length + 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
