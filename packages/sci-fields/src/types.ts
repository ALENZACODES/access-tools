export type Lang = "en" | "fr";
export type Bilingual = { en: string; fr: string };
/** 0 = unverified draft (never shown as a fact), 1 = community/operator unreviewed, 2-3 = evidence-backed. */
export type Tier = 0 | 1 | 2 | 3;
export type FieldKind = "number" | "boolean" | "enum" | "text";
/** durable: rarely changes; annual: re-check yearly; visit: true on a dated visit; short: weather-driven. */
export type ExpiryClass = "durable" | "annual" | "visit" | "short";
export type Licence = "ODbL" | "OGL-Ontario" | "OGL-Canada" | "CC-BY" | "CC0";
export type FactValue = number | boolean | string;

export interface FieldDef {
  id: string;
  label: Bilingual;
  kind: FieldKind;
  unit?: "mm";
  /** Allowed values for kind "enum", each with EN/FR labels. */
  values?: Record<string, Bilingual>;
  needKey: string;
  expiry: ExpiryClass;
  /** How this is observed. Describes a method; never advice. */
  observed: Bilingual;
}

/** Standard provenance shape. A bare `{ field, value: "UNKNOWN" }` is the default for every field. */
export interface SciFieldFact {
  field: string;
  value: FactValue | "UNKNOWN";
  source_id?: string;
  licence?: Licence;
  retrieved_at?: string;
  tier?: Tier;
  source_key?: string;
  raw?: unknown;
  derived?: boolean;
}

export interface DeviceProfile {
  chairWidthMm?: number;
  maxSlopePercent?: number;
  transferSide?: "left" | "right" | "both";
  breakIntervalMinutes?: number;
}
