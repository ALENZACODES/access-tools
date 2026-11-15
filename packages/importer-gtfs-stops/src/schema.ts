import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const date = { type: "string", format: "date" };
const provenance = {
  type: "object", additionalProperties: false,
  required: ["sourceName", "sourceId", "sourceUrl", "licence", "sourceDate", "recordDate", "retrievedAt", "tier", "prototypeLabel", "verifierType"],
  properties: {
    sourceName: { type: "string", minLength: 1 }, sourceId: { type: "string", minLength: 1 },
    sourceUrl: { type: "string", format: "uri" }, licence: { type: "string", minLength: 1 },
    sourceDate: date, recordDate: date, retrievedAt: date,
    tier: { const: 0 }, prototypeLabel: { const: "SEEDED-OPEN-DATA" }, verifierType: { const: "open-data-import" },
  },
};
const sourced = {
  type: "object", required: ["value", "provenance", "photoSlotIds"], additionalProperties: false,
  properties: {
    value: {}, provenance: { anyOf: [{ $ref: "#/$defs/provenance" }, { type: "null" }] },
    photoSlotIds: { type: "array", items: { type: "string" } },
    derived: { type: "boolean" }, derivedFrom: { type: "string", minLength: 1 },
  },
  allOf: [
    { if: { properties: { value: { type: "null" } }, required: ["value"] },
      then: { properties: { provenance: { type: "null" } } } },
    { if: { properties: { value: { not: { type: "null" } } }, required: ["value"] },
      then: { properties: { provenance: { $ref: "#/$defs/provenance" } } } },
    { if: { properties: { derived: { const: true } }, required: ["derived"] },
      then: { required: ["derivedFrom"] } },
  ],
};
export const importedRecordSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object", additionalProperties: false,
  required: ["id", "sourceId", "upstreamId", "kind", "name", "geometry", "facts", "raw"],
  properties: {
    id: { type: "string", minLength: 1 }, sourceId: { type: "string", minLength: 1 },
    upstreamId: { type: "string", minLength: 1 }, kind: { enum: ["stop", "station", "entrance"] },
    name: { ...sourced, properties: { ...sourced.properties, fr: { $ref: "#/$defs/sourced" } } },
    geometry: { anyOf: [{ type: "null" }, {
      type: "object", additionalProperties: false, required: ["type", "coordinates"],
      properties: { type: { const: "Point" }, coordinates: {
        type: "array", prefixItems: [{ type: "number", minimum: -180, maximum: 180 },
          { type: "number", minimum: -90, maximum: 90 }], minItems: 2, maxItems: 2,
      } },
    }] },
    facts: { type: "object", additionalProperties: false, required: ["wheelchairBoarding", "parentStation"],
      properties: { wheelchairBoarding: { $ref: "#/$defs/sourced" }, parentStation: { $ref: "#/$defs/sourced" } } },
    raw: { type: "object", additionalProperties: { type: "string" } },
  }, $defs: { provenance, sourced },
} as const;
export const importReportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema", type: "object", additionalProperties: false,
  required: ["sourceId", "read", "emitted", "rejected", "byLocationType", "wheelchairBoarding", "unknownFieldCount", "shareKnown", "heldByLicence", "retrievedAt", "partitions", "coverageClaim", "summary"],
  properties: {
    sourceId: { type: "string" }, read: { type: "integer", minimum: 0 }, emitted: { type: "integer", minimum: 0 },
    rejected: { type: "object", additionalProperties: { type: "integer", minimum: 0 } },
    byLocationType: { type: "object", additionalProperties: { type: "integer", minimum: 0 } },
    wheelchairBoarding: { type: "object", additionalProperties: false, required: ["known", "derived", "unknown"],
      properties: Object.fromEntries(["known", "derived", "unknown"].map((k) => [k, { type: "integer", minimum: 0 }])) },
    unknownFieldCount: { type: "object", additionalProperties: { type: "integer", minimum: 0 } },
    shareKnown: { type: "number", minimum: 0, maximum: 1 }, heldByLicence: { type: "boolean" },
    retrievedAt: date, coverageClaim: { const: false },
    sourceDateNote: { const: "feed has no feed_info" },
    summary: { type: "object", additionalProperties: false, required: ["en", "fr"],
      properties: { en: { type: "string", minLength: 1 }, fr: { type: "string", minLength: 1 } } },
    partitions: { type: "array", items: { type: "object", additionalProperties: false,
      required: ["file", "count", "bytes", "sha256"], properties: {
        file: { type: "string" }, count: { type: "integer", minimum: 1 }, bytes: { type: "integer", minimum: 1 },
        sha256: { type: "string", pattern: "^[0-9a-f]{64}$" },
      } } },
  },
} as const;
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
export const validateRecord = ajv.compile(importedRecordSchema);
export const validateReport = ajv.compile(importReportSchema);
