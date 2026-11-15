/// <reference types="node" />
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
// @ts-ignore Node strip-types uses TypeScript source paths
import { arcgisPages, ckanPages } from "./readers.ts";
// @ts-ignore Node strip-types uses TypeScript source paths
import { mapFeature } from "./mapping.ts";
// @ts-ignore Node strip-types uses TypeScript source paths
import { SOURCES, sourceById } from "./sources.ts";
// @ts-ignore Node strip-types uses TypeScript source paths
import { FACT_KEYS } from "./types.ts";
// @ts-ignore Node strip-types uses TypeScript source paths
import type { ImportReport, ImportedRecord, LicenceRecord } from "./types.ts";
// @ts-ignore Node strip-types uses TypeScript source paths
import { validateRecord, validateReport } from "./schema.ts";
// @ts-ignore Node strip-types uses TypeScript source paths
import { writePartitions } from "./io.ts";

export async function run(sourceId: string, root: string, licenceRecord?: LicenceRecord): Promise<ImportReport> {
  const source = sourceById(sourceId);
  const date = new Date().toISOString().slice(0, 10);
  const approved = source.licenceStatus === "open" || Boolean(licenceRecord?.result === "approved" && /^\d{4}-\d{2}-\d{2}$/.test(licenceRecord.checkedOn) && /^https:\/\//.test(licenceRecord.urlRead));
  const report: ImportReport = {
    sourceId, read: 0, emitted: 0, rejected: {}, unknownFieldCount: Object.fromEntries(FACT_KEYS.map((key) => [key, 0])) as ImportReport["unknownFieldCount"], heldByLicence: !approved, retrievedAt: date, parts: [], coverageClaim: false,
    summary: { en: `${source.name.en}: counts are not a coverage claim.`, fr: `${source.name.fr} : les totaux ne constituent pas une mesure de couverture.` },
  };
  const directory = join(root, approved ? source.licenceStatus : "held", sourceId);
  await mkdir(directory, { recursive: true });
  if (approved) {
    const fetchJson = async (url: string): Promise<unknown> => {
      const response = await fetch(url, { headers: { "User-Agent": "access-tools-sidewalk-importer/0.1 (+https://github.com/ALENZACODES/access-tools)" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${source.id}`);
      return response.json() as Promise<unknown>;
    };
    const pages = source.reader === "arcgis" ? arcgisPages(source, fetchJson) : ckanPages(source, fetchJson);
    async function* normalized(): AsyncGenerator<ImportedRecord> {
      for await (const feature of pages) {
        report.read += 1;
        try {
          const record = mapFeature(source, feature, date);
          if (!validateRecord(record)) throw new Error("schema-invalid");
          report.emitted += 1;
          for (const key of FACT_KEYS) if (record.facts[key].value === null) report.unknownFieldCount[key] += 1;
          yield record;
        } catch (error) {
          const reason = error instanceof Error ? error.message : "unknown-error";
          report.rejected[reason] = (report.rejected[reason] ?? 0) + 1;
        }
      }
    }
    report.parts = await writePartitions(normalized(), directory);
  }
  if (!validateReport(report)) throw new Error(`invalid report ${JSON.stringify(validateReport.errors)}`);
  await writeFile(join(directory, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}
async function main(): Promise<void> {
  const [id, root = "out", licencePath] = process.argv.slice(2);
  if (!id) throw new Error(`Usage: npm run import -- <source-id|all> [output-directory] [licence-record.json]`);
  const record = licencePath ? JSON.parse(await readFile(licencePath, "utf8")) as LicenceRecord : undefined;
  const sources = id === "all" ? SOURCES : [sourceById(id)];
  const reports: ImportReport[] = [];
  for (const source of sources) reports.push(await run(source.id, root, record));
  await writeFile(join(root, "index.json"), `${JSON.stringify({ retrievedAt: new Date().toISOString().slice(0, 10), sources: reports.map((r) => ({ sourceId: r.sourceId, heldByLicence: r.heldByLicence, emitted: r.emitted, report: `${r.heldByLicence ? "held" : sourceById(r.sourceId).licenceStatus}/${r.sourceId}/report.json` })) }, null, 2)}\n`);
}
if (process.argv[1]?.endsWith("cli.ts")) main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
