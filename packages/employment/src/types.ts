export type Language = "en" | "fr";
export type Bilingual = Record<Language, string>;
export type PrototypeTier = "PROTOTYPE-UNVERIFIED" | "SEEDED-OPEN-DATA";

export interface SourcedFact {
  value: "Unknown" | boolean | string;
  source: string;
  licence: string;
  date: string;
  tier: PrototypeTier;
}

export interface EmploymentListing {
  schemaVersion: "employment-listing-1.0.0";
  id: string;
  kind: "job" | "programme";
  demonstration: true;
  title: Bilingual;
  organisation: Bilingual;
  officialUrl: string;
  location: { city: Bilingual; province: "ON" };
  workplacePlaceId?: string;
  access: {
    stepFreeEntry: SourcedFact;
    accessibleWashroom: SourcedFact;
    workstation: SourcedFact;
  };
  commute: { status: "Unknown"; reason: "engine-unavailable" };
  handoff: { url: string; datedOn: string; note: Bilingual };
  relatedNavigatorIds: Array<"employment-ontario" | "accessibility-in-ontario" | "ohrc-disability-policy">;
}
