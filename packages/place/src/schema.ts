import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const provenance = {
  type: "object",
  required: ["sourceName", "licence", "sourceDate", "recordDate", "tier", "verifierType"],
  additionalProperties: true,
  properties: {
    sourceName: { type: "string", minLength: 1 },
    sourceUrl: { type: "string" },
    licence: { type: "string", minLength: 1 },
    sourceDate: { type: "string", format: "date" },
    recordDate: { type: "string", format: "date" },
    tier: {
      enum: [
        "tier-0-open-data",
        "tier-1-business-claimed",
        "tier-2-peer",
        "tier-3-surveyor",
        "tier-4-live-feed",
      ],
    },
    verifierType: {
      enum: ["open-data-import", "business", "peer", "surveyor", "operator-feed", "fixture-author"],
    },
    protocolVersion: { type: "string" },
    observedAt: { type: "string" },
  },
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
        "honestyNote",
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
        honestyNote: { type: "string", minLength: 1 },
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
      required: ["id", "name", "datasetStatus", "honestyNote", "servicesPublished", "provenance"],
      properties: {
        id: { type: "string", minLength: 1 },
        name: { type: "string", minLength: 1 },
        datasetStatus: { enum: ["labelled-fixture", "prototype-seed", "access-maps"] },
        honestyNote: { type: "string", minLength: 1 },
        servicesPublished: { type: "array", items: { type: "string" } },
        provenance: { $ref: "#/$defs/provenance" },
      },
    },
    supplyStore: {
      type: "object",
      required: ["id", "name", "datasetStatus", "honestyNote", "categoriesPublished", "provenance"],
      properties: {
        id: { type: "string", minLength: 1 },
        name: { type: "string", minLength: 1 },
        datasetStatus: { enum: ["labelled-fixture", "prototype-seed", "access-maps"] },
        honestyNote: { type: "string", minLength: 1 },
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
