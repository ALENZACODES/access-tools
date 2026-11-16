import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import schema from "./schema.json";

export const FIELDS = [
  "doorClearWidthMm", "stepHeightMm", "thresholdHeightMm", "turningDiameterMm",
  "transferClearanceMm", "rampWidthMm", "liftDoorWidthMm", "parkingAisleWidthMm",
] as const;
export type Field = (typeof FIELDS)[number];
export type Role = "auditor" | "venue-owner";
export type Action = "measurement" | "claim" | "acknowledge" | "fix" | "dispute";

/** Same provenance field names as packages/place; tier 0 means no verification. */
export interface Provenance {
  sourceName: string;
  sourceId: string;
  licence: string;
  sourceDate: string;
  recordDate: string;
  retrievedAt: string;
  tier: 0;
  prototypeLabel: "PROTOTYPE-UNVERIFIED";
  verifierType: "fixture-author";
}
export interface Fact {
  field: Field;
  value: number | null;
  provenance: Provenance;
  photoIds: string[];
}
export interface LocalPhoto { id: string; localFilename: string; description: string }
export interface AuditEvent {
  id: string;
  venueId: string;
  actor: Role;
  action: Action;
  detail: string;
  at: string;
}
export interface Audit {
  id: string;
  venueId: string;
  label: "PROTOTYPE-UNVERIFIED";
  facts: Fact[];
  photos: LocalPhoto[];
  events: AuditEvent[];
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);
export function isAudit(input: unknown): input is Audit {
  return validate(input) === true && consistent(input as unknown as Audit);
}

function consistent(audit: Audit): boolean {
  const ids = new Set(audit.photos.map((photo) => photo.id));
  return ids.size === audit.photos.length &&
    audit.facts.every((fact) => fact.photoIds.every((id) => ids.has(id))) &&
    audit.events.every((event) => event.venueId === audit.venueId) &&
    new Set(audit.events.map((event) => event.id)).size === audit.events.length;
}

export function blankAudit(venueId: string): Audit {
  if (!venueId.startsWith("demo-")) throw new Error("Demonstration venues only");
  return { id: `audit-${venueId}`, venueId, label: "PROTOTYPE-UNVERIFIED", facts: [], photos: [], events: [] };
}

export function appendEvent(audit: Audit, event: AuditEvent): Audit {
  if (event.venueId !== audit.venueId || audit.events.some((item) => item.id === event.id)) {
    throw new Error("Invalid audit event");
  }
  return { ...audit, events: [...audit.events, event].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id)) };
}

export function saveFact(audit: Audit, fact: Fact, event: AuditEvent, photo?: LocalPhoto): Audit {
  const photos = photo ? [...audit.photos.filter((item) => item.id !== photo.id), photo] : audit.photos;
  const next = appendEvent({ ...audit, photos, facts: [...audit.facts.filter((item) => item.field !== fact.field), fact] }, event);
  if (!isAudit(next)) throw new Error("Invalid audit capture");
  return next;
}

export function newProvenance(date: string, sourceId: string): Provenance {
  return {
    sourceName: "On-device demonstration entry", sourceId, licence: "User-authored demonstration; no reuse grant",
    sourceDate: date, recordDate: date, retrievedAt: date, tier: 0,
    prototypeLabel: "PROTOTYPE-UNVERIFIED", verifierType: "fixture-author",
  };
}

export const TARGET_DAYS = 5;
export interface ServiceReport { submissions: number; responded: number; misses: number; pending: number }
/** Demonstration only. There is no live triage, assignment, or performance record. */
export function serviceReport(audit: Audit, asOf: Date): ServiceReport {
  const submitted = audit.events.filter((e) => e.action === "fix" || e.action === "dispute");
  return {
    submissions: submitted.length,
    responded: 0,
    pending: submitted.length,
    misses: submitted.filter((e) => asOf.getTime() - Date.parse(e.at) > TARGET_DAYS * 86400000).length,
  };
}
