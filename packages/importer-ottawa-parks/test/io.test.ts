// @vitest-environment node
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { expect, it } from "vitest";
import benches from "./fixtures/layer-28.json";
import { writePartitions, writeReport } from "../src/io.js";
import { mapFeature } from "../src/mapping.js";
import { layers, source } from "../src/sources.js";
import { validateReport } from "../src/schema.js";
import type { ArcPage, LayerMetadata } from "../src/types.js";

it("rolls before exceeding compressed bytes, hashes each part, and writes a manifest", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ottawa-parks-"));
  const fixture = benches as LayerMetadata & { page: ArcPage };
  const record = mapFeature(fixture.page.features[0]!, 28, layers.find(([id]) => id === 28)![1], fixture, "2026-11-15")!;
  async function* records() { yield record; yield record; yield record; }
  try {
    const parts = await writePartitions(records(), directory, 1000);
    expect(parts.length).toBeGreaterThan(1);
    let lineCount = 0;
    for (const part of parts) {
      const bytes = await readFile(join(directory, part.file));
      expect(bytes.length).toBe(part.bytes);
      expect(part.bytes).toBeLessThanOrEqual(1000);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(part.sha256);
      const lines = gunzipSync(bytes).toString("utf8").trim().split("\n");
      lineCount += lines.length;
      for (const line of lines) expect(JSON.parse(line).id).toBe(record.id);
    }
    expect(lineCount).toBe(3);
    const manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8"));
    expect(manifest.partitions).toEqual(parts);
    const report = { sourceId: source.id, read: 3, emitted: 3, rejected: {},
      unknownFieldCount: { cityAccessibleFlag: 0 }, heldByLicence: true,
      retrievedAt: "2026-11-15", partitions: parts, coverageClaim: false as const,
      summary: { en: "Not coverage", fr: "Pas une couverture" } };
    expect(validateReport(report)).toBe(true);
    await writeReport(directory, report);
    expect((await readdir(directory))).toContain("report.json");
  } finally { await rm(directory, { recursive: true, force: true }); }
});
