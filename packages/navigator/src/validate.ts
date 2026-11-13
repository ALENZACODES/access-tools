import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import schema from "./schema/directory-record.schema.json" with { type: "json" };
import type { DirectoryRecord } from "./types.js";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

export function recordErrors(record: unknown): string[] {
  if (validate(record)) return [];
  return (validate.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`);
}

export function assertDirectory(records: readonly DirectoryRecord[]): void {
  const ids = new Set<string>();
  for (const record of records) {
    const errors = recordErrors(record);
    if (errors.length > 0) {
      throw new Error(`${record.id}: ${errors.join("; ")}`);
    }
    if (ids.has(record.id)) throw new Error(`Duplicate directory id ${record.id}`);
    ids.add(record.id);
  }
}
