/// <reference types="node" />
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { DEFAULT_MAX_BYTES, linesFromFile, linesFromStream, writeGated } from "#src/io";
import { buildReport, createCounters, importPspc } from "#src/map";
import { validateReport } from "#src/schema";
import { PSPC_SOURCE_ID, SOURCES } from "#src/sources";

const USER_AGENT = "importer-pspc/0.1 (open-data import for an accessibility directory; attribution is not endorsement)";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const source = SOURCES.find((s) => s.id === PSPC_SOURCE_ID);
  if (!source) throw new Error("source not registered");
  const outDir = arg("out") ?? "out";
  const file = arg("file");
  // Default retrievedAt is the UTC date (YYYY-MM-DD).
  const retrievedAt = arg("date") ?? new Date().toISOString().slice(0, 10);
  const maxBytes = Number(arg("max-bytes") ?? DEFAULT_MAX_BYTES);

  let lines: AsyncIterable<string>;
  if (file) lines = linesFromFile(file);
  else {
    const res = await fetch(source.downloadUrl, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok || !res.body) throw new Error(`download failed: HTTP ${res.status}`);
    lines = linesFromStream(Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]));
  }

  const counters = createCounters();
  const records = importPspc(lines, { source, retrievedAt, counters });
  const { held, manifest } = await writeGated(source, records, outDir, { prefix: "pspc-building-accessibility", maxBytes });
  const report = buildReport(source, counters, { retrievedAt, held, partitions: manifest?.parts ?? [] });
  const errors = validateReport(report);
  if (errors.length) throw new Error(`report failed schema validation: ${errors.join("; ")}`);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(report.summary.en);
  console.log(report.summary.fr);
  console.log(report.notice.en);
  console.log(source.attribution);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
