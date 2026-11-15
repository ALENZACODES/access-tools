/// <reference types="node" />
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { featurePages, layerMetadata } from "./arcgis.ts";
import { catalog } from "./catalog.ts";
import { writePartitions, writeReport } from "./io.ts";
import { mapPages } from "./mapping.ts";
import { validateRecord, validateReport } from "./schema.ts";
import { layers, source } from "./sources.ts";
import type { ImportedRecord, ImportReport, LicenceRecord } from "./types.ts";

export function licenceApproved(record: LicenceRecord | null): boolean {
  return !!record && /^\d{4}-\d{2}-\d{2}$/.test(record.checkedOn) &&
    Number.isFinite(Date.parse(record.checkedOn)) &&
    /^https:\/\//.test(record.urlRead) &&
    (record.result === "open" || record.result === "open-recorded");
}

export async function runImport(options: {
  outputDirectory?: string;
  licenceRecord?: LicenceRecord | null;
  fetcher?: typeof fetch;
  retrievedAt?: string;
  maxBytes?: number;
} = {}): Promise<ImportReport> {
  const retrievedAt = options.retrievedAt ?? new Date().toISOString().slice(0, 10);
  const held = !licenceApproved(options.licenceRecord ?? null);
  const directory = resolve(options.outputDirectory ?? "out", held ? "held" : "approved");
  const report: ImportReport = {
    sourceId: source.id, read: 0, emitted: 0, rejected: {},
    unknownFieldCount: { cityAccessibleFlag: 0, stepFree: 0, washroom: 0, entrance: 0 },
    heldByLicence: held, retrievedAt, partitions: [], coverageClaim: false,
    summary: { en: catalog.en.summary + (held ? ` ${catalog.en.held}` : ""),
      fr: catalog.fr.summary + (held ? ` ${catalog.fr.held}` : "") },
  };
  async function* records(): AsyncGenerator<ImportedRecord> {
    for (const [id, name] of layers) {
      const metadata = await layerMetadata(id, options.fetcher);
      const fields = metadata.fields.map((field) => field.name);
      const flagField = id === 5 ? "PR_Park_Buildings_Info.ACCESSIBLE" : "ACCESSIBLE";
      if (!fields.includes(flagField)) throw new Error(`Layer ${id} lacks ${flagField}`);
      const objectIdField = metadata.objectIdField ?? metadata.objectIdFieldName ?? "OBJECTID";
      if (!fields.includes(objectIdField)) throw new Error(`Layer ${id} lacks ${objectIdField}`);
      const pages = featurePages(id, options.fetcher, source.apiUrl, 2000, objectIdField);
      for await (const record of mapPages(pages, id, name, metadata, retrievedAt, (accepted, mapped) => {
        report.read++;
        if (!accepted) report.rejected["missing-object-id"] = (report.rejected["missing-object-id"] ?? 0) + 1;
        if (mapped) for (const [key, fact] of Object.entries(mapped.facts)) {
          if (fact.value === null) report.unknownFieldCount[key] = (report.unknownFieldCount[key] ?? 0) + 1;
        }
      })) {
        if (!validateRecord(record)) {
          report.rejected["schema-invalid"] = (report.rejected["schema-invalid"] ?? 0) + 1;
          continue;
        }
        report.emitted++;
        yield record;
      }
    }
  }
  report.partitions = await writePartitions(records(), directory, options.maxBytes);
  if (!validateReport(report)) throw new Error(`Invalid report: ${JSON.stringify(validateReport.errors)}`);
  await writeReport(directory, report);
  return report;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const recordIndex = args.indexOf("--licence-record");
  const path = recordIndex >= 0 ? args[recordIndex + 1] : undefined;
  if (recordIndex >= 0 && !path) throw new Error("--licence-record requires a JSON file");
  const licenceRecord = path ? JSON.parse(await readFile(path, "utf8")) as LicenceRecord : null;
  const report = await runImport({ licenceRecord });
  process.stdout.write(`${report.summary.en}\n${report.summary.fr}\n`);
}

// Do not launch a network request merely by importing this module in tests.
if (process.argv[1] && /(?:^|[/\\])cli\.ts$/.test(process.argv[1])) {
  main().catch((error: unknown) => { process.stderr.write(`${String(error)}\n`); process.exitCode = 1; });
}
