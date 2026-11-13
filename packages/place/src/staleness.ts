import type { DatasetStatus, Lang, Provenance, VerificationTier } from "./types.js";

export type FreshnessLayer = "washroom" | "venue" | "policy" | "charging" | "repair" | "parking";

export interface Freshness {
  state: "not-checked" | "import" | "within-estimate" | "stale" | "live-age-unknown";
  ageDays: number | null;
  limitDays: number | null;
  text: string;
}

export function daysBetween(sourceDate: string, today: string): number | null {
  const start = Date.parse(`${sourceDate}T00:00:00Z`);
  const end = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.floor((end - start) / 86_400_000);
}

/**
 * Freshness windows follow Part 1 section 5.5.
 * The day counts are the plan's estimates. A stale field stays visible.
 */
export function limitDays(tier: VerificationTier, layer: FreshnessLayer): number | null {
  if (tier === "tier-0-open-data" || tier === "tier-4-live-feed") return null;
  if (tier === "tier-1-business-claimed") return 180;
  if (tier === "tier-2-peer") return layer === "washroom" ? 90 : 180;
  return 365;
}

export function tierPhrase(tier: VerificationTier, dataset: DatasetStatus, lang: Lang): string {
  const name = tierName(tier, lang);
  if (dataset === "labelled-fixture") {
    return lang === "fr"
      ? `${name}. Jeu d'essai étiqueté. Non vérifié par l'application.`
      : `${name}. Labelled fixture. Unverified by the App.`;
  }
  if (dataset === "prototype-seed") {
    return lang === "fr"
      ? `${name}. Graine de prototype. Non vérifié par l'application.`
      : `${name}. Prototype seed. Unverified by the App.`;
  }
  switch (tier) {
    case "tier-3-surveyor":
      return lang === "fr" ? "Vérifié par un enquêteur" : "Verified by surveyor";
    case "tier-2-peer":
      return lang === "fr" ? "Signalé par un pair" : "Peer-reported";
    case "tier-1-business-claimed":
      return lang === "fr" ? "Déclaré par le lieu, non vérifié" : "Business-claimed, unverified";
    case "tier-0-open-data":
      return lang === "fr"
        ? "Import de données ouvertes, non vérifié par l'application"
        : "Open-data import, unverified by the App";
    case "tier-4-live-feed":
      return lang === "fr" ? "Statut en direct" : "Live status";
    default:
      return name;
  }
}

function tierName(tier: VerificationTier, lang: Lang): string {
  const en: Record<VerificationTier, string> = {
    "tier-0-open-data": "Tier 0 open-data",
    "tier-1-business-claimed": "Tier 1 business-claimed",
    "tier-2-peer": "Tier 2 peer",
    "tier-3-surveyor": "Tier 3 surveyor",
    "tier-4-live-feed": "Tier 4 live feed",
  };
  const fr: Record<VerificationTier, string> = {
    "tier-0-open-data": "Niveau 0 données ouvertes",
    "tier-1-business-claimed": "Niveau 1 déclaration du lieu",
    "tier-2-peer": "Niveau 2 pair",
    "tier-3-surveyor": "Niveau 3 enquêteur",
    "tier-4-live-feed": "Niveau 4 flux en direct",
  };
  return lang === "fr" ? fr[tier] : en[tier];
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
  if (provenance.tier === "tier-0-open-data" || provenance.verifierType === "fixture-author") {
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
  if (provenance.tier === "tier-4-live-feed") {
    const observed = provenance.observedAt
      ? lang === "fr"
        ? `Horodatage du flux : ${provenance.observedAt}.`
        : `Feed timestamp: ${provenance.observedAt}.`
      : lang === "fr"
        ? "L'âge en minutes est inconnu."
        : "Age in minutes is unknown.";
    return { state: "live-age-unknown", ageDays, limitDays: null, text: observed };
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
