import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import type { Handoff } from "./types.js";

const bilingual = {
  type: "object", additionalProperties: false, required: ["en", "fr"],
  properties: { en: { type: "string", minLength: 1 }, fr: { type: "string", minLength: 1 } },
} as const;

/** JSON Schema draft 2020-12: reject undated steps, arbitrary actions and extra fields. */
export const handoffSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://access-tools.local/schema/handoff-1.0.0.json",
  type: "object", additionalProperties: false,
  required: ["schemaVersion", "id", "fromRecordId", "title", "checkedOn", "sourceName", "licenceNote", "verificationTier", "steps"],
  properties: {
    schemaVersion: { const: "handoff-1.0.0" },
    id: { type: "string", minLength: 3 },
    fromRecordId: { type: "string", minLength: 3 },
    title: bilingual,
    checkedOn: { type: "string", format: "date" },
    sourceName: { type: "string", minLength: 3 },
    licenceNote: bilingual,
    verificationTier: { enum: ["PROTOTYPE-UNVERIFIED", "SEEDED-OPEN-DATA"] },
    steps: {
      type: "array", minItems: 1,
      items: { oneOf: [
        { type: "object", additionalProperties: false, required: ["kind", "label", "url"],
          properties: { kind: { const: "link" }, label: bilingual, url: { type: "string", pattern: "^https://[^\\s]+$" } } },
        { type: "object", additionalProperties: false, required: ["kind", "label", "number"],
          properties: { kind: { const: "call" }, label: bilingual, number: { type: "string", pattern: "^\\+?[0-9][0-9 ()-]{2,24}$" } } },
      ] },
    },
  },
} as const;

const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validateShape = ajv.compile(handoffSchema);

/** Reject promises of entitlement in every field the user may read. */
const prohibited = [
  /\byou\s+(?:are|qualify\s+as)\s+eligible\b/i,
  /\byou\s+will\s+(?:receive|get|qualify|be\s+paid)\b/i,
  /\b(?:vous\s+(?:êtes|etes)\s+admissible|vous\s+(?:recevrez|obtiendrez)|vous\s+avez\s+droit\s+à)\b/i,
];

export function hasEligibilityPromise(value: unknown): boolean {
  if (typeof value === "string") return prohibited.some((pattern) => pattern.test(value));
  if (Array.isArray(value)) return value.some(hasEligibilityPromise);
  if (value && typeof value === "object") return Object.values(value).some(hasEligibilityPromise);
  return false;
}

export function assertHandoff(value: unknown): asserts value is Handoff {
  if (!validateShape(value)) throw new Error(`Invalid hand-off: ${ajv.errorsText(validateShape.errors)}`);
  if (hasEligibilityPromise(value)) throw new Error("Eligibility or payment promise is not permitted");
}

export function phoneHref(number: string): string {
  if (!/^\+?[0-9][0-9 ()-]{2,24}$/.test(number)) throw new Error("Invalid telephone number");
  return `tel:${number.replace(/[^0-9+]/g, "")}`;
}
