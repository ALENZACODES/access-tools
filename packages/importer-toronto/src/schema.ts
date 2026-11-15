import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { FACT_KEYS } from "./types.js";

const provenance = {
  type: "object", additionalProperties: false,
  required: ["sourceName", "sourceId", "sourceUrl", "licence", "sourceDate", "recordDate", "retrievedAt", "tier", "prototypeLabel", "verifierType"],
  properties: {
    sourceName: { type: "string", minLength: 1 }, sourceId: { type: "string", minLength: 1 },
    sourceUrl: { type: "string", format: "uri" }, licence: { type: "string", minLength: 1 },
    sourceDate: { type: "string", format: "date" }, recordDate: { type: "string", format: "date" },
    retrievedAt: { type: "string", format: "date" }, tier: { const: 0 },
    prototypeLabel: { const: "SEEDED-OPEN-DATA" }, verifierType: { const: "open-data-import" },
  },
};
const sourced = {
  type: "object", additionalProperties: false, required: ["value", "provenance", "photoSlotIds"],
  properties: {
    value: { type: ["string", "null"] }, provenance: { anyOf: [{ $ref: "#/$defs/provenance" }, { type: "null" }] },
    photoSlotIds: { type: "array", maxItems: 0 },
  },
  allOf: [
    { if: { properties: { value: { type: "null" } }, required: ["value"] }, then: { properties: { provenance: { type: "null" } } } },
    { if: { properties: { value: { type: "string" } }, required: ["value"] }, then: { properties: { provenance: { $ref: "#/$defs/provenance" } } } },
  ],
};
const geoPoint = { type: "array", prefixItems: [{ type: "number", minimum: -180, maximum: 180 }, { type: "number", minimum: -90, maximum: 90 }], minItems: 2, maxItems: 2 };
const geometry = {
  oneOf: [
    { type: "null" },
    { type: "object", additionalProperties: false, required: ["type", "coordinates"], properties: { type: { const: "Point" }, coordinates: geoPoint } },
    { type: "object", additionalProperties: false, required: ["type", "coordinates"], properties: { type: { const: "LineString" }, coordinates: { type: "array", items: geoPoint, minItems: 2 } } },
    { type: "object", additionalProperties: false, required: ["type", "coordinates"], properties: { type: { const: "Polygon" }, coordinates: { type: "array", items: { type: "array", items: geoPoint, minItems: 4 }, minItems: 1 } } },
  ],
};
export const recordSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object", additionalProperties: false,
  required: ["id", "sourceId", "upstreamId", "kind", "name", "geometry", "facts", "raw", "reasons"],
  properties: {
    id: { type: "string", minLength: 3 }, sourceId: { type: "string", minLength: 1 },
    upstreamId: { type: "string", minLength: 1 },
    kind: { enum: ["traffic-signal", "pedestrian-crossover", "pops", "park-facility"] },
    name: { type: "object", additionalProperties: false, required: ["en", "fr"], properties: { en: { $ref: "#/$defs/sourced" }, fr: { $ref: "#/$defs/sourced" } } },
    geometry, facts: { type: "object", additionalProperties: false, required: [...FACT_KEYS], properties: Object.fromEntries(FACT_KEYS.map((key) => [key, { $ref: "#/$defs/sourced" }])) },
    raw: { type: "object" }, reasons: { type: "array", uniqueItems: true, items: { const: "bad-geometry" } },
  }, $defs: { provenance, sourced },
};
const partition = {
  type: "object", additionalProperties: false, required: ["file", "count", "bytes", "sha256"],
  properties: { file: { type: "string", pattern: "^[a-zA-Z0-9._-]+\\.ndjson\\.gz$" }, count: { type: "integer", minimum: 1 }, bytes: { type: "integer", minimum: 1 }, sha256: { type: "string", pattern: "^[a-f0-9]{64}$" } },
};
export const reportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object", additionalProperties: false,
  required: ["sourceId", "read", "emitted", "rejected", "unknownFieldCount", "heldByLicence", "retrievedAt", "partitions", "coverageNotice", "summary"],
  properties: {
    sourceId: { type: "string", minLength: 1 }, read: { type: "integer", minimum: 0 }, emitted: { type: "integer", minimum: 0 },
    rejected: { type: "object", additionalProperties: { type: "integer", minimum: 0 } },
    unknownFieldCount: { type: "object", additionalProperties: false, required: [...FACT_KEYS], properties: Object.fromEntries(FACT_KEYS.map((key) => [key, { type: "integer", minimum: 0 }])) },
    heldByLicence: { type: "boolean" }, retrievedAt: { type: "string", format: "date" },
    partitions: { type: "array", items: partition }, coverageNotice: { type: "string", minLength: 1 },
    summary: { type: "object", additionalProperties: false, required: ["en", "fr"], properties: { en: { type: "string", minLength: 1 }, fr: { type: "string", minLength: 1 } } },
  },
};
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
export const validateRecord = ajv.compile(recordSchema);
export const validateReport = ajv.compile(reportSchema);
export function validationErrors(kind: "record" | "report"): string[] {
  return ((kind === "record" ? validateRecord : validateReport).errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message ?? "invalid"}`);
}
