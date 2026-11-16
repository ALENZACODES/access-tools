/**
 * Photo-referenced audit observations and the rules that turn them into a tier.
 *
 * An audit of a place is a set of field observations. Each observation is a
 * measured value or Unknown, with who observed it (role and a local observer
 * id), when, an optional photo reference (metadata only), and its source.
 *
 * Rules, in short:
 * - Unknown supports tier 0 and is never read as zero.
 * - One observation on its own supports tier 1 at most.
 * - Tier 2 needs two agreeing measurements from two different observers, and
 *   at least one of them must not be the venue operator.
 * - Tier 3 needs a trained verifier's measurement with a photo reference, a
 *   method and a protocol version, accepted in review by a different person.
 *   An unreviewed observation never reaches tier 3.
 * - Every tier has a freshness window. An observation older than the window
 *   stops supporting that tier, so an old audit drops tier and is flagged.
 * - A later disagreeing observation does not replace the record. It marks the
 *   field as contested and in need of a re-check.
 */
import { FIELDS } from "./model.js";
import type { Field } from "./model.js";
import { OBSERVER_ROLES, daysBetween, isDay, windowDays } from "./tiers.js";
import type { AuditTier, ObserverRole } from "./tiers.js";

export interface PhotoRef {
  id: string;
  /** A file name on the observer's device. No path, no upload. */
  localFilename: string;
  description: string;
  takenOn: string;
}
export interface ObservationReview {
  reviewerId: string;
  reviewedOn: string;
  outcome: "accepted" | "rejected";
}
export interface ObservationSource {
  sourceName: string;
  sourceId: string;
  licence: string;
  recordDate: string;
}
export interface FieldObservation {
  id: string;
  placeId: string;
  field: Field;
  /** Millimetres. Null means Unknown. */
  value: number | null;
  observerRole: ObserverRole;
  /** Local identifier used only to tell observers apart. Not a name. */
  observerId: string;
  observedOn: string;
  photo?: PhotoRef;
  method?: string;
  protocolVersion?: string;
  review?: ObservationReview;
  source: ObservationSource;
  /** "fixture" is a labelled sample. "device" was entered on this device. Neither is a verified record. */
  origin: "fixture" | "device";
  label: "PROTOTYPE-UNVERIFIED";
}

export type ObservationProblem =
  | "id" | "place" | "field" | "value" | "role" | "observer" | "observed-on" | "observed-in-future"
  | "photo" | "photo-filename" | "review" | "self-review" | "review-before-observation" | "source" | "label";

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Every reason an observation cannot be stored. An empty list means it is well formed. */
export function observationProblems(input: FieldObservation, today: string): ObservationProblem[] {
  const out: ObservationProblem[] = [];
  if (!text(input.id)) out.push("id");
  if (!text(input.placeId)) out.push("place");
  if (!FIELDS.includes(input.field)) out.push("field");
  if (input.value !== null && (typeof input.value !== "number" || !Number.isFinite(input.value) || input.value < 0)) out.push("value");
  if (!OBSERVER_ROLES.includes(input.observerRole)) out.push("role");
  if (!text(input.observerId)) out.push("observer");
  if (!isDay(input.observedOn)) out.push("observed-on");
  else if (isDay(today) && input.observedOn > today) out.push("observed-in-future");
  if (input.photo !== undefined) {
    const photo = input.photo;
    if (!text(photo.id) || !text(photo.description) || !isDay(photo.takenOn)) out.push("photo");
    if (!text(photo.localFilename) || /[\\/]/.test(photo.localFilename)) out.push("photo-filename");
  }
  if (input.review !== undefined) {
    const review = input.review;
    if (!text(review.reviewerId) || !isDay(review.reviewedOn) || (review.outcome !== "accepted" && review.outcome !== "rejected")) out.push("review");
    else {
      if (review.reviewerId === input.observerId) out.push("self-review");
      if (isDay(input.observedOn) && review.reviewedOn < input.observedOn) out.push("review-before-observation");
    }
  }
  const source = input.source;
  if (!source || !text(source.sourceName) || !text(source.sourceId) || !text(source.licence) || !isDay(source.recordDate)) out.push("source");
  if (input.label !== "PROTOTYPE-UNVERIFIED" || (input.origin !== "fixture" && input.origin !== "device")) out.push("label");
  return out;
}

export function isObservation(input: unknown, today: string): input is FieldObservation {
  if (input === null || typeof input !== "object") return false;
  try {
    return observationProblems(input as FieldObservation, today).length === 0;
  } catch {
    return false;
  }
}

/**
 * The highest tier one observation can support with nothing beside it.
 * Only 0, 1 or 3 are possible here: tier 2 always needs a second observer.
 */
export function observationCeiling(observation: FieldObservation): AuditTier {
  if (observation.value === null) return 0;
  if (observation.review?.outcome === "rejected") return 0;
  const reviewed =
    observation.review?.outcome === "accepted" && observation.review.reviewerId !== observation.observerId;
  const evidenced =
    observation.observerRole === "trained_verifier" &&
    observation.photo !== undefined &&
    text(observation.method) &&
    text(observation.protocolVersion);
  return reviewed && evidenced ? 3 : 1;
}

export interface TierRules {
  /** Two measurements agree when they differ by no more than this many millimetres. */
  agreementToleranceMm: number;
  /** Share of a freshness window after which a field is flagged as ageing. */
  ageingFraction: number;
}
/** Proposed defaults. They are configuration, not a published commitment. */
export const DEFAULT_TIER_RULES: TierRules = { agreementToleranceMm: 10, ageingFraction: 0.75 };

export type Basis = "none" | "unknown-recorded" | "single" | "corroborated" | "reviewed-survey" | "stale";
export type FreshnessState = "no-observation" | "current" | "ageing" | "stale";

export interface FieldAssessment {
  field: Field;
  /** Millimetres, or null for Unknown. A stale value stays visible with tier 0. */
  value: number | null;
  tier: AuditTier;
  basis: Basis;
  supportingIds: string[];
  /** Date of the oldest observation the tier rests on. */
  restsOn: string | null;
  ageDays: number | null;
  /** Freshness window for the tier in force, or for the lapsed tier when stale. */
  limitDays: number | null;
  freshness: FreshnessState;
  /** The tier the same observations supported on the day of the newest one, when that was higher. */
  lapsedTier: AuditTier | null;
  /** A usable observation disagrees with the value shown. The record is not changed by it. */
  contested: boolean;
  needsRecheck: boolean;
  observationCount: number;
}

interface Pick {
  tier: AuditTier;
  basis: Basis;
  value: number | null;
  ids: string[];
  restsOn: string | null;
}

function newestFirst(a: FieldObservation, b: FieldObservation): number {
  return b.observedOn.localeCompare(a.observedOn) || a.id.localeCompare(b.id);
}

function within(observation: FieldObservation, tier: AuditTier, today: string): boolean {
  const limit = windowDays(tier, observation.field);
  const age = daysBetween(observation.observedOn, today);
  return limit === null || (age !== null && age <= limit);
}

function agree(a: number, b: number, rules: TierRules): boolean {
  return Math.abs(a - b) <= rules.agreementToleranceMm;
}

/** Best supported tier on a given day. Only observations inside each tier's window count. */
function pick(usable: FieldObservation[], rules: TierRules, today: string): Pick {
  const inWindow = (tier: AuditTier) => usable.filter((o) => within(o, tier, today));
  const surveyed = inWindow(3).filter((o) => observationCeiling(o) === 3)[0];
  if (surveyed) {
    return { tier: 3, basis: "reviewed-survey", value: surveyed.value, ids: [surveyed.id], restsOn: surveyed.observedOn };
  }
  const measured2 = inWindow(2).filter((o) => o.value !== null);
  for (const anchor of measured2) {
    const partner = measured2.find(
      (o) =>
        o.observerId !== anchor.observerId &&
        !(o.observerRole === "operator" && anchor.observerRole === "operator") &&
        agree(o.value as number, anchor.value as number, rules),
    );
    if (partner) {
      const group = measured2.filter((o) => agree(o.value as number, anchor.value as number, rules));
      const older = anchor.observedOn < partner.observedOn ? anchor : partner;
      return { tier: 2, basis: "corroborated", value: anchor.value, ids: group.map((o) => o.id), restsOn: older.observedOn };
    }
  }
  const single = inWindow(1).filter((o) => o.value !== null)[0];
  if (single) return { tier: 1, basis: "single", value: single.value, ids: [single.id], restsOn: single.observedOn };
  const unknown = inWindow(1).filter((o) => o.value === null)[0];
  if (unknown) return { tier: 0, basis: "unknown-recorded", value: null, ids: [unknown.id], restsOn: unknown.observedOn };
  return { tier: 0, basis: "none", value: null, ids: [], restsOn: null };
}

/** Applies the tier, corroboration and freshness rules to one field of one place. */
export function assessField(
  observations: readonly FieldObservation[],
  placeId: string,
  field: Field,
  today: string,
  rules: TierRules = DEFAULT_TIER_RULES,
): FieldAssessment {
  const usable = observations
    .filter((o) => o.placeId === placeId && o.field === field)
    .filter((o) => observationProblems(o, today).length === 0 && o.review?.outcome !== "rejected")
    .sort(newestFirst);
  const base = { field, observationCount: usable.length };
  if (usable.length === 0) {
    return {
      ...base, value: null, tier: 0, basis: "none", supportingIds: [], restsOn: null, ageDays: null, limitDays: null,
      freshness: "no-observation", lapsedTier: null, contested: false, needsRecheck: false,
    };
  }
  // What the same observations supported on the day the newest one was made.
  const undecayed = pick(usable, rules, (usable[0] as FieldObservation).observedOn);
  const now = pick(usable, rules, today);
  const lapsedTier = undecayed.tier > now.tier ? undecayed.tier : null;

  if (now.basis === "none") {
    // Everything on file is older than its window. The last value stays visible, at tier 0.
    const limit = undecayed.tier === 0 ? windowDays(1, field) : windowDays(undecayed.tier, field);
    return {
      ...base, value: undecayed.value, tier: 0, basis: "stale", supportingIds: undecayed.ids, restsOn: undecayed.restsOn,
      ageDays: undecayed.restsOn ? daysBetween(undecayed.restsOn, today) : null, limitDays: limit,
      freshness: "stale", lapsedTier, contested: false, needsRecheck: true,
    };
  }

  const limit = windowDays(now.tier === 0 ? 1 : now.tier, field);
  const ageDays = now.restsOn ? daysBetween(now.restsOn, today) : null;
  const ageing = limit !== null && ageDays !== null && ageDays > limit * rules.ageingFraction;
  const supporting = new Set(now.ids);
  const newest = usable.find((o) => supporting.has(o.id));
  const newestSupport = newest?.observedOn ?? "";
  const shown = now.value;
  const contested =
    shown !== null &&
    usable.some(
      (o) =>
        !supporting.has(o.id) &&
        o.value !== null &&
        within(o, 1, today) &&
        !agree(o.value, shown, rules) &&
        // An uncorroborated value is contested by any other observer; a corroborated one only by later evidence.
        (now.tier <= 1 ? o.observerId !== newest?.observerId : o.observedOn >= newestSupport),
    );
  return {
    ...base, value: shown, tier: now.tier, basis: now.basis, supportingIds: now.ids, restsOn: now.restsOn, ageDays,
    limitDays: limit, freshness: ageing ? "ageing" : "current", lapsedTier, contested,
    needsRecheck: contested || ageing || lapsedTier !== null,
  };
}

/** One assessment per catalogue field. A field with no observation is Unknown at tier 0. */
export function assessPlace(
  observations: readonly FieldObservation[],
  placeId: string,
  today: string,
  rules: TierRules = DEFAULT_TIER_RULES,
): FieldAssessment[] {
  return FIELDS.map((field) => assessField(observations, placeId, field, today, rules));
}
