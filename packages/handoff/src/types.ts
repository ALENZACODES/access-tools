/** Matches the public directory-record-1.0.0 surface; no navigator data is copied. */
export type Language = "en" | "fr";
export type Bilingual = Record<Language, string>;
export type Category = "benefits" | "funding" | "equipment" | "employment" | "housing" | "services";
export type Tier = "PROTOTYPE-UNVERIFIED" | "SEEDED-OPEN-DATA" | "administrator_page";

export interface DirectoryLike {
  id: string;
  category: Category;
  name: Bilingual;
  sourceName: string;
  licenceNote: Bilingual;
  verificationTier: Tier;
  /** Freshness checks take this date first, then the source retrieval date. */
  checkedOn?: string;
  retrievedOn?: string;
  officialUrl?: string;
  phone?: string;
  figure?: {
    statement: Bilingual;
    qualifier: Bilingual;
    sourceUrls: string[];
    /** Navigator's figure retrieval date is a figure-level checked-on date. */
    retrievedOn?: string;
  };
}

export type Step =
  | { kind: "link"; label: Bilingual; url: string }
  | { kind: "call"; label: Bilingual; number: string };

export interface Handoff {
  schemaVersion: "handoff-1.0.0";
  id: string;
  fromRecordId: string;
  title: Bilingual;
  checkedOn: string;
  sourceName: string;
  licenceNote: Bilingual;
  verificationTier: "PROTOTYPE-UNVERIFIED" | "SEEDED-OPEN-DATA";
  steps: Step[];
}

export type Freshness = "current" | "ageing" | "stale" | "missing";
export interface AuditResult {
  record: DirectoryLike;
  status: Freshness;
  checkedOn?: string;
  ageDays?: number;
  figureVisible: boolean;
  figureDate?: string;
}
