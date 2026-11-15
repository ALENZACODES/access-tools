/// <reference types="node" />
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { apiPages, parsePages } from "./reader.js";
import { SOURCES, sourceById } from "./sources.js";
import { countRecord, finishReport, licenceAllowed, newReport, reject } from "./report.js";
import type { LicenceRecord } from "./report.js";
import { validateImportReport } from "./schema.js";
import { PartitionWriter } from "./io.js";

const USER_AGENT = "access-tools-parking-import/0.1 (municipal open data; respectful pagination)";
async function fetchPage(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${new URL(url).origin}`);
  return response.json() as Promise<unknown>;
}
async function run(): Promise<void> {
  const ids = process.argv[2] ? [sourceById(process.argv[2])] : SOURCES;
  const licenceFile = process.argv[3];
  const records: Record<string, LicenceRecord> = licenceFile ? JSON.parse(await readFile(licenceFile, "utf8")) as Record<string, LicenceRecord> : {};
  const day = new Date().toISOString().slice(0, 10);
  const base = join(import.meta.dirname, "..", "out");
  for (const source of ids) {
    const allowed = licenceAllowed(source, records[source.id]);
    const directory = join(base, allowed ? "parts" : "held", source.id);
    const report = newReport(source, day, !allowed);
    if (allowed) {
      const writer = new PartitionWriter(directory);
      for await (const event of parsePages(source, apiPages(source, fetchPage), day)) {
        if (event.rejection) { reject(report, event.rejection.reason); continue; }
        if (event.record && countRecord(report, event.record)) await writer.write(event.record);
      }
      report.partitions = await writer.close();
    }
    finishReport(report, source);
    if (!validateImportReport(report)) throw new Error(`Invalid report: ${JSON.stringify(validateImportReport.errors)}`);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, "report.json"), JSON.stringify(report, null, 2) + "\n");
    process.stdout.write(`${report.summary.en}\n${report.summary.fr}\n${report.heldByLicence ? "HELD" : "WRITTEN"}\n`);
  }
}
void run().catch((error: unknown) => { process.stderr.write(`${String(error)}\n`); process.exitCode = 1; });
