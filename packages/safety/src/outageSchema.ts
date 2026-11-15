import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { PROTOTYPE_TIERS } from "./disruption.js";

/** JSON Schema 2020-12 for OutageSnapshot. A non-unknown status needs every provenance field. */
export const OUTAGE_SNAPSHOT_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://access-tools.invalid/schemas/outage-snapshot.json",
  type: "object",
  additionalProperties: false,
  required: ["status", "stationOrSegmentId", "source", "licence", "retrievedAt", "expiresAt", "tier"],
  properties: {
    status: { enum: ["unknown", "clear", "disrupted"] },
    stationOrSegmentId: { type: ["string", "null"], minLength: 1 },
    source: { type: ["string", "null"], minLength: 1 },
    licence: { type: ["string", "null"], minLength: 1 },
    retrievedAt: { type: ["string", "null"], format: "date-time" },
    expiresAt: { type: ["string", "null"], format: "date-time" },
    tier: { enum: [...PROTOTYPE_TIERS] },
  },
  if: { properties: { status: { enum: ["clear", "disrupted"] } } },
  then: {
    properties: {
      stationOrSegmentId: { type: "string" },
      source: { type: "string" },
      licence: { type: "string" },
      retrievedAt: { type: "string" },
      expiresAt: { type: "string" },
    },
  },
} as const;

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(OUTAGE_SNAPSHOT_SCHEMA);

export function validateOutageSnapshot(value: unknown): { valid: boolean; errors: string[] } {
  const valid = validate(value) as boolean;
  return { valid, errors: valid ? [] : (validate.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message ?? "invalid"}`) };
}
