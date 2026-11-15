// @vitest-environment node
import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { afterEach, describe, expect, it } from "vitest";
import { linesFromFile, writeGated, writePartitions } from "#src/io";
import { createCounters, importPspc } from "#src/map";
import type { SourceDef } from "#src/sources";
import type { ImportedRecord } from "#src/types";
import { fixture, run, RUN_DATE, source } from "./helpers";

const dirs: string[] = [];
const tmp = async () => {
  const d = await mkdtemp(join(tmpdir(), "pspc-"));
  dirs.push(d);
  return d;
};
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

async function* of(records: ImportedRecord[]) {
  for (const r of records) yield r;
}

describe("partition writer", () => {
  it("writes one gzip NDJSON part and a manifest with sha256", async () => {
    const { records } = await run(fixture("pspc-ontario-sample.csv"));
    const dir = await tmp();
    const m = await writePartitions(of(records), dir, { prefix: "p" });
    expect(m.parts).toHaveLength(1);
    expect(m.totalRecords).toBe(4);
    const buf = await readFile(join(dir, m.parts[0]!.file));
    expect(m.parts[0]!.bytes).toBe(buf.length);
    expect(m.parts[0]!.sha256).toBe(createHash("sha256").update(buf).digest("hex"));
    const lines = gunzipSync(buf).toString("utf8").trim().split("\n");
    expect(lines.map((l) => JSON.parse(l).id)).toEqual(records.map((r) => r.id));
    expect(JSON.parse(await readFile(join(dir, "manifest.json"), "utf8"))).toEqual(m);
  });

  it("rolls to a new part before exceeding a tiny maxBytes", async () => {
    const { records } = await run(fixture("pspc-ontario-sample.csv"));
    const dir = await tmp();
    const m = await writePartitions(of(records), dir, { prefix: "p", maxBytes: 1500 });
    expect(m.parts.length).toBeGreaterThan(1);
    expect(m.totalRecords).toBe(4);
    for (const p of m.parts) {
      const buf = await readFile(join(dir, p.file));
      expect(buf.length).toBe(p.bytes);
      expect(p.bytes).toBeLessThanOrEqual(1500);
      expect(gunzipSync(buf).toString("utf8").trim().split("\n")).toHaveLength(p.records);
    }
    expect(m.parts.map((p) => p.file)).toEqual(m.parts.map((_p, i) => `p-00${i + 1}.ndjson.gz`));
    const ids = (await Promise.all(m.parts.map(async (p) => gunzipSync(await readFile(join(dir, p.file))).toString("utf8").trim().split("\n").map((l) => JSON.parse(l).id)))).flat();
    expect(ids).toEqual(records.map((r) => r.id));
  });

  it("gives an oversized single record its own part", async () => {
    const { records } = await run(fixture("pspc-ontario-sample.csv"));
    const m = await writePartitions(of(records.slice(0, 2)), await tmp(), { prefix: "p", maxBytes: 10 });
    expect(m.parts.map((p) => p.records)).toEqual([1, 1]);
  });

  it("writes an empty manifest for no records", async () => {
    const dir = await tmp();
    const m = await writePartitions(of([]), dir, { prefix: "p" });
    expect(m).toEqual({ parts: [], totalRecords: 0 });
    expect(await readdir(dir)).toEqual(["manifest.json"]);
  });
});

describe("licence gate before writing", () => {
  const restricted: SourceDef = { ...source, licenceStatus: "restricted" };
  it("refuses without a licence record and writes nothing", async () => {
    const dir = await tmp();
    await expect(writeGated(restricted, of([]), dir, { prefix: "p" })).rejects.toThrow(/Licence gate/);
    expect(await readdir(dir)).toEqual([]);
  });
  it("with a licence record reports held and writes nothing", async () => {
    const dir = await tmp();
    const r = await writeGated(restricted, of([]), dir, { prefix: "p" }, { checkedOn: RUN_DATE, urlRead: "https://example.invalid/l", result: "unclear" });
    expect(r).toEqual({ held: true, manifest: null });
    expect(await readdir(dir)).toEqual([]);
  });
  it("writes for an open source", async () => {
    const { records } = await run(fixture("pspc-ontario-sample.csv"));
    const r = await writeGated(source, of(records), await tmp(), { prefix: "p" });
    expect(r.held).toBe(false);
    expect(r.manifest!.totalRecords).toBe(4);
  });
});

describe("file reader", () => {
  it("streams the fixture file end to end", async () => {
    const counters = createCounters();
    const path = new URL("./fixtures/pspc-ontario-sample.csv", import.meta.url);
    let n = 0;
    for await (const _ of importPspc(linesFromFile(path.pathname), { source, retrievedAt: RUN_DATE, counters })) n++;
    expect(n).toBe(4);
  });
});
