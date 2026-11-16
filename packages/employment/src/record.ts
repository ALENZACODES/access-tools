import type { EmploymentListing, PrototypeTier } from "./types.js";
import { listingErrors } from "./validate.js";

/**
 * A listing record whose workplace access record travels with it.
 *
 * `accessRecord: null` means no access record exists for the workplace. That is
 * never read as "accessible" and never hides the listing: the listing is shown
 * with an explicit unverified label and every access fact reads Unknown.
 */
export const UNKNOWN = "Unknown" as const;
export type Unknown = typeof UNKNOWN;

export interface AccessFact<T> {
  value: T | Unknown;
  source: string;
  licence: string;
  /** Calendar date (YYYY-MM-DD) the source describes. */
  date: string;
  tier: PrototypeTier;
}

export interface WorkstationFacts {
  heightAdjustableDesk: AccessFact<boolean>;
  kneeClearanceMm: AccessFact<number>;
  aisleClearWidthMm: AccessFact<number>;
  /** Step-free path from the entrance to the workstation. */
  stepFreeRouteFromEntry: AccessFact<boolean>;
}

export interface WorkplaceAccess {
  recordId: string;
  stepFreeEntry: AccessFact<boolean>;
  accessibleWashroom: AccessFact<boolean>;
  workstation: WorkstationFacts;
}

export interface ListingRecord {
  schemaVersion: "employment-listing-record-1.0.0";
  listing: EmploymentListing;
  accessRecord: WorkplaceAccess | null;
}

export const ACCESS_FACT_KEYS = [
  "stepFreeEntry",
  "accessibleWashroom",
  "heightAdjustableDesk",
  "kneeClearanceMm",
  "aisleClearWidthMm",
  "stepFreeRouteFromEntry",
] as const;
export type AccessFactKey = (typeof ACCESS_FACT_KEYS)[number];

const BOOLEAN_KEYS: readonly AccessFactKey[] = ["stepFreeEntry", "accessibleWashroom", "heightAdjustableDesk", "stepFreeRouteFromEntry"];
const TIERS: readonly string[] = ["PROTOTYPE-UNVERIFIED", "SEEDED-OPEN-DATA"];
const FACT_FIELDS = ["value", "source", "licence", "date", "tier"];

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function factErrors(path: string, fact: unknown, kind: "boolean" | "number"): string[] {
  if (!isObject(fact)) return [`${path}: must be a fact object`];
  const errors: string[] = [];
  for (const key of Object.keys(fact)) if (!FACT_FIELDS.includes(key)) errors.push(`${path}/${key}: unexpected field`);
  const value = fact.value;
  const valueOk = value === UNKNOWN ||
    (kind === "boolean" ? typeof value === "boolean" : typeof value === "number" && Number.isFinite(value) && value >= 0);
  if (!valueOk) errors.push(`${path}/value: must be ${kind === "boolean" ? "true, false" : "a non-negative number"} or "Unknown"`);
  for (const key of ["source", "licence"] as const) {
    const text = fact[key];
    if (typeof text !== "string" || text.trim().length < 3) errors.push(`${path}/${key}: required`);
  }
  if (!isCalendarDate(fact.date)) errors.push(`${path}/date: must be a calendar date`);
  if (typeof fact.tier !== "string" || !TIERS.includes(fact.tier)) errors.push(`${path}/tier: unsupported verification tier`);
  return errors;
}

/** Every fact of an access record, flattened in display order. */
export function accessFacts(record: WorkplaceAccess): Array<{ key: AccessFactKey; fact: AccessFact<boolean> | AccessFact<number> }> {
  return [
    { key: "stepFreeEntry", fact: record.stepFreeEntry },
    { key: "accessibleWashroom", fact: record.accessibleWashroom },
    { key: "heightAdjustableDesk", fact: record.workstation.heightAdjustableDesk },
    { key: "kneeClearanceMm", fact: record.workstation.kneeClearanceMm },
    { key: "aisleClearWidthMm", fact: record.workstation.aisleClearWidthMm },
    { key: "stepFreeRouteFromEntry", fact: record.workstation.stepFreeRouteFromEntry },
  ];
}

function accessRecordErrors(record: unknown): string[] {
  const path = "/accessRecord";
  if (!isObject(record)) return [`${path}: must be an access record or null`];
  const errors: string[] = [];
  for (const key of Object.keys(record)) {
    if (!["recordId", "stepFreeEntry", "accessibleWashroom", "workstation"].includes(key)) errors.push(`${path}/${key}: unexpected field`);
  }
  if (typeof record.recordId !== "string" || !/^[a-z0-9-]{3,}$/.test(record.recordId)) errors.push(`${path}/recordId: required`);
  errors.push(...factErrors(`${path}/stepFreeEntry`, record.stepFreeEntry, "boolean"));
  errors.push(...factErrors(`${path}/accessibleWashroom`, record.accessibleWashroom, "boolean"));
  const workstation = record.workstation;
  if (!isObject(workstation)) return [...errors, `${path}/workstation: required`];
  const workstationKeys: AccessFactKey[] = ["heightAdjustableDesk", "kneeClearanceMm", "aisleClearWidthMm", "stepFreeRouteFromEntry"];
  for (const key of Object.keys(workstation)) {
    if (!workstationKeys.includes(key as AccessFactKey)) errors.push(`${path}/workstation/${key}: unexpected field`);
  }
  for (const key of workstationKeys) {
    errors.push(...factErrors(`${path}/workstation/${key}`, workstation[key], BOOLEAN_KEYS.includes(key) ? "boolean" : "number"));
  }
  return errors;
}

export function listingRecordErrors(value: unknown): string[] {
  if (!isObject(value)) return ["/: must be an object"];
  const errors: string[] = [];
  for (const key of Object.keys(value)) {
    if (!["schemaVersion", "listing", "accessRecord"].includes(key)) errors.push(`/${key}: unexpected field`);
  }
  if (value.schemaVersion !== "employment-listing-record-1.0.0") errors.push("/schemaVersion: unsupported");
  const inner = listingErrors(value.listing);
  errors.push(...inner.map((error) => `/listing${error}`));
  if (value.accessRecord === undefined) errors.push("/accessRecord: required (use null when no access record exists)");
  else if (value.accessRecord !== null) errors.push(...accessRecordErrors(value.accessRecord));
  else if (inner.length === 0) {
    // With no access record, the listing itself must not carry an access claim.
    const summary = (value.listing as EmploymentListing).access;
    for (const key of ["stepFreeEntry", "accessibleWashroom", "workstation"] as const) {
      if (summary[key].value !== UNKNOWN) errors.push(`/listing/access/${key}: must be "Unknown" when there is no access record`);
    }
  }
  return errors;
}

export function assertListingRecord(value: unknown): asserts value is ListingRecord {
  const errors = listingRecordErrors(value);
  if (errors.length) throw new Error(`Invalid listing record: ${errors.join("; ")}`);
}

export type AccessLabel =
  /** No access record: shown, labelled unverified, every fact Unknown. */
  | "unverified-no-record"
  /** A record is attached but every fact in it is Unknown. */
  | "unverified-all-unknown"
  /** A record is attached with some values; none are verified by the App. */
  | "unverified-record-attached";

export interface DisplayFact {
  key: AccessFactKey;
  value: boolean | number | Unknown;
  /** Null when there is no access record to cite. */
  provenance: { source: string; licence: string; date: string; tier: PrototypeTier } | null;
}

export interface ListingPresentation {
  record: ListingRecord;
  label: AccessLabel;
  /** No tier in this package is a verification by the App. */
  verified: false;
  knownCount: number;
  unknownCount: number;
  facts: DisplayFact[];
}

export function presentListing(record: ListingRecord): ListingPresentation {
  const facts: DisplayFact[] = record.accessRecord
    ? accessFacts(record.accessRecord).map(({ key, fact }) => ({
        key,
        value: fact.value,
        provenance: { source: fact.source, licence: fact.licence, date: fact.date, tier: fact.tier },
      }))
    : ACCESS_FACT_KEYS.map((key) => ({ key, value: UNKNOWN, provenance: null }));
  const knownCount = facts.filter((fact) => fact.value !== UNKNOWN).length;
  const label: AccessLabel = !record.accessRecord
    ? "unverified-no-record"
    : knownCount === 0 ? "unverified-all-unknown" : "unverified-record-attached";
  return { record, label, verified: false, knownCount, unknownCount: facts.length - knownCount, facts };
}

/**
 * Presents every listing, in the order given. A listing is never dropped for
 * lacking an access record, and nothing is ranked by access.
 */
export function presentListings(records: readonly ListingRecord[]): ListingPresentation[] {
  return records.map(presentListing);
}
