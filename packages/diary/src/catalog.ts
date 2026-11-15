import type { Category, Consequence, Language } from "./model.js";

type Copy = {
  title: string; intro: string; language: string; consentTitle: string; consentCopy: string;
  grant: string; revoke: string; revoked: string; consentOn: string; onDevice: string;
  disclaimer: string; date: string; category: string; amount: string; amountHelp: string;
  unknown: string; rationing: string; consequence: string; save: string; entries: string;
  empty: string; delete: string; deleteAll: string; exportTitle: string; exportHelp: string;
  preview: string; download: string; noCells: string; saved: string; failed: string;
  categoryNames: Record<Category, string>; consequenceNames: Record<Consequence, string>;
};
export const COPY: Record<Language, Copy> = {
  en: {
    title: "the App — voluntary supply diary", intro: "Record optional out-of-pocket supply costs and experiences on this device.",
    language: "Language", consentTitle: "Your choice", consentCopy: "Nothing is saved before you agree. You can withdraw consent at any time. Withdrawal stops new entries; existing entries stay on this device until you delete them. Consent changes are logged on this device.",
    grant: "I agree to save diary entries on this device", revoke: "Withdraw consent", revoked: "Consent withdrawn. New entries cannot be saved.", consentOn: "Consent granted", onDevice: "Entries stay on this device. Individual entries are never shared or exported.",
    disclaimer: "This is not medical advice and not an insurance claim. No eligibility or supply recommendations are provided.",
    date: "Date", category: "Supply category", amount: "Out-of-pocket amount (CAD)", amountHelp: "Choose Unknown if you do not know the amount.",
    unknown: "Unknown amount", rationing: "I reduced or delayed supply use because of cost", consequence: "Reported consequence", save: "Save entry", entries: "My entries (on device only)",
    empty: "No entries saved.", delete: "Delete entry", deleteAll: "Delete all local entries", exportTitle: "Aggregate export preview", exportHelp: "Only monthly supply-category and reported-consequence counts of at least 5 appear. Counts of 1–4 are suppressed; no individual entries are included.",
    preview: "Preview aggregates", download: "Download aggregate JSON", noCells: "No groups meet the threshold of 5.", saved: "Entry saved on this device.", failed: "Could not complete the action. Check your device storage.",
    categoryNames: { catheters: "Catheters", dressings: "Dressings", cushions: "Cushions", "other-equipment": "Other equipment" },
    consequenceNames: { none: "None reported", "missed-work": "Missed work", "delayed-care": "Delayed care", "infection-reported-by-person": "Infection reported by person", other: "Other" },
  },
  fr: {
    title: "the App — journal volontaire de fournitures", intro: "Consignez facultativement vos dépenses et expériences sur cet appareil.",
    language: "Langue", consentTitle: "Votre choix", consentCopy: "Rien n'est enregistré sans votre accord. Vous pouvez retirer votre consentement à tout moment. Le retrait empêche de nouvelles entrées ; les entrées existantes restent sur cet appareil jusqu'à leur suppression. Les changements de consentement sont consignés sur cet appareil.",
    grant: "J'accepte d'enregistrer des entrées sur cet appareil", revoke: "Retirer le consentement", revoked: "Consentement retiré. Aucune nouvelle entrée ne peut être enregistrée.", consentOn: "Consentement accordé", onDevice: "Les entrées restent sur cet appareil. Aucune entrée individuelle n'est partagée ni exportée.",
    disclaimer: "Ceci n'est pas un conseil médical ni une demande d'indemnisation à une assurance. Aucun conseil sur l'admissibilité ou les fournitures n'est fourni.",
    date: "Date", category: "Catégorie de fournitures", amount: "Dépenses personnelles (CAD)", amountHelp: "Choisissez Inconnu si vous ne connaissez pas le montant.",
    unknown: "Montant inconnu", rationing: "J'ai réduit ou retardé l'utilisation de fournitures en raison du coût", consequence: "Conséquence déclarée", save: "Enregistrer l'entrée", entries: "Mes entrées (sur cet appareil seulement)",
    empty: "Aucune entrée enregistrée.", delete: "Supprimer l'entrée", deleteAll: "Supprimer toutes les entrées locales", exportTitle: "Aperçu des données agrégées", exportHelp: "Seuls les décomptes mensuels par catégorie et par conséquence déclarée d'au moins 5 sont affichés. Les décomptes de 1 à 4 sont masqués ; aucune entrée individuelle n'est incluse.",
    preview: "Afficher les agrégats", download: "Télécharger les agrégats JSON", noCells: "Aucun groupe n'atteint le seuil de 5.", saved: "Entrée enregistrée sur cet appareil.", failed: "L'action a échoué. Vérifiez le stockage de votre appareil.",
    categoryNames: { catheters: "Cathéters", dressings: "Pansements", cushions: "Coussins", "other-equipment": "Autre équipement" },
    consequenceNames: { none: "Aucune signalée", "missed-work": "Travail manqué", "delayed-care": "Soins retardés", "infection-reported-by-person": "Infection déclarée par la personne", other: "Autre" },
  },
};
