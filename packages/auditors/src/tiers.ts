/**
 * Tier vocabulary for audits. The tier list and verifier roles are the canonical
 * ones from packages/place; this file only narrows them. It does not define a
 * second tier list.
 */
import { VERIFICATION_TIERS, VERIFIER_ROLES } from "../../place/src/types.js";
import type { VerificationTier, VerifierRole } from "../../place/src/types.js";
import { daysBetween, limitDays } from "../../place/src/staleness.js";
import type { FreshnessLayer } from "../../place/src/staleness.js";
import type { Field } from "./model.js";

export { VERIFICATION_TIERS, VERIFIER_ROLES, daysBetween, limitDays };
export type { FreshnessLayer, VerificationTier, VerifierRole };

/** Canonical tiers a field observation can support. Tier 4 (live) and E (desk check) are not field audits. */
export type AuditTier = Extract<VerificationTier, 0 | 1 | 2 | 3>;
export const AUDIT_TIERS: readonly AuditTier[] = VERIFICATION_TIERS.filter(
  (tier): tier is AuditTier => tier === 0 || tier === 1 || tier === 2 || tier === 3,
);

/** Canonical verifier roles that can stand at a place and measure. Importers and desk reviewers cannot. */
export type ObserverRole = Extract<VerifierRole, "trained_verifier" | "peer" | "operator">;
export const OBSERVER_ROLES: readonly ObserverRole[] = VERIFIER_ROLES.filter(
  (role): role is ObserverRole => role === "trained_verifier" || role === "peer" || role === "operator",
);

/** Freshness layer for each measured field; the windows themselves come from packages/place. */
export const FIELD_LAYER: Record<Field, FreshnessLayer> = {
  doorClearWidthMm: "venue",
  stepHeightMm: "venue",
  thresholdHeightMm: "venue",
  turningDiameterMm: "washroom",
  transferClearanceMm: "washroom",
  rampWidthMm: "venue",
  liftDoorWidthMm: "venue",
  parkingAisleWidthMm: "parking",
};

/** Days an observation keeps supporting a tier. Tier 0 has no window. */
export function windowDays(tier: AuditTier, field: Field): number | null {
  return limitDays(tier, FIELD_LAYER[field]);
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** A real calendar date written YYYY-MM-DD. */
export function isDay(value: unknown): value is string {
  if (typeof value !== "string" || !DAY.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
