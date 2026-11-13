import { verifiedLabelAllowed } from "./evidence.js";
import { copy, phrase } from "./i18n.js";
import type { DatasetStatus, Lang, Provenance, PublicationContext, VerificationTier } from "./types.js";

export type FreshnessLayer = "washroom" | "venue" | "policy" | "charging" | "repair" | "parking";

export interface Freshness {
  state: "not-checked" | "import" | "within-estimate" | "stale" | "live-age-unknown";
  ageDays: number | null;
  limitDays: number | null;
  text: string;
}

/**
 * Tier 4 is a live feed. Part 1 §5.5 puts that freshness in minutes to hours.
 * Past this threshold the status is unknown. It is not shown as still working.
 * The 30-day count is the T3-12/T3-13 snapshot, not live status.
 */
export const LIVE_STATUS_MAX_HOURS = 2;

/** Clock time plus Z or ±hh:mm. A bare "2026-11-13T14:00" is device-local and is not a live timestamp. */
export const CLOCK_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;

export function daysBetween(sourceDate: string, today: string): number | null {
  const start = Date.parse(`${sourceDate.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${today.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.floor((end - start) / 86_400_000);
}

/**
 * Freshness windows follow Part 1 section 5.5.
 * The day counts marked as estimates in the plan stay estimates. A stale field stays visible.
 */
export function limitDays(tier: VerificationTier, layer: FreshnessLayer): number | null {
  if (tier === 0 || tier === 4 || tier === "E") return null;
  if (tier === 1) return 180;
  if (tier === 2) return layer === "washroom" || layer === "charging" ? 90 : 180;
  if (tier === 3) return 365;
  return null;
}

function publicationOf(dataset: DatasetStatus, explicit?: PublicationContext): PublicationContext {
  return explicit ?? (dataset === "access-maps" ? "canonical" : "prototype");
}

/**
 * Verified wording requires tier 3 evidence and a canonical publication context.
 * A prototype record, including every labelled fixture, stays PROTOTYPE-UNVERIFIED.
 */
export function tierPhrase(
  provenance: Provenance,
  dataset: DatasetStatus,
  lang: Lang,
  publicationContext?: PublicationContext,
  options?: { requirePhoto?: boolean },
): string {
  const context = publicationOf(dataset, publicationContext);
  if (context === "prototype" || provenance.prototypeLabel === "PROTOTYPE-UNVERIFIED" || provenance.verifierType === "fixture-author") {
    if (dataset === "prototype-seed") return copy("tier.prototype-seed", lang);
    return copy("tier.fixture", lang);
  }
  if (verifiedLabelAllowed({ provenance, publicationContext: context, requirePhoto: options?.requirePhoto })) {
    return copy("tier.surveyor", lang);
  }
  if (provenance.tier === 3 || provenance.prototypeLabel === "VERIFIED") {
    return copy("tier.insufficient", lang);
  }
  if (provenance.prototypeLabel === "SEEDED-OPEN-DATA" || provenance.tier === 0) {
    return copy("tier.open-data", lang);
  }
  if (provenance.tier === 2 || provenance.prototypeLabel === "COMMUNITY-REPORTED") {
    return copy("tier.peer", lang);
  }
  if (provenance.tier === 1) return copy("tier.business", lang);
  if (provenance.tier === 4) return copy("tier.live", lang);
  if (provenance.tier === "E") return copy("tier.desk", lang);
  return copy("tier.unknown", lang);
}

export function freshness(provenance: Provenance | null, today: string, layer: FreshnessLayer, lang: Lang): Freshness {
  if (!provenance) {
    return {
      state: "not-checked",
      ageDays: null,
      limitDays: null,
      text: copy("fresh.none", lang),
    };
  }
  const ageDays = daysBetween(provenance.sourceDate, today);
  if (
    provenance.tier === 0 ||
    provenance.verifierType === "fixture-author" ||
    provenance.prototypeLabel === "PROTOTYPE-UNVERIFIED"
  ) {
    return {
      state: "import",
      ageDays,
      limitDays: null,
      text: copy("fresh.import", lang),
    };
  }
  if (provenance.tier === 4) {
    return liveFreshness(provenance, today, ageDays, lang);
  }
  const limit = limitDays(provenance.tier, layer);
  if (limit !== null && ageDays !== null && ageDays > limit) {
    return {
      state: "stale",
      ageDays,
      limitDays: limit,
      text: phrase("fresh.stale", lang, { limit }),
    };
  }
  return {
    state: "within-estimate",
    ageDays,
    limitDays: limit,
    text: limit === null ? copy("fresh.window", lang) : phrase("fresh.window-days", lang, { limit }),
  };
}

function clockMillis(value: string): number | null {
  if (!CLOCK_WITH_OFFSET.test(value)) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function liveFreshness(provenance: Provenance, today: string, ageDays: number | null, lang: Lang): Freshness {
  const observed = provenance.observedAt ? clockMillis(provenance.observedAt) : null;
  const checked = clockMillis(today);
  const expiry = provenance.expiresAt ? clockMillis(provenance.expiresAt) : null;
  const ageHours = observed !== null && checked !== null ? (checked - observed) / 3_600_000 : null;
  const pastExpiry = expiry !== null && checked !== null && expiry < checked;
  const fresh =
    ageHours !== null &&
    ageHours >= 0 &&
    ageHours <= LIVE_STATUS_MAX_HOURS &&
    expiry !== null &&
    checked !== null &&
    expiry >= checked;
  if (!fresh || pastExpiry) {
    return {
      state: "live-age-unknown",
      ageDays,
      limitDays: null,
      text: phrase("fresh.live-unknown", lang, { hours: LIVE_STATUS_MAX_HOURS }),
    };
  }
  return {
    state: "within-estimate",
    ageDays,
    limitDays: null,
      text: phrase("fresh.live-ok", lang, { observed: provenance.observedAt ?? "", hours: LIVE_STATUS_MAX_HOURS }),
  };
}

/** November through April. A summer clearance date is not a winter clearance. */
export function isWinterMonth(month: number): boolean {
  return month >= 11 || month <= 4;
}

export function winterClearanceText(clearedOn: string | null, month: number, lang: Lang): string {
  if (!isWinterMonth(month)) {
    if (!clearedOn) return copy("value.unknown", lang);
    return phrase("winter.last", lang, { date: clearedOn });
  }
  if (!clearedOn) return copy("winter.unknown", lang);
  return phrase("winter.recorded", lang, { date: clearedOn });
}
