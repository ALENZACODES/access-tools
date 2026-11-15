// @ts-ignore Node strip-types uses TypeScript source paths
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
// @ts-ignore Node strip-types uses TypeScript source paths
import { FACT_KEYS } from "./types.ts";
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
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
    value: { type: ["string", "number", "null"] },
    provenance: { anyOf: [{ $ref: "#/$defs/provenance" }, { type: "null" }] },
    photoSlotIds: { type: "array", maxItems: 0 },
  },
  allOf: [
    { if: { properties: { value: { type: "null" } }, required: ["value"] }, then: { properties: { provenance: { type: "null" } } } },
    { if: { properties: { value: { not: { type: "null" } } }, required: ["value"] }, then: { properties: { provenance: { $ref: "#/$defs/provenance" } } } },
  ],
};
const sourcedRef = { $ref: "#/$defs/sourced" };
export const importedRecordSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema", type: "object", additionalProperties: false,
  required: ["id", "sourceId", "upstreamId", "kind", "name", "geometry", "facts", "raw"],
  properties: {
    id: { type: "string", minLength: 3 }, sourceId: { type: "string", minLength: 1 }, upstreamId: { type: "string", minLength: 1 },
    kind: { enum: ["sidewalk", "walkway", "multi-use-path", "crosswalk", "sidewalk-area"] },
    name: { type: "object", additionalProperties: false, required: ["en", "fr"], properties: { en: sourcedRef, fr: sourcedRef } },
    geometry: { anyOf: [{ type: "null" }, { type: "object", additionalProperties: false, required: ["type", "coordinates"], properties: { type: { enum: ["Point", "LineString", "Polygon"] }, coordinates: { type: "array" } } }] },
    facts: { type: "object", additionalProperties: false, required: [...FACT_KEYS], properties: Object.fromEntries(FACT_KEYS.map((key) => [key, sourcedRef])) },
    raw: { type: "object" },
  }, $defs: { provenance, sourced },
};
export const importReportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema", type: "object", additionalProperties: false,
  required: ["sourceId", "read", "emitted", "rejected", "unknownFieldCount", "heldByLicence", "retrievedAt", "parts", "coverageClaim", "summary"],
  properties: {
    sourceId: { type: "string" }, read: { type: "integer", minimum: 0 }, emitted: { type: "integer", minimum: 0 },
    rejected: { type: "object", additionalProperties: { type: "integer", minimum: 0 } },
    unknownFieldCount: { type: "object", additionalProperties: false, required: [...FACT_KEYS], properties: Object.fromEntries(FACT_KEYS.map((key) => [key, { type: "integer", minimum: 0 }])) },
    heldByLicence: { type: "boolean" }, retrievedAt: { type: "string", format: "date" },
    parts: { type: "array", items: { type: "object", additionalProperties: false, required: ["file", "records", "bytes", "sha256"], properties: { file: { type: "string" }, records: { type: "integer", minimum: 1 }, bytes: { type: "integer", minimum: 1 }, sha256: { type: "string", pattern: "^[a-f0-9]{64}$" } } } },
    coverageClaim: { const: false }, summary: { type: "object", required: ["en", "fr"], properties: { en: { type: "string" }, fr: { type: "string" } } },
  },
};
export const validateRecord = ajv.compile(importedRecordSchema);
export const validateReport = ajv.compile(importReportSchema);
export const validationErrors = (errors: null | undefined | readonly { instancePath: string; message?: string }[]): string[] =>
  (errors ?? []).map((error) => `${error.instancePath || "/"}: ${error.message ?? "invalid"}`);
