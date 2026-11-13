import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const evidence = {
  type: "object",
  additionalProperties: false,
  required: ["protocolVersion", "verifierRole", "method", "observedAt", "photoIds"],
  properties: {
    protocolVersion: { type: "string", minLength: 1 },
    verifierRole: { enum: ["trained_verifier", "peer", "operator", "importer", "desk_reviewer"] },
    method: { type: "string", minLength: 1 },
    observedAt: { type: "string", format: "date" },
    photoIds: { type: "array", items: { type: "string", minLength: 1 } },
  },
} as const;

const provenance = {
  type: "object",
  required: ["sourceName", "sourceId", "licence", "sourceDate", "recordDate", "retrievedAt", "tier", "verifierType"],
  additionalProperties: false,
  properties: {
    sourceName: { type: "string", minLength: 1 },
    sourceId: { type: "string", minLength: 1 },
    sourceUrl: { type: "string" },
    licence: { type: "string", minLength: 1 },
    sourceDate: { type: "string", format: "date" },
    recordDate: { type: "string", format: "date" },
    retrievedAt: { type: "string", format: "date" },
    tier: { enum: [0, 1, 2, 3, 4, "E"] },
    prototypeLabel: {
      enum: ["PROTOTYPE-UNVERIFIED", "SEEDED-OPEN-DATA", "COMMUNITY-REPORTED", "VERIFIED"],
    },
    verifierType: {
      enum: ["open-data-import", "business", "peer", "surveyor", "operator-feed", "fixture-author", "desk-reviewer"],
    },
    evidence,
    observedAt: { type: "string" },
    expiresAt: { type: "string" },
  },
  allOf: [
    {
      if: { properties: { tier: { const: 3 } }, required: ["tier"] },
      then: { required: ["evidence"] },
    },
    {
      if: { properties: { prototypeLabel: { const: "VERIFIED" } }, required: ["prototypeLabel"] },
      then: { required: ["evidence"], properties: { tier: { const: 3 } } },
    },
    {
      if: { properties: { prototypeLabel: { const: "PROTOTYPE-UNVERIFIED" } }, required: ["prototypeLabel"] },
      then: { properties: { tier: { enum: [0, 1] } } },
    },
    {
      if: { properties: { prototypeLabel: { const: "SEEDED-OPEN-DATA" } }, required: ["prototypeLabel"] },
      then: { properties: { tier: { const: 0 } } },
    },
    {
      if: { properties: { prototypeLabel: { const: "COMMUNITY-REPORTED" } }, required: ["prototypeLabel"] },
      then: { properties: { tier: { const: 2 } } },
    },
  ],
} as const;

const sourced = {
  type: "object",
  required: ["value", "provenance", "photoSlotIds"],
  additionalProperties: false,
  properties: {
    value: {},
    provenance: { anyOf: [provenance, { type: "null" }] },
    photoSlotIds: { type: "array", items: { type: "string" } },
  },
} as const;

/**
 * Structural schema for a place pack.
 * Honesty rules that schema cannot express (value without provenance, fixture wording) live in lintPack.
 */
export const placePackSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://access-tools.local/schema/place-pack.json",
  type: "object",
  required: ["id", "kind", "generatedOn", "notice", "places", "repairers", "supplyStores"],
  additionalProperties: false,
  properties: {
    id: { type: "string", minLength: 1 },
    kind: { const: "labelled-fixture" },
    generatedOn: { type: "string", format: "date" },
    notice: { type: "string", minLength: 1 },
    places: { type: "array", items: { $ref: "#/$defs/place" } },
    repairers: { type: "array", items: { $ref: "#/$defs/repairer" } },
    supplyStores: { type: "array", items: { $ref: "#/$defs/supplyStore" } },
  },
  $defs: {
    provenance,
    sourced,
    place: {
      type: "object",
      required: [
        "id",
        "datasetStatus",
        "publicationContext",
        "honestyNote",
        "honestyNoteFr",
        "depth",
        "identity",
        "nameFr",
        "recordProvenance",
        "entrance",
        "washrooms",
        "interior",
        "parking",
        "chargingPoints",
        "linkedRepairerIds",
        "linkedSupplyStoreIds",
        "transport",
        "photos",
        "peerTips",
        "trail",
      ],
      additionalProperties: false,
      properties: {
        id: { type: "string", minLength: 1 },
        datasetStatus: { enum: ["labelled-fixture", "prototype-seed", "access-maps"] },
        publicationContext: { enum: ["prototype", "canonical"] },
        honestyNote: { type: "string", minLength: 1 },
        honestyNoteFr: { type: "string", minLength: 1 },
        depth: { enum: ["bounded-seed", "skeleton"] },
        nameFr: { anyOf: [{ type: "string" }, { type: "null" }] },
        recordProvenance: { $ref: "#/$defs/provenance" },
        identity: { type: "object" },
        entrance: { type: "object" },
        washrooms: { type: "array" },
        interior: { type: "object" },
        parking: { type: "object" },
        chargingPoints: { type: "array" },
        linkedRepairerIds: { type: "array", items: { type: "string" } },
        linkedSupplyStoreIds: { type: "array", items: { type: "string" } },
        transport: { type: "object" },
        photos: { type: "array" },
        peerTips: { type: "array" },
        trail: { anyOf: [{ type: "object" }, { type: "null" }] },
      },
    },
    repairer: {
      type: "object",
      required: ["id", "name", "datasetStatus", "publicationContext", "honestyNote", "honestyNoteFr", "servicesPublished", "provenance"],
      properties: {
        id: { type: "string", minLength: 1 },
        name: { type: "string", minLength: 1 },
        nameFr: { anyOf: [{ type: "string" }, { type: "null" }] },
        datasetStatus: { enum: ["labelled-fixture", "prototype-seed", "access-maps"] },
        publicationContext: { enum: ["prototype", "canonical"] },
        honestyNote: { type: "string", minLength: 1 },
        honestyNoteFr: { type: "string", minLength: 1 },
        servicesPublished: { type: "array", items: { type: "string" } },
        provenance: { $ref: "#/$defs/provenance" },
      },
    },
    supplyStore: {
      type: "object",
      required: ["id", "name", "datasetStatus", "publicationContext", "honestyNote", "honestyNoteFr", "categoriesPublished", "provenance"],
      properties: {
        id: { type: "string", minLength: 1 },
        name: { type: "string", minLength: 1 },
        nameFr: { anyOf: [{ type: "string" }, { type: "null" }] },
        datasetStatus: { enum: ["labelled-fixture", "prototype-seed", "access-maps"] },
        publicationContext: { enum: ["prototype", "canonical"] },
        honestyNote: { type: "string", minLength: 1 },
        honestyNoteFr: { type: "string", minLength: 1 },
        categoriesPublished: { type: "array", items: { type: "string" } },
        provenance: { $ref: "#/$defs/provenance" },
      },
    },
  },
} as const;

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export const validatePlacePack = ajv.compile(placePackSchema);

export function schemaErrors(): string[] {
  return (validatePlacePack.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message ?? "invalid"}`);
}
