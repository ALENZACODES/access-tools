/// <reference types="node" />
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createCounters, importPspc } from "#src/map";
import { PSPC_SOURCE_ID, SOURCES } from "#src/sources";
import type { ImportedRecord } from "#src/types";

export const fixture = (name: string): string =>
  readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), "utf8");

export async function* linesOf(text: string): AsyncGenerator<string> {
  for (const l of text.split("\n")) yield l;
}

export const source = SOURCES.find((s) => s.id === PSPC_SOURCE_ID)!;
export const RUN_DATE = "2026-11-15";

export async function run(text: string) {
  const counters = createCounters();
  const records: ImportedRecord[] = [];
  for await (const r of importPspc(linesOf(text), { source, retrievedAt: RUN_DATE, counters })) records.push(r);
  return { records, counters };
}
