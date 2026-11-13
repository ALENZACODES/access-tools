export type Language = "en" | "fr";

export type Category = "benefits" | "funding" | "equipment" | "employment" | "housing" | "services";

export type Geography = "canada" | "ontario" | "toronto" | "london" | "hamilton" | "thunder_bay" | "sudbury";

export type ReadingContext = "newly_injured" | "rehabilitation" | "early_community" | "long_term" | "any";

export interface Bilingual {
  en: string;
  fr: string;
}

export interface DirectoryFigure {
  statement: Bilingual;
  qualifier: Bilingual;
  sourceUrls: string[];
  retrievedOn: string;
}

/** Canonical tier ids from access-main packages/schema/TIERS.md. */
export type CanonicalTier = "0" | "1" | "2" | "3" | "4" | "E";

export interface DirectoryRecord {
  schemaVersion: "directory-record-1.1.0";
  id: string;
  category: Category;
  topics: string[];
  readingContexts: ReadingContext[];
  name: Bilingual;
  administrator: Bilingual;
  geography: Geography;
  summary: Bilingual;
  doesNot?: Bilingual;
  officialUrl: string;
  frenchOfficialUrl?: string;
  phone?: string;
  phoneNote?: Bilingual;
  figure?: DirectoryFigure;
  sourceName: string;
  retrievedOn: string;
  nextReviewOn: string;
  /** Present only for a desk check. Unchecked records omit it. */
  tier?: CanonicalTier;
  prototypeLabel: "PROTOTYPE-UNVERIFIED";
  pageBodyRead: boolean;
  deskVerifiedDate: string | null;
  verificationPlain: Bilingual;
  neverMeans: Bilingual;
  licenceNote: Bilingual;
  notEligibilityAdvice: true;
  framing: Bilingual;
  placeFacts?: "none";
}

export interface SearchQuery {
  text?: string;
  categories?: Category[];
  topics?: string[];
  geographies?: Geography[];
  readingContexts?: ReadingContext[];
}

export interface NavigatorNote {
  programIds: string[];
}
