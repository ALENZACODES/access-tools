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

export interface DirectoryRecord {
  schemaVersion: "directory-record-1.0.0";
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
  /**
   * Directory field shared with access-main. It is not a second tier list.
   * access-main maps `administrator_page` to canonical tier `E`.
   */
  verificationTier: "administrator_page";
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
