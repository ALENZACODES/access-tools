import Ajv2020 from "ajv/dist/2020.js";
import { RAW_COLUMNS } from "#src/map";

const date = { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" };
const str = { type: "string", minLength: 1 };

export const provenanceSchema = {
  type: "object",
  additionalProperties: false,
  required: ["sourceName", "sourceId", "sourceUrl", "licence", "sourceDate", "recordDate", "retrievedAt", "tier", "prototypeLabel", "verifierType"],
  properties: {
    sourceName: str,
    sourceId: str,
    sourceUrl: str,
    licence: str,
    sourceDate: date,
    recordDate: date,
    retrievedAt: date,
    tier: { const: 0 },
    prototypeLabel: { const: "SEEDED-OPEN-DATA" },
    verifierType: { const: "open-data-import" },
  },
};

/** Sourced<T>: if value is null then provenance is null; if value is non-null provenance is required. */
function sourced(valueSchema: object) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["value", "provenance", "photoSlotIds"],
    properties: {
      value: { anyOf: [valueSchema, { type: "null" }] },
      provenance: { anyOf: [{ $ref: "#/$defs/provenance" }, { type: "null" }] },
      photoSlotIds: { type: "array", items: { type: "string" } },
    },
    allOf: [
      { if: { properties: { value: { type: "null" } }, required: ["value"] }, then: { properties: { provenance: { type: "null" } } } },
      {
        if: { properties: { value: { not: { type: "null" } } }, required: ["value"] },
        then: { required: ["provenance"], properties: { provenance: { type: "object" } } },
      },
    ],
  };
}

const unknownOnly = sourced({ type: "null" });
const nullableStr = { anyOf: [str, { type: "null" }] };
const position = { type: "array", items: { type: "number" }, minItems: 2, maxItems: 3 };

export const recordSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://access-tools.invalid/importer-pspc/imported-record.json",
  $defs: { provenance: provenanceSchema },
  type: "object",
  additionalProperties: false,
  required: ["id", "sourceId", "upstreamId", "kind", "name", "nameFr", "geometry", "facts", "raw"],
  properties: {
    id: { type: "string", pattern: "^[^:]+:.+$" },
    sourceId: str,
    upstreamId: str,
    kind: { const: "building" },
    name: sourced({ type: "string" }),
    nameFr: sourced({ type: "string" }),
    geometry: {
      oneOf: [
        { type: "null" },
        { type: "object", required: ["type", "coordinates"], properties: { type: { const: "Point" }, coordinates: position } },
        { type: "object", required: ["type", "coordinates"], properties: { type: { const: "LineString" }, coordinates: { type: "array", items: position } } },
        { type: "object", required: ["type", "coordinates"], properties: { type: { const: "Polygon" }, coordinates: { type: "array", items: { type: "array", items: position } } } },
      ],
    },
    facts: {
      type: "object",
      additionalProperties: false,
      required: ["accessibilityScore", "address", "stepFree", "entrance", "washroom", "parking"],
      properties: {
        accessibilityScore: sourced({
          type: "object",
          additionalProperties: false,
          required: ["score", "standard", "assessedFiscalYear"],
          properties: {
            score: { type: "integer", minimum: 0, maximum: 100 },
            standard: str,
            assessedFiscalYear: nullableStr,
          },
        }),
        address: sourced({
          type: "object",
          additionalProperties: false,
          required: ["en", "fr", "city", "postalCode"],
          properties: { en: nullableStr, fr: nullableStr, city: nullableStr, postalCode: nullableStr },
        }),
        // Present and UNKNOWN: never derived from the building score.
        stepFree: unknownOnly,
        entrance: unknownOnly,
        washroom: unknownOnly,
        parking: unknownOnly,
      },
    },
    raw: {
      type: "object",
      propertyNames: { enum: [...RAW_COLUMNS] },
      additionalProperties: { type: "string" },
    },
  },
};

const counts = { type: "object", additionalProperties: { type: "integer", minimum: 0 } };
const bilingual = {
  type: "object",
  additionalProperties: false,
  required: ["en", "fr"],
  properties: { en: str, fr: str },
};

export const reportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://access-tools.invalid/importer-pspc/import-report.json",
  type: "object",
  additionalProperties: false,
  required: ["reportVersion", "retrievedAt", "countsAreNotACoverageClaim", "notice", "summary", "sources"],
  properties: {
    reportVersion: { const: 1 },
    retrievedAt: date,
    countsAreNotACoverageClaim: { const: true },
    notice: bilingual,
    summary: bilingual,
    sources: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sourceId", "retrievedAt", "read", "emitted", "rejected", "skipped", "unknownFieldCount", "unknownReasons", "heldByLicence", "partitions"],
        properties: {
          sourceId: str,
          retrievedAt: date,
          read: { type: "integer", minimum: 0 },
          emitted: { type: "integer", minimum: 0 },
          rejected: {
            type: "object",
            additionalProperties: false,
            required: ["total", "byReason"],
            properties: { total: { type: "integer", minimum: 0 }, byReason: counts },
          },
          skipped: counts,
          unknownFieldCount: counts,
          unknownReasons: counts,
          heldByLicence: { type: "boolean" },
          partitions: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["file", "records", "bytes", "sha256"],
              properties: {
                file: str,
                records: { type: "integer", minimum: 0 },
                bytes: { type: "integer", minimum: 0 },
                sha256: { type: "string", pattern: "^[0-9a-f]{64}$" },
              },
            },
          },
        },
      },
    },
  },
};

const ajv = new Ajv2020({ allErrors: true, strict: true });
const recordValidator = ajv.compile(recordSchema);
const reportValidator = ajv.compile(reportSchema);

export function validateRecord(x: unknown): string[] {
  return recordValidator(x) ? [] : (recordValidator.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`);
}

export function validateReport(x: unknown): string[] {
  return reportValidator(x) ? [] : (reportValidator.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`);
}
