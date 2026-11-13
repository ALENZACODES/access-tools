import { verifiedLabelAllowed } from "./evidence.js";
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
    if (dataset === "prototype-seed") {
      return lang === "fr"
        ? "PROTOTYPE-UNVERIFIED. Graine de prototype. Non vérifié par l'application."
        : "PROTOTYPE-UNVERIFIED. Prototype seed. Unverified by the App.";
    }
    return lang === "fr"
      ? "PROTOTYPE-UNVERIFIED. Jeu d'essai étiqueté. Non vérifié par l'application."
      : "PROTOTYPE-UNVERIFIED. Labelled fixture. Unverified by the App.";
  }
  if (verifiedLabelAllowed({ provenance, publicationContext: context, requirePhoto: options?.requirePhoto })) {
    return lang === "fr" ? "Vérifié par un enquêteur" : "Verified by surveyor";
  }
  if (provenance.tier === 3 || provenance.prototypeLabel === "VERIFIED") {
    return lang === "fr"
      ? "Niveau 3 sans preuve suffisante. Pas affiché comme vérifié. Il faut la version du protocole, le rôle de l'enquêteur, la méthode et la date de visite."
      : "Tier 3 without enough evidence. Not shown as verified. Protocol version, verifier role, method, and visit date are required.";
  }
  if (provenance.prototypeLabel === "SEEDED-OPEN-DATA" || provenance.tier === 0) {
    return lang === "fr"
      ? "SEEDED-OPEN-DATA. Import de données ouvertes, non vérifié par l'application."
      : "SEEDED-OPEN-DATA. Open-data import, unverified by the App.";
  }
  if (provenance.tier === 2 || provenance.prototypeLabel === "COMMUNITY-REPORTED") {
    return lang === "fr" ? "Signalé par un pair" : "Peer-reported";
  }
  if (provenance.tier === 1) {
    return lang === "fr" ? "Déclaré par le lieu, non vérifié" : "Business-claimed, unverified";
  }
  if (provenance.tier === 4) {
    return lang === "fr" ? "Statut en direct" : "Live status";
  }
  if (provenance.tier === "E") {
    return lang === "fr" ? "Vérification documentaire, sans décision d'admissibilité" : "Desk check, with no eligibility decision";
  }
  return lang === "fr" ? "Niveau inconnu" : "Unknown tier";
}

export function freshness(provenance: Provenance | null, today: string, layer: FreshnessLayer, lang: Lang): Freshness {
  if (!provenance) {
    return {
      state: "not-checked",
      ageDays: null,
      limitDays: null,
      text: lang === "fr" ? "Pas de source au dossier." : "No source on file.",
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
      text:
        lang === "fr"
          ? "Date de source affichée. Ce niveau n'est pas une vérification par l'application."
          : "Source date shown. This tier is not verification by the App.",
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
      text:
        lang === "fr"
          ? `Périmé selon l'estimation du plan (${limit} jours). La fiche reste affichée.`
          : `Stale under the plan's estimate (${limit} days). The field stays visible.`,
    };
  }
  return {
    state: "within-estimate",
    ageDays,
    limitDays: limit,
    text:
      lang === "fr"
        ? `Dans la fenêtre estimée du plan${limit === null ? "" : ` (${limit} jours)`}. Estimation, pas une garantie.`
        : `Within the plan's estimated window${limit === null ? "" : ` (${limit} days)`}. An estimate, not a guarantee.`,
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
      text:
        lang === "fr"
          ? `Statut en direct inconnu. Le flux est absent, sans horloge, expiré, ou plus vieux que ${LIVE_STATUS_MAX_HOURS} heures. Un statut périmé n'est pas affiché comme fonctionnel.`
          : `Live status unknown. The feed is missing, has no clock time, is expired, or is older than ${LIVE_STATUS_MAX_HOURS} hours. A stale status is not shown as working.`,
    };
  }
  return {
    state: "within-estimate",
    ageDays,
    limitDays: null,
    text:
      lang === "fr"
        ? `Horodatage du flux : ${provenance.observedAt}. Dans la fenêtre de ${LIVE_STATUS_MAX_HOURS} heures. Ce n'est pas une promesse que l'équipement fonctionne.`
        : `Feed timestamp: ${provenance.observedAt}. Within the ${LIVE_STATUS_MAX_HOURS}-hour window. This is not a promise the equipment is working.`,
  };
}

/** November through April. A summer clearance date is not a winter clearance. */
export function isWinterMonth(month: number): boolean {
  return month >= 11 || month <= 4;
}

export function winterClearanceText(clearedOn: string | null, month: number, lang: Lang): string {
  if (!isWinterMonth(month)) {
    if (!clearedOn) return lang === "fr" ? "Inconnu" : "Unknown";
    return lang === "fr"
      ? `Dernier déneigement enregistré : ${clearedOn}. L'étiquette d'hiver s'applique de novembre à avril.`
      : `Last recorded clearance: ${clearedOn}. The winter label applies from November through April.`;
  }
  if (!clearedOn) {
    return lang === "fr" ? "Déneigement hivernal inconnu" : "Winter clearance unknown";
  }
  return lang === "fr" ? `Déneigement enregistré le ${clearedOn}.` : `Clearance recorded on ${clearedOn}.`;
}
