import type { Bilingual } from "./types.js";

export const RETRIEVED_ON = "2026-11-13";
export const NEXT_REVIEW_ON = "2027-02-13";

export const DIRECTORY_FRAMING: Bilingual = {
  en: "Directory and linking only. This is not eligibility advice, not a benefits calculation, and not a decision about a payment.",
  fr: "Répertoire et liens seulement. Ce n'est pas un avis d'admissibilité, ni un calcul de prestations, ni une décision sur un paiement.",
};

/**
 * The directory field `verificationTier: "administrator_page"` is the value
 * access-main validates. It is not a second tier list. access-main maps that
 * field to canonical tier `E` (desk check of an official page). Every record
 * in this directory was read on the retrieval date. Unread pages are omitted.
 */
export const TIER_MAPPING_NOTE: Bilingual = {
  en: "Each record was desk-checked on 13 November 2026. The directory field is administrator_page, which access-main stores as canonical tier E.",
  fr: "Chaque fiche a été vérifiée au bureau le 13 novembre 2026. Le champ du répertoire est administrator_page, que access-main enregistre comme niveau canonique E.",
};

export const VERIFICATION_DESK: Bilingual = {
  en: "Desk-checked against the administrator's own page on 13 November 2026. The page text is not copied here.",
  fr: "Vérification au bureau sur la page de l'administrateur le 13 novembre 2026. Le texte de la page n'est pas reproduit ici.",
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
