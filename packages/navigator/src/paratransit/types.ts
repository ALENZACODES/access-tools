export interface BilingualText {
  en: string;
  fr: string;
}

export interface ParatransitEntry {
  schemaVersion: "paratransit-entry-1.0.0";
  id: string;
  /** Name as published on the agency page. Not translated. */
  agencyName: string;
  /** Publisher as printed on that page. Not translated. */
  publisher: string;
  serviceArea: BilingualText;
  websiteUrl: string;
  bookingUrl: string;
  /** Digits and separators exactly as published. */
  phone: string;
  sourceUrl: string;
  sourceName: string;
  retrievedOn: string;
  verificationTier: "administrator_page";
  licenceNote: BilingualText;
  notEligibilityAdvice: true;
}
