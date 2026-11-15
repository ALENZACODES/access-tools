// @vitest-environment node
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";
import { expect, it } from "vitest";
import { writePartitions } from "../src/io.js";
import { mapRow } from "../src/map.js";
import { sourceById } from "../src/sources.js";
import type { ImportedRecord } from "../src/types.js";

it("writes compressed partitions with checksums, manifest and roll-before-overflow", async () => {
  const dir = await mkdtemp(join(tmpdir(), "toronto-import-"));
  try {
    const source = sourceById("toronto-pops");
    const records: ImportedRecord[] = Array.from({ length: 5 }, (_, i) => mapRow({ _id: i, Location: `Demo Plaza ${i}`, geometry: JSON.stringify({ type: "Point", coordinates: [-79.4, 43.7] }) }, source, "2026-11-10", "2026-11-15")!);
    const one = gzipSync(`${JSON.stringify(records[0])}\n`).length;
    const two = gzipSync(`${JSON.stringify(records[0])}\n${JSON.stringify(records[1])}\n`).length;
    expect(two).toBeGreaterThan(one);
    async function* stream() { for (const record of records) yield record; }
    const parts = await writePartitions(stream(), dir, one + 20);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.reduce((total, part) => total + part.count, 0)).toBe(5);
    for (const part of parts) {
      const bytes = await readFile(join(dir, part.file));
      expect(bytes.length).toBeLessThanOrEqual(one + 20);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(part.sha256);
      expect(gunzipSync(bytes).toString().trim().split("\n")).toHaveLength(part.count);
    }
    expect(JSON.parse(await readFile(join(dir, "manifest.json"), "utf8"))).toEqual({ parts });
  } finally { await rm(dir, { recursive: true, force: true }); }
});
