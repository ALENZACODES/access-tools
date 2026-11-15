import type { EmploymentListing, SourcedFact } from "./types.js";
import { assertListing } from "./validate.js";

// A demonstration label is not a claim that a particular position is open.
// No workplace is measured, joined to a real place, or verified in these fixtures.
const unknown = (): SourcedFact => ({
  value: "Unknown",
  source: "Demonstration fixture; no workplace assessment",
  licence: "Original synthetic demonstration data; no external data reused",
  date: "2026-11-15",
  tier: "PROTOTYPE-UNVERIFIED",
});

const base = {
  schemaVersion: "employment-listing-1.0.0" as const,
  demonstration: true as const,
  officialUrl: "https://www.ontario.ca/page/employment-ontario",
  access: { stepFreeEntry: unknown(), accessibleWashroom: unknown(), workstation: unknown() },
  commute: { status: "Unknown" as const, reason: "engine-unavailable" as const },
  handoff: {
    url: "https://www.ontario.ca/page/employment-ontario",
    datedOn: "2026-11-15",
    note: {
      en: "Public information link only. You may independently contact a partner SCI organisation employment programme. No referral or application is sent by the App.",
      fr: "Lien d’information publique seulement. Vous pouvez communiquer vous-même avec un programme d’emploi d’un organisme partenaire en lésion médullaire. L’application n’envoie aucune demande ni recommandation.",
    },
  },
  relatedNavigatorIds: ["employment-ontario" as const],
};

export const DEMONSTRATION_LISTINGS: EmploymentListing[] = [
  {
    ...base,
    id: "demo-programme-toronto",
    kind: "programme",
    title: { en: "Employment support exploration (demonstration)", fr: "Exploration des soutiens à l’emploi (démonstration)" },
    organisation: { en: "Generic programme example", fr: "Exemple de programme générique" },
    location: { city: { en: "Toronto", fr: "Toronto" }, province: "ON" },
  },
  {
    ...base,
    id: "demo-job-ottawa",
    kind: "job",
    title: { en: "Office-work search example (not a vacancy)", fr: "Exemple de recherche d’emploi de bureau (aucun poste à pourvoir)" },
    organisation: { en: "Fictional demonstration employer", fr: "Employeur fictif de démonstration" },
    location: { city: { en: "Ottawa", fr: "Ottawa" }, province: "ON" },
    access: { stepFreeEntry: unknown(), accessibleWashroom: unknown(), workstation: unknown() },
  },
];

for (const listing of DEMONSTRATION_LISTINGS) assertListing(listing);
