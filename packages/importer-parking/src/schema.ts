import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const provenance = {
  type: "object", additionalProperties: false,
  required: ["sourceName", "sourceId", "sourceUrl", "licence", "sourceDate", "recordDate", "retrievedAt", "tier", "prototypeLabel", "verifierType"],
  properties: {
    sourceName: { type: "string", minLength: 1 }, sourceId: { type: "string", minLength: 1 },
    sourceUrl: { type: "string", format: "uri" }, licence: { type: "string", minLength: 1 },
    sourceDate: { type: "string", format: "date" }, recordDate: { type: "string", format: "date" },
    retrievedAt: { type: "string", format: "date" }, tier: { const: 0 },
    prototypeLabel: { const: "SEEDED-OPEN-DATA" }, verifierType: { const: "open-data-import" },
    note: { type: "string", minLength: 1 },
  },
};
const sourced = {
  type: "object", additionalProperties: false, required: ["value", "provenance", "photoSlotIds"],
  properties: {
    value: {}, provenance: { anyOf: [{ $ref: "#/$defs/provenance" }, { type: "null" }] },
    photoSlotIds: { type: "array", items: { type: "string" }, maxItems: 0 },
  },
  allOf: [
    { if: { properties: { value: { type: "null" } }, required: ["value"] }, then: { properties: { provenance: { type: "null" } } } },
    { if: { properties: { value: { not: { type: "null" } } }, required: ["value"] }, then: { properties: { provenance: { $ref: "#/$defs/provenance" } } } },
  ],
};
const ref = { $ref: "#/$defs/sourced" };
export const importedRecordSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema", type: "object", additionalProperties: false,
  required: ["id", "sourceId", "upstreamId", "kind", "name", "geometry", "facts", "raw"],
  properties: {
    id: { type: "string", minLength: 3 }, sourceId: { type: "string", minLength: 1 },
    upstreamId: { type: "string", minLength: 1 }, kind: { enum: ["accessible-stall", "parking-lot"] },
    name: { type: "object", additionalProperties: false, required: ["en", "fr"], properties: { en: ref, fr: ref } },
    geometry: { anyOf: [
      { type: "null" },
      { type: "object", additionalProperties: false, required: ["type", "coordinates"],
        properties: { type: { const: "Point" }, coordinates: { $ref: "#/$defs/point" } } },
      { type: "object", additionalProperties: false, required: ["type", "coordinates"],
        properties: { type: { const: "LineString" }, coordinates: { type: "array", minItems: 2, items: { $ref: "#/$defs/point" } } } },
      { type: "object", additionalProperties: false, required: ["type", "coordinates"],
        properties: { type: { const: "Polygon" }, coordinates: { type: "array", minItems: 1,
          items: { type: "array", minItems: 4, items: { $ref: "#/$defs/point" } } } } },
    ] },
    facts: { type: "object", additionalProperties: false, required: ["aodaType", "accessibleSpaces", "cityAccessibleFlag"],
      properties: { aodaType: ref, accessibleSpaces: ref, cityAccessibleFlag: ref } },
    raw: { type: "object" },
  },
  $defs: {
    provenance, sourced,
    point: { type: "array", minItems: 2, maxItems: 2,
      prefixItems: [{ type: "number", minimum: -180, maximum: 180 }, { type: "number", minimum: -90, maximum: 90 }] },
  },
} as const;
export const importReportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema", type: "object", additionalProperties: false,
  required: ["sourceId", "read", "emitted", "rejected", "unknownFieldCount", "heldByLicence", "retrievedAt", "partitions", "coverageClaim", "summary"],
  properties: {
    sourceId: { type: "string", minLength: 1 }, read: { type: "integer", minimum: 0 },
    emitted: { type: "integer", minimum: 0 }, rejected: { type: "object", additionalProperties: { type: "integer", minimum: 0 } },
    unknownFieldCount: { type: "object", required: ["aodaType", "accessibleSpaces", "cityAccessibleFlag"],
      additionalProperties: false, properties: {
        aodaType: { type: "integer", minimum: 0 }, accessibleSpaces: { type: "integer", minimum: 0 },
        cityAccessibleFlag: { type: "integer", minimum: 0 },
      } },
    heldByLicence: { type: "boolean" }, retrievedAt: { type: "string", format: "date" },
    partitions: { type: "array", items: { type: "object", additionalProperties: false,
      required: ["file", "count", "bytes", "sha256"], properties: {
        file: { type: "string", minLength: 1 }, count: { type: "integer", minimum: 1 },
        bytes: { type: "integer", minimum: 1 }, sha256: { type: "string", pattern: "^[a-f0-9]{64}$" },
      } } },
    coverageClaim: { const: false }, summary: { type: "object", additionalProperties: false,
      required: ["en", "fr"], properties: { en: { type: "string" }, fr: { type: "string" } } },
  },
} as const;
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
export const validateImportedRecord = ajv.compile(importedRecordSchema);
export const validateImportReport = ajv.compile(importReportSchema);
export function validationErrors(): string[] {
  return (validateImportedRecord.errors ?? []).map((error) => `${error.instancePath} ${error.message ?? "invalid"}`);
}
