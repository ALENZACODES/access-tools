import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import schema from "./schema/paratransit-entry.schema.json" with { type: "json" };
import type { ParatransitEntry } from "./types.js";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

export function paratransitErrors(entry: unknown): string[] {
  if (validate(entry)) return [];
  return (validate.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`);
}

export function assertParatransit(entries: readonly ParatransitEntry[]): void {
  const ids = new Set<string>();
  for (const entry of entries) {
    const errors = paratransitErrors(entry);
    if (errors.length > 0) throw new Error(`${entry.id}: ${errors.join("; ")}`);
    if (!entry.sourceUrl || !entry.retrievedOn || !entry.verificationTier) {
      throw new Error(`${entry.id}: missing source, date, or tier`);
    }
    if (ids.has(entry.id)) throw new Error(`Duplicate paratransit id ${entry.id}`);
    ids.add(entry.id);
  }
}
