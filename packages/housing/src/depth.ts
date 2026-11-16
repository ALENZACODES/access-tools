import type { Bilingual, Provenance, Sourced } from "./types.js";

/**
 * Housing and overnight records at place-page depth: facts are recorded per
 * building, per unit and per room. `value: null` is the only form of Unknown,
 * and a known value always carries its own provenance.
 */
export type RoomType = "entry" | "bedroom" | "bathroom" | "kitchen";
export type YesNo = "yes" | "no";
export type TransferSide = "left" | "right" | "both";
export type HoistKind = "ceiling-track" | "mobile" | "none";

export interface RoomFactTypes {
  doorClearWidthMm: number;
  thresholdHeightMm: number;
  turningDiameterMm: number;
  transferSide: TransferSide;
  transferSpaceMm: number;
  rollInShower: YesNo;
  bedHeightMm: number;
  bedSideClearanceMm: number;
  underBedClearanceMm: number;
  hoist: HoistKind;
  counterHeightMm: number;
}
export type RoomFactKey = keyof RoomFactTypes;
export type RoomFacts = { [K in RoomFactKey]?: Sourced<RoomFactTypes[K]> };

/** The measured fields each room type carries. A room carries exactly these. */
export const ROOM_FIELDS: Record<RoomType, readonly RoomFactKey[]> = {
  entry: ["doorClearWidthMm", "thresholdHeightMm", "turningDiameterMm"],
  bedroom: ["doorClearWidthMm", "turningDiameterMm", "bedHeightMm", "bedSideClearanceMm", "underBedClearanceMm", "hoist"],
  bathroom: ["doorClearWidthMm", "turningDiameterMm", "transferSide", "transferSpaceMm", "rollInShower"],
  kitchen: ["doorClearWidthMm", "turningDiameterMm", "counterHeightMm"],
};

export interface BuildingFacts {
  entranceStepHeightMm: Sourced<number>;
  entranceDoorClearWidthMm: Sourced<number>;
  elevator: Sourced<YesNo>;
  elevatorReliabilityNote: Sourced<string>;
  parking: Sourced<string>;
}
export type BuildingFactKey = keyof BuildingFacts;
export const BUILDING_FIELDS: readonly BuildingFactKey[] = [
  "entranceStepHeightMm", "entranceDoorClearWidthMm", "elevator", "elevatorReliabilityNote", "parking",
];

export interface DepthRoom { id: string; roomType: RoomType; facts: RoomFacts }
export interface DepthUnit { id: string; name: Bilingual; rooms: DepthRoom[] }
export interface DepthRecord {
  schemaVersion: "housing-depth-1";
  id: string;
  kind: "dwelling" | "overnight";
  name: Bilingual;
  city: string;
  province: "ON";
  datasetStatus: "labelled-fixture";
  recordProvenance: Provenance;
  building: BuildingFacts;
  units: DepthUnit[];
}

type FactKind = "number" | "text" | readonly string[];
const FACT_KINDS: Record<RoomFactKey | BuildingFactKey, FactKind> = {
  doorClearWidthMm: "number", thresholdHeightMm: "number", turningDiameterMm: "number",
  transferSide: ["left", "right", "both"], transferSpaceMm: "number", rollInShower: ["yes", "no"],
  bedHeightMm: "number", bedSideClearanceMm: "number", underBedClearanceMm: "number",
  hoist: ["ceiling-track", "mobile", "none"], counterHeightMm: "number",
  entranceStepHeightMm: "number", entranceDoorClearWidthMm: "number", elevator: ["yes", "no"],
  elevatorReliabilityNote: "text", parking: "text",
};

const ID = /^demo-[a-z0-9-]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIERS: readonly unknown[] = [0, 1, 2, "E"];
const LABELS: readonly unknown[] = ["PROTOTYPE-UNVERIFIED", "SEEDED-OPEN-DATA"];
const VERIFIERS: readonly unknown[] = ["open-data-import", "business", "peer", "surveyor", "operator-feed", "fixture-author", "desk-reviewer"];
const PROVENANCE_KEYS = ["sourceName", "sourceId", "sourceUrl", "licence", "sourceDate", "recordDate", "retrievedAt", "tier", "prototypeLabel", "verifierType"];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isDate(value: unknown): boolean {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function nonEmpty(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
function extraKeys(path: string, value: Record<string, unknown>, allowed: readonly string[]): string[] {
  return Object.keys(value).filter((key) => !allowed.includes(key)).map((key) => `${path}/${key}: unexpected field`);
}

function provenanceErrors(path: string, value: unknown): string[] {
  if (!isObject(value)) return [`${path}: provenance required`];
  const errors = extraKeys(path, value, PROVENANCE_KEYS);
  for (const key of ["sourceName", "sourceId", "licence"]) if (!nonEmpty(value[key])) errors.push(`${path}/${key}: required`);
  for (const key of ["sourceDate", "recordDate", "retrievedAt"]) if (!isDate(value[key])) errors.push(`${path}/${key}: must be a calendar date`);
  if (value.sourceUrl !== undefined && !(typeof value.sourceUrl === "string" && value.sourceUrl.startsWith("https://"))) errors.push(`${path}/sourceUrl: must be https`);
  if (!TIERS.includes(value.tier)) errors.push(`${path}/tier: unsupported tier`);
  if (!LABELS.includes(value.prototypeLabel)) errors.push(`${path}/prototypeLabel: unsupported label`);
  if (!VERIFIERS.includes(value.verifierType)) errors.push(`${path}/verifierType: unsupported verifier type`);
  return errors;
}

function factErrors(path: string, fact: unknown, kind: FactKind): string[] {
  if (!isObject(fact)) return [`${path}: fact required (use a null value for Unknown)`];
  const errors = extraKeys(path, fact, ["value", "provenance", "photoSlotIds"]);
  if (!Array.isArray(fact.photoSlotIds) || fact.photoSlotIds.length !== 0) errors.push(`${path}/photoSlotIds: must be an empty list`);
  if (fact.value === null) {
    if (fact.provenance !== null) errors.push(`${path}: Unknown must have null provenance`);
    return errors;
  }
  const value = fact.value;
  const ok = kind === "number" ? typeof value === "number" && Number.isFinite(value) && value >= 0
    : kind === "text" ? nonEmpty(value)
    : typeof value === "string" && kind.includes(value);
  if (!ok) errors.push(`${path}/value: not a permitted value`);
  errors.push(...provenanceErrors(`${path}/provenance`, fact.provenance));
  return errors;
}

function bilingualErrors(path: string, value: unknown): string[] {
  return isObject(value) && nonEmpty(value.en) && nonEmpty(value.fr) && Object.keys(value).length === 2 ? [] : [`${path}: English and French text required`];
}

export function depthRecordErrors(value: unknown): string[] {
  if (!isObject(value)) return ["/: must be an object"];
  const errors = extraKeys("", value, ["schemaVersion", "id", "kind", "name", "city", "province", "datasetStatus", "recordProvenance", "building", "units"]);
  if (value.schemaVersion !== "housing-depth-1") errors.push("/schemaVersion: unsupported");
  if (typeof value.id !== "string" || !ID.test(value.id)) errors.push("/id: fixture identifiers start with demo-");
  if (value.kind !== "dwelling" && value.kind !== "overnight") errors.push("/kind: must be dwelling or overnight");
  errors.push(...bilingualErrors("/name", value.name));
  if (typeof value.city !== "string" || value.city.trim().length < 2) errors.push("/city: required");
  if (value.province !== "ON") errors.push("/province: must be ON");
  if (value.datasetStatus !== "labelled-fixture") errors.push("/datasetStatus: must be labelled-fixture");
  errors.push(...provenanceErrors("/recordProvenance", value.recordProvenance));

  if (!isObject(value.building)) errors.push("/building: required");
  else {
    errors.push(...extraKeys("/building", value.building, BUILDING_FIELDS));
    for (const key of BUILDING_FIELDS) errors.push(...factErrors(`/building/${key}`, value.building[key], FACT_KINDS[key]));
  }

  if (!Array.isArray(value.units) || value.units.length === 0) return [...errors, "/units: at least one unit required"];
  const seen = new Set<string>();
  value.units.forEach((unit: unknown, unitIndex: number) => {
    const unitPath = `/units/${unitIndex}`;
    if (!isObject(unit)) { errors.push(`${unitPath}: must be an object`); return; }
    errors.push(...extraKeys(unitPath, unit, ["id", "name", "rooms"]));
    if (typeof unit.id !== "string" || !ID.test(unit.id) || seen.has(unit.id)) errors.push(`${unitPath}/id: unique demo- identifier required`);
    else seen.add(unit.id);
    errors.push(...bilingualErrors(`${unitPath}/name`, unit.name));
    if (!Array.isArray(unit.rooms) || unit.rooms.length === 0) { errors.push(`${unitPath}/rooms: at least one room required`); return; }
    unit.rooms.forEach((room: unknown, roomIndex: number) => {
      const roomPath = `${unitPath}/rooms/${roomIndex}`;
      if (!isObject(room)) { errors.push(`${roomPath}: must be an object`); return; }
      errors.push(...extraKeys(roomPath, room, ["id", "roomType", "facts"]));
      if (typeof room.id !== "string" || !ID.test(room.id) || seen.has(room.id)) errors.push(`${roomPath}/id: unique demo- identifier required`);
      else seen.add(room.id);
      const fields = typeof room.roomType === "string" && Object.hasOwn(ROOM_FIELDS, room.roomType) ? ROOM_FIELDS[room.roomType as RoomType] : null;
      if (!fields) { errors.push(`${roomPath}/roomType: unsupported room type`); return; }
      if (!isObject(room.facts)) { errors.push(`${roomPath}/facts: required`); return; }
      errors.push(...extraKeys(`${roomPath}/facts`, room.facts, fields));
      for (const key of fields) errors.push(...factErrors(`${roomPath}/facts/${key}`, room.facts[key], FACT_KINDS[key]));
    });
  });
  return errors;
}

export function assertDepthRecords(records: unknown): asserts records is DepthRecord[] {
  if (!Array.isArray(records)) throw new Error("Expected a record array");
  records.forEach((record, index) => {
    const errors = depthRecordErrors(record);
    if (errors.length) throw new Error(`Record ${index}: ${errors.join("; ")}`);
  });
}

/** Share of fields with a recorded value, for an honest completeness line. */
export function completeness(record: DepthRecord): { known: number; total: number } {
  const facts: Array<Sourced<unknown> | undefined> = BUILDING_FIELDS.map((key) => record.building[key]);
  for (const unit of record.units) for (const room of unit.rooms) for (const key of ROOM_FIELDS[room.roomType]) facts.push(room.facts[key]);
  return { known: facts.filter((fact) => fact && fact.value !== null).length, total: facts.length };
}
