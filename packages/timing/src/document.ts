import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import schema from "./schema/timing-document.schema.json" with { type: "json" };
import type { TimingDocument } from "./types.js";

const FORBIDDEN_KEYS = [
  "diagnosis",
  "injurylevel",
  "ais",
  "aisgrade",
  "catheter",
  "medication",
  "bladder",
  "bowel",
  "pressureinjury",
  "pressurerelief",
  "pressurereliefeverymin",
  "symptom",
  "bloodpressure",
  "clinicaldefault",
  "uti",
];

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

export function blankTimingDocument(): TimingDocument {
  return {
    schemaVersion: "timing-constraints-1.0.0",
    maxTimeBetweenWashroomsMin: null,
    maxContinuousTravelMin: null,
    restBreakEveryMin: null,
    reminderLeadMin: null,
    updatedAt: null,
  };
}

function walkKeys(value: unknown, found: string[]): void {
  if (Array.isArray(value)) {
    for (const item of value) walkKeys(item, found);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      found.push(key);
      walkKeys(child, found);
    }
  }
}

export function assertNoHealthFields(value: unknown): void {
  const keys: string[] = [];
  walkKeys(value, keys);
  const hit = keys.find((key) => FORBIDDEN_KEYS.includes(key.toLowerCase().replace(/[^a-z]/g, "")));
  if (hit) {
    throw new Error(`Timing data cannot store "${hit}". Health and clinical fields are refused.`);
  }
}

export function parseTimingDocument(input: unknown, now = new Date()): TimingDocument {
  assertNoHealthFields(input);
  if (!validate(input)) {
    const detail = validate.errors?.map((error) => `${error.instancePath} ${error.message}`).join("; ");
    throw new Error(`Timing document is not valid. ${detail ?? ""}`.trim());
  }
  const document = input as unknown as TimingDocument;
  if (
    document.reminderLeadMin != null &&
    document.maxTimeBetweenWashroomsMin != null &&
    document.reminderLeadMin > document.maxTimeBetweenWashroomsMin
  ) {
    throw new Error("Reminder lead cannot be longer than the washroom interval you set.");
  }
  return {
    ...document,
    updatedAt: document.updatedAt ?? now.toISOString(),
  };
}

export function constraintsAreSet(document: TimingDocument): boolean {
  return (
    document.maxTimeBetweenWashroomsMin != null ||
    document.maxContinuousTravelMin != null ||
    document.restBreakEveryMin != null
  );
}
