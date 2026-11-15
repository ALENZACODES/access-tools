import Ajv2020 from "ajv/dist/2020";
import { CATALOG, FIELD_IDS } from "./catalog";
import type { FieldDef } from "./types";

const LICENCES = ["ODbL", "OGL-Ontario", "OGL-Canada", "CC-BY", "CC0"];
const bilingual = {
  type: "object", required: ["en", "fr"], additionalProperties: false,
  properties: { en: { type: "string", minLength: 1 }, fr: { type: "string", minLength: 1 } },
};

export const catalogSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://access-tools.invalid/sci-fields/catalog.schema.json",
  type: "array",
  items: {
    type: "object", additionalProperties: false,
    required: ["id", "label", "kind", "needKey", "expiry", "observed"],
    properties: {
      id: { type: "string", pattern: "^[a-z][a-z0-9_]*$" },
      label: bilingual,
      kind: { enum: ["number", "boolean", "enum", "text"] },
      unit: { enum: ["mm"] },
      values: { type: "object", additionalProperties: bilingual },
      needKey: { type: "string", minLength: 1 },
      expiry: { enum: ["durable", "annual", "visit", "short"] },
      observed: bilingual,
    },
  },
};

function valueSchema(f: FieldDef): object {
  switch (f.kind) {
    case "number": return { type: "number", exclusiveMinimum: 0 };
    case "boolean": return { type: "boolean" };
    case "text": return { type: "string", minLength: 1, maxLength: 500 };
    case "enum": return { enum: Object.keys(f.values ?? {}) };
  }
}

const PROVENANCE = ["source_id", "licence", "retrieved_at", "tier"];

export const factSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://access-tools.invalid/sci-fields/fact.schema.json",
  type: "object", additionalProperties: false, required: ["field", "value"],
  properties: {
    field: { enum: FIELD_IDS },
    value: { type: ["string", "number", "boolean"] },
    source_id: { type: "string", minLength: 1 },
    licence: { enum: LICENCES },
    retrieved_at: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}(T[0-9:.+Z-]+)?$" },
    tier: { type: "integer", minimum: 0, maximum: 3 },
    source_key: { type: "string" },
    raw: {},
    derived: { type: "boolean" },
  },
  // A bare UNKNOWN needs no provenance; any other value must carry all of it.
  if: { type: "object", required: ["value"], properties: { value: { const: "UNKNOWN" } } },
  else: { required: PROVENANCE },
  allOf: CATALOG.map((f) => ({
    if: { type: "object", required: ["field"], properties: { field: { const: f.id } } },
    then: { properties: { value: { anyOf: [{ const: "UNKNOWN" }, valueSchema(f)] } } },
  })),
};

const ajv = new Ajv2020({ allErrors: true, strict: false });
export const validateCatalog = ajv.compile(catalogSchema);
export const validateFactShape = ajv.compile(factSchema);
export { ajv };
