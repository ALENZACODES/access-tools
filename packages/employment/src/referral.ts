import { depthCatalog } from "./depthCatalog.js";
import type { DepthCopy } from "./depthCatalog.js";
import type { CommuteItem, CommuteReport } from "./commute.js";
import { UNKNOWN, isCalendarDate, presentListing } from "./record.js";
import type { AccessLabel, DisplayFact, ListingRecord } from "./record.js";
import type { Bilingual, Language } from "./types.js";

/**
 * Consent-based hand-off to a partner organisation's employment programme.
 * The summary is built in memory on the device. Nothing in this module sends,
 * stores or uploads it; the person shares the text themselves if they choose.
 */
export const NOTE_LIMIT = 500;
export const REFERRAL_SECTIONS = ["listing", "accessFacts", "commute", "note"] as const;
export type ReferralSection = (typeof REFERRAL_SECTIONS)[number];

export interface ReferralConsent {
  include: Record<ReferralSection, boolean>;
  /** The person's explicit confirmation. Without it no summary is produced. */
  confirmed: boolean;
}

export interface ReferralSummary {
  schemaVersion: "employment-referral-summary-1.0.0";
  createdOn: string;
  destination: "a partner organisation's employment programme";
  sentByApp: false;
  eligibilityAssessed: false;
  sections: {
    listing?: { id: string; kind: "job" | "programme"; title: Bilingual; organisation: Bilingual; city: Bilingual; demonstration: true };
    accessFacts?: { label: AccessLabel; verified: false; facts: DisplayFact[] };
    commute?: { completed: boolean; items: CommuteItem[]; routeConfirmed: false };
    note?: string;
  };
  omitted: ReferralSection[];
}

export type ReferralFailure = "consent-not-confirmed" | "nothing-selected" | "note-too-long" | "invalid-date";
export type ReferralResult = { ok: true; summary: ReferralSummary } | { ok: false; reason: ReferralFailure };

export interface ReferralRequest {
  record: ListingRecord;
  consent: ReferralConsent;
  /** Calendar date supplied by the caller (YYYY-MM-DD). */
  createdOn: string;
  commute?: CommuteReport | null;
  note?: string;
}

export function buildReferralSummary(request: ReferralRequest): ReferralResult {
  const { record, consent } = request;
  if (consent.confirmed !== true) return { ok: false, reason: "consent-not-confirmed" };
  if (!isCalendarDate(request.createdOn)) return { ok: false, reason: "invalid-date" };
  const note = (request.note ?? "").trim();
  if (consent.include.note && note.length > NOTE_LIMIT) return { ok: false, reason: "note-too-long" };
  // An empty note is nothing to share, so it does not count as a selection.
  const chosen = REFERRAL_SECTIONS.filter((section) => consent.include[section] === true && (section !== "note" || note.length > 0));
  if (chosen.length === 0) return { ok: false, reason: "nothing-selected" };

  const sections: ReferralSummary["sections"] = {};
  if (chosen.includes("listing")) {
    const { id, kind, title, organisation, location } = record.listing;
    sections.listing = { id, kind, title: { ...title }, organisation: { ...organisation }, city: { ...location.city }, demonstration: true };
  }
  if (chosen.includes("accessFacts")) {
    const shown = presentListing(record);
    sections.accessFacts = { label: shown.label, verified: false, facts: shown.facts.map((fact) => ({ ...fact, provenance: fact.provenance ? { ...fact.provenance } : null })) };
  }
  if (chosen.includes("commute")) {
    sections.commute = { completed: Boolean(request.commute), items: request.commute ? request.commute.items.map((item) => ({ ...item })) : [], routeConfirmed: false };
  }
  if (chosen.includes("note")) sections.note = note;
  return {
    ok: true,
    summary: {
      schemaVersion: "employment-referral-summary-1.0.0",
      createdOn: request.createdOn,
      destination: "a partner organisation's employment programme",
      sentByApp: false,
      eligibilityAssessed: false,
      sections,
      omitted: REFERRAL_SECTIONS.filter((section) => !chosen.includes(section)),
    },
  };
}

function yesNo(value: boolean, t: DepthCopy): string {
  return value ? t.yes : t.no;
}

export function describeFactValue(value: boolean | number | typeof UNKNOWN, t: DepthCopy): string {
  if (value === UNKNOWN) return t.unknown;
  return typeof value === "boolean" ? yesNo(value, t) : String(value);
}

/** One plain sentence per commute item, in the given language. */
export function describeCommuteItem(item: CommuteItem, language: Language): string {
  const t = depthCatalog[language];
  if (item.state === "unknown") return t.unknownItem(t.itemNames[item.key], t.missing[item.missing]);
  switch (item.key) {
    case "mode": return t.youEntered(t.itemNames.mode, t.modes[item.mode]);
    case "travelTime": return (item.finding === "within-your-limit" ? t.travelWithin : t.travelOver)(item.travelMinutes, item.maxMinutes);
    case "serviceHours":
      return (item.finding === "shift-inside-hours" ? t.hoursInside : t.hoursOutside)(`${item.shiftStart}–${item.shiftEnd}`, `${item.serviceStart}–${item.serviceEnd}`);
    case "winter": return item.finding === "you-checked" ? t.winterChecked : t.winterNotChecked;
    case "workplaceEntry": return t.entryRecorded(yesNo(item.stepFree, t), item.source, item.date, item.tier);
    case "planOutcome": return `${item.outcome === "route-found" ? t.planRouteFound : t.planNoRoute} ${t.planCitation(item.source, item.computedOn)}`;
    case "planDuration": return `${t.planDuration(item.durationMinutes)} ${t.planCitation(item.source, item.computedOn)}`;
    case "planStepFree": return `${t.planStepFree(yesNo(item.stepFree, t))} ${t.planCitation(item.source, item.computedOn)}`;
    case "planWinter": return `${item.assessed ? t.planWinterYes : t.planWinterNo} ${t.planCitation(item.source, item.computedOn)}`;
  }
}

/** Plain-text rendering the person can copy, save or print. */
export function referralText(summary: ReferralSummary, language: Language): string {
  const t = depthCatalog[language];
  const colon = language === "fr" ? " :" : ":";
  const lines: string[] = [t.text.title, `${t.text.createdOn}${colon} ${summary.createdOn}`, t.text.boundary];
  const { listing, accessFacts, commute, note } = summary.sections;
  if (listing) {
    lines.push("", t.text.listing, t.text.demonstration,
      `${t.text.title2}${colon} ${listing.title[language]}`,
      `${t.text.organisation}${colon} ${listing.organisation[language]}`,
      `${t.text.city}${colon} ${listing.city[language]}`);
  }
  if (accessFacts) {
    lines.push("", t.text.access, t.accessLabels[accessFacts.label]);
    for (const fact of accessFacts.facts) {
      const cited = fact.provenance
        ? `${t.source}${colon} ${fact.provenance.source}; ${t.date}${colon} ${fact.provenance.date}; ${t.licence}${colon} ${fact.provenance.licence}; ${t.tier}${colon} ${fact.provenance.tier}`
        : t.noProvenance;
      lines.push(`- ${t.facts[fact.key]}${colon} ${describeFactValue(fact.value, t)} (${cited})`);
    }
  }
  if (commute) {
    lines.push("", t.text.commute);
    if (!commute.completed) lines.push(t.text.commuteNotRun);
    for (const item of commute.items) lines.push(`- ${describeCommuteItem(item, language)}`);
  }
  if (note !== undefined) lines.push("", t.text.note, note);
  if (summary.omitted.length) {
    lines.push("", `${t.text.omitted}${colon} ${summary.omitted.map((section) => t.text.sections[section]).join(", ")}`);
  }
  return lines.join("\n");
}
