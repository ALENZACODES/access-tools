/// <reference types="node" />
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { datastorePages, findResources, type JsonFetch } from "./ckan.js";
import { finishReport, importPages, licenceAllowed, newReport } from "./importer.js";
import { writePartitions } from "./io.js";
import { SOURCES, sourceById } from "./sources.js";
import type { LicenceRecord } from "./types.js";

const args = process.argv.slice(2);
if (args.length < 1 || args.length > 2) throw new Error("Usage: npm run import -- <source-id|all> [licence-record.json]");
const selected = args[0] === "all" ? SOURCES : [sourceById(args[0] ?? "")];
const approval = args[1] ? JSON.parse(await readFile(args[1], "utf8")) as LicenceRecord : undefined;
const fetchJson: JsonFetch = async (url) => {
  const response = await fetch(url, { headers: { "User-Agent": "access-tools-toronto-importer/0.1 (open-data research)" } });
  if (!response.ok) throw new Error(`CKAN HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
};
const root = fileURLToPath(new URL("../out/", import.meta.url));
for (const source of selected) {
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const report = newReport(source, retrievedAt);
  const directory = join(root, source.id);
  if (!licenceAllowed(source, approval)) {
    report.heldByLicence = true;
    report.rejected["licence-held"] = 0;
    // Report only: no partitions, CKAN calls or release assets for unapproved sources.
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, "report.json"), JSON.stringify(finishReport(report), null, 2) + "\n");
    continue;
  }
  const resources = await findResources(source, fetchJson);
  async function* rows() {
    for (const resource of resources) {
      const pages = datastorePages(source.apiUrl, resource.id, fetchJson);
      yield* importPages(pages, source, resource.sourceDate, report, approval);
    }
  }
  report.partitions = await writePartitions(rows(), directory);
  await writeFile(join(directory, "report.json"), JSON.stringify(finishReport(report), null, 2) + "\n");
}
