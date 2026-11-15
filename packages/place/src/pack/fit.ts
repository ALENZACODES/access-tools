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

/** All five observations stay visible, including needs absent from the saved profile. */
export function fitWithProfile(place: PackPlaceProjection, profile: EquipmentProfile | null): FitItem[] {
  const needs: FitNeed[] = ["stepFree", "washroom", "doorWidth", "changeTable", "parking"];
  return needs.map((need) => {
    const detail = place.facts[need];
    let status = booleanStatus(detail.value);
    if (need === "doorWidth") {
      status = "unknown";
      const required = profile?.widthMm;
      const raw = detail.value;
      const parsed = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw.replace(/\s*mm\s*$/i, "")) : NaN;
      const measuredMm = detail.key.endsWith("_mm") ? parsed : parsed <= 10 ? parsed * 1000 : parsed;
      if (required !== null && required !== undefined && Number.isFinite(measuredMm) && measuredMm > 0) {
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
