/// <reference types="node" />
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
// @ts-expect-error TS5097: explicit .ts extension is required by node --experimental-strip-types
import { ACCEPT, ENDPOINT, SPARQL_QUERY, USER_AGENT } from "./query.ts";
// @ts-expect-error TS5097: explicit .ts extension is required by node --experimental-strip-types
import { PartitionWriter, DEFAULT_MAX_BYTES } from "./io.ts";
// @ts-expect-error TS5097: explicit .ts extension is required by node --experimental-strip-types
import { importResult } from "./importer.ts";
// @ts-expect-error TS5097: explicit .ts extension is required by node --experimental-strip-types
import { buildReport } from "./report.ts";
// @ts-expect-error TS5097: explicit .ts extension is required by node --experimental-strip-types
import { validateReport } from "./schema.ts";
// @ts-expect-error TS5097: explicit .ts extension is required by node --experimental-strip-types
import { WIKIDATA_P2846_ONTARIO } from "./sources.ts";
import type { SparqlResult } from "./types";

const USAGE = `Usage: npm run import -w @access-tools/importer-wikidata -- [--input result.json] [--out out] [--date YYYY-MM-DD] [--max-bytes N]
Without --input the query is POSTed to ${ENDPOINT}. If --date is omitted, retrievedAt defaults to the UTC date (YYYY-MM-DD).`;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function fetchResult(): Promise<SparqlResult> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Accept: ACCEPT, "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
    body: new URLSearchParams({ query: SPARQL_QUERY }),
  });
  if (!res.ok) throw new Error(`Wikidata query service answered ${res.status}`);
  return (await res.json()) as SparqlResult;
}

async function main(): Promise<void> {
  if (process.argv.includes("--help")) {
    console.log(USAGE);
    return;
  }
  const source = WIKIDATA_P2846_ONTARIO;
  const input = arg("--input");
  const out = arg("--out") ?? "out";
  // Default retrievedAt is the UTC date (YYYY-MM-DD).
  const date = arg("--date") ?? new Date().toISOString().slice(0, 10);
  const maxBytes = Number(arg("--max-bytes") ?? DEFAULT_MAX_BYTES);

  const result: SparqlResult = input ? (JSON.parse(await readFile(input, "utf8")) as SparqlResult) : await fetchResult();
  const writer = new PartitionWriter({ dir: out, prefix: source.id, maxBytes });
  const run = await importResult(result, { source, retrievedAt: date, sink: (r) => writer.write(r) });
  const manifest = await writer.close();

  const report = buildReport({
    source,
    stats: run.stats,
    emitted: run.emitted,
    unknownFieldCount: run.unknownFieldCount,
    retrievedAt: date,
    held: run.held,
    partitions: manifest.parts,
  });
  const check = validateReport(report);
  if (!check.ok) throw new Error(`Report failed schema validation: ${check.errors.join("; ")}`);
  await mkdir(out, { recursive: true });
  await writeFile(join(out, "report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(report.summary.en);
  console.log(report.summary.fr);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
