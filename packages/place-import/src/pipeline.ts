import type { PlaceRecord, Provenance, Sourced, VerificationTier } from "@access-tools/place";
import {
  formatErrors, validateEmittedRecord, validateImportReport, validateProvenance, validateRawDocument,
} from "./schema.js";

export interface Rejection { index: number; reason: string }
export interface Refusal { index: number; field: string; reason: string }
export interface ImportReport {
  accepted: number;
  rejected: number;
  unknownFields: number;
  refused: number;
  notice: string;
  rejections: Rejection[];
  refusals: Refusal[];
}
export interface ImportResult { places: PlaceRecord[]; report: ImportReport }
export type RawFact = { value: unknown; provenance?: unknown } | null;
export interface RawRecord {
  id: string;
  name: string;
  municipality: string;
  placeType?: PlaceRecord["identity"]["placeType"];
  recordProvenance: unknown;
  fields: Record<string, RawFact>;
  [key: string]: unknown;
}

const entranceFields = [
  "stepCount", "stepHeightMm", "thresholdHeightMm", "rampPresent", "namedLocation", "streetDirections",
  "doorClearWidthMm", "doorOperation", "rampGeometry", "rampLengthRise", "elevator", "lightingSignage", "stepFree",
] as const;
const interiorFields = ["routes", "counters", "seating", "sensory", "assistancePolicy", "assistiveListening", "restSpace"] as const;
const parkingFields = ["route", "surfaceSnow", "payment", "dropOff", "curbCuts", "approachObstacles"] as const;
const transportFields = ["nearestStop", "paratransit", "chargingSummary", "repairSupplySummary", "emergencyContacts"] as const;
const trailFields = ["surface", "grade", "widthMm", "obstacles", "rest"] as const;

const paths = [
  ...entranceFields.map((field) => `entrance.${field}`),
  ...interiorFields.map((field) => `interior.${field}`),
  ...parkingFields.map((field) => `parking.${field}`),
  ...transportFields.map((field) => `transport.${field}`),
  ...trailFields.map((field) => `trail.${field}`),
] as const;
export const importablePaths: readonly string[] = paths;

const numeric = new Set(["entrance.stepCount", "entrance.stepHeightMm", "entrance.thresholdHeightMm", "entrance.doorClearWidthMm", "trail.widthMm"]);
const yesNo = new Set(["entrance.rampPresent", "entrance.stepFree"]);
// Complex measurements require their own independently sourced field; the importer
// deliberately does not accept partly attributed nested facts.
const unsupported = new Set(["entrance.doorOperation", "entrance.rampGeometry", "entrance.rampLengthRise", "entrance.elevator"]);
const liveStatus = /(?:live|current|realtime|real.time|disruption|elevatorstatus|out.of.order|servicealert)/i;
const unknown = <T>(): Sourced<T> => ({ value: null, provenance: null, photoSlotIds: [] });
const blank = (names: readonly string[]): Record<string, Sourced<unknown>> =>
  Object.fromEntries(names.map((name) => [name, unknown()]));

function safeProvenance(value: unknown): value is Provenance {
  if (!validateProvenance(value)) return false;
  const p = value as Provenance;
  if (p.prototypeLabel !== "PROTOTYPE-UNVERIFIED" && p.prototypeLabel !== "SEEDED-OPEN-DATA") return false;
  // This import job only emits prototype data, and cannot certify survey evidence.
  if (p.tier === 3 || p.tier === 4) return false;
  if (p.evidence || p.observedAt || p.expiresAt) return false;
  return p.tier === 0 || p.tier === 1 || p.tier === 2 || p.tier === "E";
}

function checkFact(path: string, raw: RawFact): Sourced<unknown> {
  if (raw === null || (typeof raw === "object" && raw !== null && raw.value == null)) return unknown();
  if (!raw || typeof raw !== "object" || !("value" in raw)) throw new Error(`${path}: expected a value object or null`);
  const p = raw.provenance;
  if (!safeProvenance(p)) throw new Error(`${path}: invalid or missing source, licence, date, tier, or prototype verification`);
  const value = raw.value;
  if (unsupported.has(path)) throw new Error(`${path}: complex fact is not supported by the demonstration importer`);
  if (numeric.has(path) && (typeof value !== "number" || !Number.isFinite(value) || value < 0 ||
    (path === "entrance.stepCount" && !Number.isInteger(value)))) {
    throw new Error(`${path}: requires a nonnegative ${path === "entrance.stepCount" ? "integer" : "number"}`);
  }
  if (yesNo.has(path) && value !== "yes" && value !== "no") throw new Error(`${path}: requires yes or no`);
  if (!numeric.has(path) && !yesNo.has(path) && (typeof value !== "string" || !value.trim())) {
    throw new Error(`${path}: requires a nonempty string`);
  }
  return { value, provenance: p, photoSlotIds: [] };
}

function createPlace(raw: RawRecord, values: Record<string, Sourced<unknown>>): PlaceRecord {
  const entrance = { ...blank(entranceFields) };
  const interior = { ...blank(interiorFields) };
  const parking = { ...blank(parkingFields) };
  const transport: Record<string, Sourced<unknown>> = { ...blank(transportFields), elevatorStatus: unknown<string>() };
  const trail = { ...blank(trailFields) };
  for (const [path, fact] of Object.entries(values)) {
    const [section, field] = path.split(".");
    if (!field) continue;
    if (section === "entrance") entrance[field] = fact;
    if (section === "interior") interior[field] = fact;
    if (section === "parking") parking[field] = fact;
    if (section === "transport") transport[field] = fact;
    if (section === "trail") trail[field] = fact;
  }
  // These shapes are populated from the complete named field lists above.
  return {
    id: raw.id, datasetStatus: "labelled-fixture", publicationContext: "prototype",
    honestyNote: "Demonstration data only. Unknown does not mean accessible.",
    honestyNoteFr: "Données de démonstration uniquement. Inconnu ne signifie pas accessible.",
    depth: "skeleton",
    identity: {
      name: raw.name, placeType: raw.placeType ?? "skeleton", category: "demonstration",
      address: null, municipality: raw.municipality, province: "ON", latitude: null, longitude: null,
      coordinateNote: null, phone: null, hoursText: null, hours: null, languagesOfService: null,
      accessibilityStatementUrl: null,
    },
    nameFr: null, recordProvenance: raw.recordProvenance as Provenance,
    entrance: entrance as unknown as PlaceRecord["entrance"], washrooms: [],
    interior: interior as unknown as PlaceRecord["interior"],
    parking: { ...parking, bays: [] } as unknown as PlaceRecord["parking"],
    chargingPoints: [], linkedRepairerIds: [], linkedSupplyStoreIds: [],
    transport: transport as unknown as PlaceRecord["transport"], photos: [], peerTips: [],
    trail: raw.placeType === "trailhead" ? trail as unknown as PlaceRecord["trail"] : null,
  };
}

/** Accepts JSON parsed from a labelled demo document; never reaches a network. */
export function importPlaces(input: unknown): ImportResult {
  const report: ImportReport = {
    accepted: 0, rejected: 0, unknownFields: 0, refused: 0,
    notice: "Demonstration import counts only; not coverage of Ontario.", rejections: [], refusals: [],
  };
  if (!validateRawDocument(input)) {
    report.rejected = 1;
    report.rejections.push({ index: 0, reason: `Document: ${formatErrors(validateRawDocument.errors)}` });
    return { places: [], report };
  }
  const places: PlaceRecord[] = [];
  const seen = new Set<string>();
  for (const [index, raw] of (input as { records: RawRecord[] }).records.entries()) {
    try {
      if (seen.has(raw.id)) throw new Error("Duplicate record id");
      if (!safeProvenance(raw.recordProvenance)) throw new Error("Invalid record provenance or unsupported verification claim");
      const values: Record<string, Sourced<unknown>> = {};
      const refused = Object.keys(raw.fields).filter((name) => liveStatus.test(name));
      // A live value is never persisted even when attached as an unrecognised top-level property.
      refused.push(...Object.keys(raw).filter((name) => liveStatus.test(name)));
      const leftovers = Object.keys(raw).filter((key) =>
        !["id", "name", "municipality", "placeType", "recordProvenance", "fields"].includes(key) && !liveStatus.test(key));
      if (leftovers.length) throw new Error(`Unexpected record properties: ${leftovers.join(", ")}`);
      for (const [path, value] of Object.entries(raw.fields)) {
        if (liveStatus.test(path)) continue;
        if (!paths.includes(path as typeof paths[number])) throw new Error(`Unrecognised field: ${path}`);
        values[path] = checkFact(path, value);
      }
      const place = createPlace(raw, values);
      if (!validateEmittedRecord(place)) throw new Error(`Invalid output: ${formatErrors(validateEmittedRecord.errors)}`);
      // Count all scalar sourced fields emitted, not missing rows or municipalities.
      const applicable = raw.placeType === "trailhead" ? paths : paths.filter((p) => !p.startsWith("trail."));
      report.unknownFields += applicable.filter((path) => !values[path] || values[path].value === null).length + 1;
      for (const field of refused) report.refusals.push({ index, field, reason: "Live status/disruption is not stored" });
      report.refused += refused.length;
      report.accepted++;
      seen.add(raw.id);
      places.push(place);
    } catch (error) {
      report.rejected++;
      report.rejections.push({ index, reason: error instanceof Error ? error.message : "Invalid input" });
    }
  }
  if (!validateImportReport(report)) throw new Error(`Invalid report: ${formatErrors(validateImportReport.errors)}`);
  return { places, report };
}

export function displayedFields(place: PlaceRecord): Array<{ path: string; fact: Sourced<unknown> }> {
  const result: Array<{ path: string; fact: Sourced<unknown> }> = [];
  for (const path of paths) {
    const [section, field] = path.split(".");
    if (!field) continue;
    const source = section === "entrance" ? place.entrance : section === "interior" ? place.interior :
      section === "parking" ? place.parking : section === "transport" ? place.transport : place.trail;
    if (source) result.push({ path, fact: (source as unknown as Record<string, Sourced<unknown>>)[field] ?? unknown() });
  }
  result.push({ path: "transport.elevatorStatus", fact: place.transport.elevatorStatus });
  return result;
}

export type { VerificationTier };
