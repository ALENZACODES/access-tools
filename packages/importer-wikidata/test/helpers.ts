/// <reference types="node" />
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { bindingsOf, mapBindings, newStats } from "../src/mapper";
import { WIKIDATA_P2846_ONTARIO } from "../src/sources";
import type { Binding, ImportedRecord, SparqlResult } from "../src/types";

export function fixture(name: string): SparqlResult {
  return JSON.parse(readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), "utf8")) as SparqlResult;
}

export async function* from<T>(items: T[]): AsyncGenerator<T> {
  for (const i of items) yield i;
}

export const DATE = "2026-11-15";

export async function mapAll(bindings: Binding[]) {
  const stats = newStats();
  const records: ImportedRecord[] = [];
  for await (const r of mapBindings(from(bindings), { source: WIKIDATA_P2846_ONTARIO, retrievedAt: DATE }, stats)) records.push(r);
  return { records, stats };
}

export async function mapFixture(name: string) {
  const all: Binding[] = [];
  for await (const b of bindingsOf(fixture(name))) all.push(b);
  return mapAll(all);
}

export const uri = (qid: string) => ({ type: "uri", value: `http://www.wikidata.org/entity/${qid}` });
