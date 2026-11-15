import Ajv2020 from "ajv/dist/2020.js";

const DATE = { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" };
const STR = { type: "string", minLength: 1 };

const provenance = {
  type: "object",
  additionalProperties: false,
  required: [
    "sourceName",
    "sourceId",
    "sourceUrl",
    "licence",
    "sourceDate",
    "recordDate",
    "retrievedAt",
    "tier",
    "prototypeLabel",
    "verifierType",
  ],
  properties: {
    sourceName: STR,
    sourceId: STR,
    sourceUrl: STR,
    licence: STR,
    sourceDate: DATE,
    recordDate: DATE,
    retrievedAt: DATE,
    tier: { const: 0 },
    prototypeLabel: { const: "SEEDED-OPEN-DATA" },
    verifierType: { const: "open-data-import" },
  },
};

const sourced = {
  type: "object",
  additionalProperties: false,
  required: ["value", "provenance", "photoSlotIds"],
  properties: {
    value: { type: ["string", "number", "boolean", "null"] },
    provenance: { oneOf: [{ $ref: "#/$defs/provenance" }, { type: "null" }] },
    photoSlotIds: { type: "array", items: { type: "string" } },
  },
  allOf: [
    {
      if: { properties: { value: { type: "null" } }, required: ["value"] },
      then: { properties: { provenance: { type: "null" } } },
    },
    {
      if: { properties: { value: { not: { type: "null" } } }, required: ["value"] },
      then: { properties: { provenance: { $ref: "#/$defs/provenance" } }, required: ["provenance"] },
    },
  ],
};

const position = { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 };

const geometry = {
  oneOf: [
    { type: "null" },
    {
      type: "object",
      additionalProperties: false,
      required: ["type", "coordinates"],
      properties: { type: { const: "Point" }, coordinates: position },
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["type", "coordinates"],
      properties: { type: { const: "LineString" }, coordinates: { type: "array", minItems: 2, items: position } },
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["type", "coordinates"],
      properties: {
        type: { const: "Polygon" },
        coordinates: { type: "array", minItems: 1, items: { type: "array", minItems: 4, items: position } },
      },
    },
  ],
};

const FACTS = [
  "wheelchairAccessibilityStatement",
  "stepFree",
  "entranceDescription",
  "washroomAccessible",
  "parkingAccessible",
] as const;

export const recordSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://access-tools.invalid/importer-wikidata/imported-record.json",
  $defs: { provenance, sourced },
  type: "object",
  additionalProperties: false,
  required: ["id", "sourceId", "upstreamId", "kind", "name", "geometry", "facts", "unknownReasons", "raw"],
  properties: {
    id: { type: "string", pattern: "^[a-z0-9-]+:Q[1-9]\\d*$" },
    sourceId: STR,
    upstreamId: { type: "string", pattern: "^Q[1-9]\\d*$" },
    kind: { const: "wikidata-item" },
    name: {
      type: "object",
      additionalProperties: false,
      required: ["en", "fr"],
      properties: { en: { $ref: "#/$defs/sourced" }, fr: { $ref: "#/$defs/sourced" } },
    },
    geometry,
    facts: {
      type: "object",
      additionalProperties: false,
      required: [...FACTS],
      properties: Object.fromEntries(FACTS.map((f) => [f, { $ref: "#/$defs/sourced" }])),
    },
    unknownReasons: { type: "object", additionalProperties: STR },
    raw: {
      type: "object",
      additionalProperties: false,
      required: ["item", "itemLabel_en", "itemLabel_fr", "v", "coord"],
      properties: {
        item: STR,
        itemLabel_en: { type: ["string", "null"] },
        itemLabel_fr: { type: ["string", "null"] },
        v: { type: "array", items: { type: "string" } },
        coord: { type: ["string", "null"] },
      },
    },
  },
};

const counts = { type: "object", additionalProperties: { type: "integer", minimum: 0 } };
const bilingual = {
  type: "object",
  additionalProperties: false,
  required: ["en", "fr"],
  properties: { en: STR, fr: STR },
};

export const reportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://access-tools.invalid/importer-wikidata/import-report.json",
  type: "object",
  additionalProperties: false,
  required: [
    "sourceId",
    "retrievedAt",
    "read",
    "emitted",
    "rejected",
    "unknownFieldCount",
    "unknownReasons",
    "heldByLicence",
    "licenceRecord",
    "partitions",
    "coverageNotice",
    "summary",
  ],
  properties: {
    sourceId: STR,
    retrievedAt: DATE,
    read: { type: "integer", minimum: 0 },
    emitted: { type: "integer", minimum: 0 },
    rejected: counts,
    unknownFieldCount: counts,
    unknownReasons: counts,
    heldByLicence: { type: "boolean" },
    licenceRecord: {
      oneOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["checkedOn", "urlRead", "result"],
          properties: { checkedOn: DATE, urlRead: STR, result: STR },
        },
      ],
    },
    partitions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["file", "records", "bytes", "sha256"],
        properties: {
          file: STR,
          records: { type: "integer", minimum: 0 },
          bytes: { type: "integer", minimum: 0 },
          sha256: { type: "string", pattern: "^[0-9a-f]{64}$" },
        },
      },
    },
    coverageNotice: bilingual,
    summary: bilingual,
  },
};

const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true });
const checkRecord = ajv.compile(recordSchema);
const checkReport = ajv.compile(reportSchema);

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

function run(check: typeof checkRecord, data: unknown): ValidationResult {
  const ok = check(data) as boolean;
  return { ok, errors: ok ? [] : (check.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message ?? ""}`.trim()) };
}

export const validateRecord = (data: unknown): ValidationResult => run(checkRecord, data);
export const validateReport = (data: unknown): ValidationResult => run(checkReport, data);
