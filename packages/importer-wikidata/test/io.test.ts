// @vitest-environment node
/// <reference types="node" />
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { afterEach, describe, expect, it } from "vitest";
import { PartitionWriter } from "../src/io";
import type { Manifest } from "../src/types";

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), "wd-"));
  dirs.push(d);
  return d;
};

const rec = (i: number) => ({ id: `x:Q${i}`, pad: `${i}-${Math.random().toString(36).slice(2)}-${"abcdefghij".repeat(5)}` });

describe("PartitionWriter", () => {
  it("rolls to a new part before maxBytes and writes a manifest with sha256", async () => {
    const dir = tmp();
    const maxBytes = 600;
    const w = new PartitionWriter({ dir, prefix: "demo", maxBytes, chunkBytes: 1 });
    const written = Array.from({ length: 20 }, (_, i) => rec(i + 1));
    for (const r of written) await w.write(r);
    const manifest = await w.close();

    expect(manifest.parts.length).toBeGreaterThan(1);
    expect(manifest.totalRecords).toBe(20);
    const onDisk = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as Manifest;
    expect(onDisk).toEqual(manifest);

    const back: unknown[] = [];
    for (const p of manifest.parts) {
      const bytes = readFileSync(join(dir, p.file));
      expect(p.bytes).toBe(bytes.length);
      expect(p.bytes).toBeLessThanOrEqual(maxBytes);
      expect(p.sha256).toBe(createHash("sha256").update(bytes).digest("hex"));
      const lines = gunzipSync(bytes).toString("utf8").trimEnd().split("\n");
      expect(lines).toHaveLength(p.records);
      back.push(...lines.map((l) => JSON.parse(l)));
    }
    expect(back).toEqual(written);
    expect(readdirSync(dir).sort()).toEqual([...manifest.parts.map((p) => p.file), "manifest.json"].sort());
  });

  it("writes a single part when everything fits", async () => {
    const dir = tmp();
    const w = new PartitionWriter({ dir, prefix: "demo" });
    for (let i = 1; i <= 5; i++) await w.write(rec(i));
    const m = await w.close();
    expect(m.parts).toHaveLength(1);
    expect(m.parts[0]?.file).toBe("demo-0001.ndjson.gz");
    expect(m.parts[0]?.records).toBe(5);
    expect(statSync(join(dir, "demo-0001.ndjson.gz")).size).toBe(m.parts[0]?.bytes);
  });

  it("writes an empty manifest when nothing was written, and refuses writes after close", async () => {
    const dir = tmp();
    const w = new PartitionWriter({ dir, prefix: "demo" });
    expect(await w.close()).toMatchObject({ totalRecords: 0, parts: [] });
    await expect(w.write({})).rejects.toThrow(/closed/);
  });

  it("gives an oversized single member its own part", async () => {
    const dir = tmp();
    const w = new PartitionWriter({ dir, prefix: "demo", maxBytes: 10, chunkBytes: 1 });
    await w.write(rec(1));
    await w.write(rec(2));
    const m = await w.close();
    expect(m.parts.map((p) => p.records)).toEqual([1, 1]);
  });
});
