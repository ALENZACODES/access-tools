export type Language = "en" | "fr";

export interface EmergencyPathway {
  id: "call-911" | "suicide-crisis-helpline-988" | "connexontario";
  name: Record<Language, string>;
  action: Record<Language, string>;
  href: string;
  /** A second action when the official page offers call and text as separate steps. */
  textAction?: Record<Language, string>;
  textHref?: string;
  detail: Record<Language, string>;
  sourceUrl: string | null;
  retrievedOn: string | null;
}
