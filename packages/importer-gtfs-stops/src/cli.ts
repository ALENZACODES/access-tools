/// <reference types="node" />
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { extractGtfs } from "./zip.js";
import { csvRows, textLines } from "./csv.js";
import { sourceById } from "./sources.js";
import { blankReport, importStops, licenceHeld } from "./importer.js";
import { writePartitions } from "./io.js";
import { validateReport } from "./schema.js";
import type { LicenceRecord } from "./types.js";

async function main(): Promise<void> {
  const [id, input, licencePath] = process.argv.slice(2);
  if (!id || !input) throw new Error("Usage: npm run import -- <source-id> <local.zip|zip-url> [licence-record.json]");
  const source = sourceById(id);
  const licence: LicenceRecord | undefined = licencePath ? JSON.parse(await readFile(licencePath, "utf8")) as LicenceRecord : undefined;
  const held = licenceHeld(source, licence);
  // Default retrievedAt is the UTC date (YYYY-MM-DD).
  const date = new Date().toISOString().slice(0, 10);
  const report = blankReport(source, date, held);
  // Discovery/catalogue pages are not ZIP downloads: require an explicit ZIP input.
  const buffer = /^https?:\/\//.test(input) ? await (async () => {
    const response = await fetch(input, { headers: { "User-Agent": "access-tools-gtfs-importer/0.1 (research; no endorsement)" } });
    if (!response.ok) throw new Error(`GTFS HTTP ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  })() : await readFile(input);
  const { stops, feedInfo } = extractGtfs(buffer);
  let sourceDate: string | undefined;
  if (feedInfo) {
    for await (const row of csvRows(textLines(feedInfo))) {
      if (/^\d{8}$/.test(row.feed_start_date ?? "")) {
        sourceDate = row.feed_start_date!.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");
      }
      break;
    }
  }
  const directory = resolve("packages/importer-gtfs-stops/out", held ? "held" : "open", id);
  await mkdir(directory, { recursive: true });
  const records = importStops(textLines(stops), source, { sourceDate, runDate: date, licenceRecord: licence, report });
  report.partitions = await writePartitions(records, directory);
  if (!sourceDate) report.sourceDateNote = "feed has no feed_info";
  if (!validateReport(report)) throw new Error(`Invalid report: ${JSON.stringify(validateReport.errors)}`);
  await writeFile(resolve(directory, "report.json"), JSON.stringify(report, null, 2) + "\n");
  process.stdout.write(`${report.summary.en}\n${report.summary.fr}\n${directory}\n`);
}
main().catch((error: unknown) => { process.stderr.write(`${String(error)}\n`); process.exitCode = 1; });
