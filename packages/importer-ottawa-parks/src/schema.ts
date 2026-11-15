import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import type { ImportedRecord, ImportReport } from "./types.ts";

const provenance = {
  type: "object", additionalProperties: false,
  required: ["sourceName", "sourceId", "sourceUrl", "licence", "sourceDate", "recordDate", "retrievedAt", "tier", "prototypeLabel", "verifierType"],
  properties: {
    sourceName: { type: "string", minLength: 1 },
    sourceId: { type: "string", minLength: 1 },
    sourceUrl: { type: "string", format: "uri" },
    licence: { type: "string", minLength: 1 },
    sourceDate: { type: "string", format: "date" },
    recordDate: { type: "string", format: "date" },
    retrievedAt: { type: "string", format: "date" },
    tier: { const: 0 }, prototypeLabel: { const: "SEEDED-OPEN-DATA" },
    verifierType: { const: "open-data-import" },
  },
};
const sourced = {
  type: "object", additionalProperties: false,
  required: ["value", "provenance", "photoSlotIds"],
  properties: {
    value: {}, provenance: { anyOf: [provenance, { type: "null" }] },
    photoSlotIds: { type: "array", maxItems: 0 },
  },
  allOf: [
    { if: { properties: { value: { type: "null" } }, required: ["value"] },
      then: { properties: { provenance: { type: "null" } } } },
    { if: { properties: { value: { not: { type: "null" } } }, required: ["value"] },
      then: { properties: { provenance } } },
  ],
};
const position = { type: "array", minItems: 2, items: { type: "number" } };
const line = { type: "array", minItems: 2, items: position };
const ring = { type: "array", minItems: 4, items: position };
const geometry = {
  oneOf: [
    { type: "null" },
    { type: "object", required: ["type", "coordinates"], additionalProperties: false,
      properties: { type: { const: "Point" }, coordinates: position } },
    { type: "object", required: ["type", "coordinates"], additionalProperties: false,
      properties: { type: { const: "LineString" }, coordinates: line } },
    { type: "object", required: ["type", "coordinates"], additionalProperties: false,
      properties: { type: { const: "MultiLineString" }, coordinates: { type: "array", minItems: 2, items: line } } },
    { type: "object", required: ["type", "coordinates"], additionalProperties: false,
      properties: { type: { const: "Polygon" }, coordinates: { type: "array", minItems: 1, items: ring } } },
    { type: "object", required: ["type", "coordinates"], additionalProperties: false,
      properties: { type: { const: "MultiPolygon" }, coordinates: { type: "array", minItems: 1,
        items: { type: "array", minItems: 1, items: ring } } } },
  ],
};
export const recordSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object", additionalProperties: false,
  required: ["id", "sourceId", "upstreamId", "kind", "name", "geometry", "geometryReason", "facts", "unknownReasons", "notes", "raw"],
  properties: {
    id: { type: "string", minLength: 1 }, sourceId: { type: "string", minLength: 1 },
    upstreamId: { type: "string", minLength: 1 }, kind: { type: "string", minLength: 1 },
    name: { type: "object", required: ["en", "fr"], additionalProperties: false,
      properties: { en: sourced, fr: sourced } },
    geometry,
    geometryReason: { enum: [null, "missing-geometry", "invalid-geometry"] },
    facts: { type: "object", additionalProperties: false,
      required: ["cityAccessibleFlag", "stepFree", "washroom", "entrance"],
      properties: Object.fromEntries(["cityAccessibleFlag", "stepFree", "washroom", "entrance"].map((k) => [k, sourced])) },
    unknownReasons: { type: "object", additionalProperties: { type: "string" } },
    notes: { type: "array", items: { type: "string" } },
    raw: { type: "object" },
  },
};
const partition = {
  type: "object", additionalProperties: false, required: ["file", "records", "bytes", "sha256"],
  properties: { file: { type: "string", minLength: 1 }, records: { type: "integer", minimum: 1 },
    bytes: { type: "integer", minimum: 1 }, sha256: { type: "string", pattern: "^[a-f0-9]{64}$" } },
};
export const reportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object", additionalProperties: false,
  required: ["sourceId", "read", "emitted", "rejected", "unknownFieldCount", "heldByLicence", "retrievedAt", "partitions", "coverageClaim", "summary"],
  properties: {
    sourceId: { type: "string", minLength: 1 },
    read: { type: "integer", minimum: 0 }, emitted: { type: "integer", minimum: 0 },
    rejected: { type: "object", additionalProperties: { type: "integer", minimum: 0 } },
    unknownFieldCount: { type: "object", additionalProperties: { type: "integer", minimum: 0 } },
    heldByLicence: { type: "boolean" }, retrievedAt: { type: "string", format: "date" },
    partitions: { type: "array", items: partition }, coverageClaim: { const: false },
    summary: { type: "object", additionalProperties: false, required: ["en", "fr"],
      properties: { en: { type: "string", minLength: 1 }, fr: { type: "string", minLength: 1 } } },
  },
};
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
export const validateRecord = ajv.compile<ImportedRecord>(recordSchema);
export const validateReport = ajv.compile<ImportReport>(reportSchema);
