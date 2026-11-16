import type { EquipmentProfile } from "../profile.js";
import type { PackDetail, PackPlaceProjection } from "./projection.js";

export type FitStatus = "known-yes" | "known-no" | "unknown";
export type FitNeed = "stepFree" | "washroom" | "doorWidth" | "changeTable" | "parking";

export interface FitItem {
  need: FitNeed;
  status: FitStatus;
  decidingField: string;
  detail: PackDetail;
}

const YES = new Set(["yes", "true", "1", "designated", "accessible"]);
const NO = new Set(["no", "false", "0", "not_accessible"]);

function booleanStatus(value: unknown): FitStatus {
  if (typeof value === "boolean") return value ? "known-yes" : "known-no";
  if (typeof value !== "string" && typeof value !== "number") return "unknown";
  const normalized = String(value).trim().toLowerCase();
  if (YES.has(normalized)) return "known-yes";
  if (NO.has(normalized)) return "known-no";
  return "unknown";
}


/** Convert a door-width value to millimetres only when the unit is explicit. Otherwise return null (Unknown). */
export function doorWidthMm(key: string, raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw <= 0) return null;
    return key.endsWith("_mm") ? raw : null;
  }
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  const mm = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)\s*mm$/i);
  if (mm) {
    const value = Number(mm[1]);
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  const cm = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)\s*cm$/i);
  if (cm) {
    const value = Number(cm[1]);
    return Number.isFinite(value) && value > 0 ? value * 10 : null;
  }
  const metres = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)\s*m$/i);
  if (metres) {
    const value = Number(metres[1]);
    return Number.isFinite(value) && value > 0 ? value * 1000 : null;
  }
  if (key.endsWith("_mm")) {
    const value = Number(trimmed);
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  return null;
}

/** All five observations stay visible, including needs absent from the saved profile. */
export function fitWithProfile(place: PackPlaceProjection, profile: EquipmentProfile | null): FitItem[] {
  const needs: FitNeed[] = ["stepFree", "washroom", "doorWidth", "changeTable", "parking"];
  return needs.map((need) => {
    const detail = place.facts[need];
    let status = booleanStatus(detail.value);
    if (need === "doorWidth") {
      status = "unknown";
      const required = profile?.widthMm;
      const measuredMm = doorWidthMm(detail.key, detail.value);
      if (required !== null && required !== undefined && measuredMm !== null) {
        status = measuredMm >= required ? "known-yes" : "known-no";
      }
    }
    // OSM wheelchair=limited is not a claim about the entrance.
    if (need === "stepFree" && detail.key === "wheelchair" && detail.value !== "yes" && detail.value !== "no") {
      status = "unknown";
    }
    return { need, status, decidingField: detail.key, detail };
  });
}
