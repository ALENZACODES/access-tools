import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import schema from "./schema/listing.schema.json";
import type { EmploymentListing } from "./types.js";

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile<EmploymentListing>(schema);

export function listingErrors(record: unknown): string[] {
  if (validate(record)) return [];
  return (validate.errors ?? []).map((error) => `${error.instancePath || "/"}: ${error.message}`);
}

export function assertListing(record: unknown): asserts record is EmploymentListing {
  const errors = listingErrors(record);
  if (errors.length) throw new Error(`Invalid employment listing: ${errors.join("; ")}`);
}
