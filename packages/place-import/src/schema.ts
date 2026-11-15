import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import type { ErrorObject } from "ajv";

/** Independent import wire formats; not a copy of the place pack schema. */
const date = { type: "string", format: "date" } as const;
const instant = { type: "string", format: "date-time" } as const;
const nonempty = { type: "string", minLength: 1 } as const;
const tier = { enum: [0, 1, 2, 3, 4, "E"] } as const;
const labels = { enum: ["PROTOTYPE-UNVERIFIED", "SEEDED-OPEN-DATA", "COMMUNITY-REPORTED"] } as const;

export const provenanceSchema = {
  type: "object",
  required: ["sourceName", "sourceId", "licence", "sourceDate", "recordDate", "retrievedAt", "tier", "verifierType"],
  properties: {
    sourceName: nonempty, sourceId: nonempty, sourceUrl: { type: "string", format: "uri" },
    licence: nonempty, sourceDate: date, recordDate: date, retrievedAt: date,
    tier, prototypeLabel: labels,
    verifierType: { enum: ["open-data-import", "business", "peer", "surveyor", "operator-feed", "fixture-author", "desk-reviewer"] },
    evidence: {
      type: "object", additionalProperties: false,
      required: ["protocolVersion", "verifierRole", "method", "observedAt", "photoIds"],
      properties: {
        protocolVersion: nonempty,
        verifierRole: { enum: ["trained_verifier", "peer", "operator", "importer", "desk_reviewer"] },
        method: nonempty, observedAt: date,
        photoIds: { type: "array", items: nonempty },
      },
    },
    observedAt: instant, expiresAt: instant,
  },
  additionalProperties: false,
  allOf: [
    {
      if: { properties: { tier: { enum: [2, "E"] } }, required: ["tier"] },
      then: { required: ["evidence"] },
    },
  ],
} as const;

const sourcedSchema = {
  type: "object", additionalProperties: false,
  required: ["value", "provenance", "photoSlotIds"],
  properties: {
    value: {}, provenance: { anyOf: [provenanceSchema, { type: "null" }] },
    photoSlotIds: { type: "array", items: { type: "string" } },
  },
  allOf: [
    { if: { properties: { value: { type: "null" } }, required: ["value"] },
      then: { properties: { provenance: { type: "null" } } },
      else: { properties: { provenance: provenanceSchema } } },
  ],
} as const;

export const rawDocumentSchema = {
  $id: "https://example.invalid/place-import/raw.schema.json",
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object", additionalProperties: false, required: ["records"],
  properties: {
    records: { type: "array", items: {
      type: "object", required: ["id", "name", "municipality", "recordProvenance", "fields"],
      properties: {
        id: nonempty, name: nonempty, municipality: nonempty,
        placeType: { enum: ["simple-venue", "complex-venue", "transit-station", "trailhead", "hotel-room", "parking-lot", "skeleton"] },
        recordProvenance: {}, fields: { type: "object" },
      },
      additionalProperties: true,
    } },
  },
} as const;

export const reportSchema = {
  $id: "https://example.invalid/place-import/report.schema.json",
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object", additionalProperties: false,
  required: ["accepted", "rejected", "unknownFields", "refused", "rejections", "notice"],
  properties: {
    accepted: { type: "integer", minimum: 0 }, rejected: { type: "integer", minimum: 0 },
    unknownFields: { type: "integer", minimum: 0 }, refused: { type: "integer", minimum: 0 },
    notice: nonempty,
    rejections: { type: "array", items: { type: "object", additionalProperties: false,
      required: ["index", "reason"], properties: { index: { type: "integer", minimum: 0 }, reason: nonempty } } },
    refusals: { type: "array", items: { type: "object", additionalProperties: false,
      required: ["index", "field", "reason"], properties: {
        index: { type: "integer", minimum: 0 }, field: nonempty, reason: nonempty,
      } } },
  },
} as const;

/** Validates the subset of the PlaceRecord contract produced by this importer. */
const fieldGroup = (names: readonly string[]) => ({
  type: "object", required: [...names],
  properties: Object.fromEntries(names.map((name) => [name, sourcedSchema])),
});

export const emittedRecordSchema = {
  $id: "https://example.invalid/place-import/emitted.schema.json",
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  required: ["id", "identity", "recordProvenance", "entrance", "washrooms", "interior", "parking", "transport", "trail", "publicationContext", "datasetStatus"],
  properties: {
    id: nonempty, datasetStatus: { const: "labelled-fixture" }, publicationContext: { const: "prototype" },
    recordProvenance: provenanceSchema,
    identity: { type: "object", required: ["name", "municipality", "province"],
      properties: { name: nonempty, municipality: nonempty, province: { const: "ON" } } },
    entrance: fieldGroup(["stepCount", "stepHeightMm", "thresholdHeightMm", "rampPresent", "namedLocation", "streetDirections",
      "doorClearWidthMm", "doorOperation", "rampGeometry", "rampLengthRise", "elevator", "lightingSignage", "stepFree"]),
    washrooms: { type: "array", maxItems: 0 },
    interior: fieldGroup(["routes", "counters", "seating", "sensory", "assistancePolicy", "assistiveListening", "restSpace"]),
    parking: {
      ...fieldGroup(["route", "surfaceSnow", "payment", "dropOff", "curbCuts", "approachObstacles"]),
      required: ["route", "surfaceSnow", "payment", "dropOff", "curbCuts", "approachObstacles", "bays"],
      properties: { ...fieldGroup(["route", "surfaceSnow", "payment", "dropOff", "curbCuts", "approachObstacles"]).properties,
        bays: { type: "array", maxItems: 0 } },
    },
    transport: fieldGroup(["nearestStop", "elevatorStatus", "paratransit", "chargingSummary", "repairSupplySummary", "emergencyContacts"]),
    trail: { anyOf: [{ type: "null" }, fieldGroup(["surface", "grade", "widthMm", "obstacles", "rest"]) ] },
  },
} as const;

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
export const validateRawDocument = ajv.compile(rawDocumentSchema);
export const validateImportReport = ajv.compile(reportSchema);
export const validateEmittedRecord = ajv.compile(emittedRecordSchema);
export const validateProvenance = ajv.compile(provenanceSchema);
export const formatErrors = (errors: ErrorObject[] | null | undefined): string =>
  (errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message ?? "invalid"}`).join("; ");
