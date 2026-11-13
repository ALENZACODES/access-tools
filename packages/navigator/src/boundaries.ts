import type { Bilingual } from "./types.js";

export const RETRIEVED_ON = "2026-11-13";
export const NEXT_REVIEW_ON = "2027-02-13";

export const DIRECTORY_FRAMING: Bilingual = {
  en: "Directory and linking only. This is not eligibility advice, not a benefits calculation, and not a decision about a payment.",
  fr: "Répertoire et liens seulement. Ce n'est pas un avis d'admissibilité, ni un calcul de prestations, ni une décision sur un paiement.",
};

/**
 * access-main `packages/schema/TIERS.md` is the tier list.
 * The old id `administrator_page` is not in that list.
 * A desk check of an official page, stored with its link and date, maps to canonical tier `E`.
 * A page whose body was not read is unchecked and stores no tier id.
 * `PROTOTYPE-UNVERIFIED` is a prototype display label, not a tier id.
 */
export const TIER_MAPPING_NOTE: Bilingual = {
  en: "Prototype label: PROTOTYPE-UNVERIFIED. A record whose official page was read on 13 November 2026 uses tier E (desk check). An unchecked page has no tier.",
  fr: "Étiquette de prototype : PROTOTYPE-UNVERIFIED. Une fiche dont la page officielle a été lue le 13 novembre 2026 utilise le niveau E (vérification au bureau). Une page non lue n'a pas de niveau.",
};

export const VERIFICATION_DESK: Bilingual = {
  en: "Desk-checked against the administrator's own page on 13 November 2026. Tier E. The page text is not copied here.",
  fr: "Vérification au bureau sur la page de l'administrateur le 13 novembre 2026. Niveau E. Le texte de la page n'est pas reproduit ici.",
};

export const VERIFICATION_UNCHECKED: Bilingual = {
  en: "Unchecked. The page body was not read on 13 November 2026, so no fact from that page is stated and no tier is stored.",
  fr: "Non vérifié. Le corps de la page n'a pas été lu le 13 novembre 2026, donc aucun fait de cette page n'est indiqué et aucun niveau n'est enregistré.",
};

export const NEVER_MEANS: Bilingual = {
  en: "It does not mean you qualify, and it does not mean the administrator endorses the App.",
  fr: "Cela ne signifie pas une décision d'admissibilité, ni que l'administrateur appuie l'application.",
};

export const LICENCE_NOTE: Bilingual = {
  en: "Link only. Official page text is not reproduced and is not claimed as open data.",
  fr: "Lien seulement. Le texte officiel n'est pas reproduit et n'est pas présenté comme des données ouvertes.",
};

export const NO_PLACE_FACTS: Bilingual = {
  en: "No accessibility measurement of a real place is stored here. Unknown stays unknown.",
  fr: "Aucune mesure d'accessibilité d'un lieu réel n'est conservée ici. Ce qui est inconnu reste inconnu.",
};

export const READING_CONTEXT_NOTE: Bilingual = {
  en: "A reading context only says when people sometimes open a page. It is not a recommendation for you.",
  fr: "Un contexte de lecture dit seulement quand des personnes ouvrent parfois une page. Ce n'est pas une recommandation pour vous.",
};
