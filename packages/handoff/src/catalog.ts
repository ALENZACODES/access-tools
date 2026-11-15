import type { Language } from "./types.js";

const catalogs = {
  en: {
    english: "English", french: "Français", app: "the App", heading: "Navigation hand-off", intro: "Directory links only. No eligibility decision, entitlement calculation or endorsement.",
    language: "Language", handoff: "Hand-off checklist", from: "Directory record", checked: "Checked on", source: "Source", licence: "Licence", tier: "Verification tier",
    open: "Open official link", call: "Call published number", completed: "Step completed", audit: "Quarterly freshness audit",
    asOf: "Audit date", status: "Status", current: "Current", ageing: "Ageing", stale: "Needs re-check", missing: "Missing checked-on date",
    noFigure: "Figure hidden until its dated source is re-checked", figure: "Dated figure", recheck: "Record manual re-check", checkDate: "Manual check date",
    save: "Save check date", notice: "A new record check does not renew a figure's source date.", invalid: "Enter a valid date no later than the audit date.",
    demonstration: "Demonstration records only — not official rates or service facts", nothing: "No hand-off is selected.",
    reviewed: "Re-check recorded", staleFigure: "Figure withheld; source date", dateMissing: "Date not recorded", steps: "Link or call actions",
  },
  fr: {
    english: "English", french: "Français", app: "the App", heading: "Passage vers les services", intro: "Liens du répertoire seulement. Aucune décision d’admissibilité, aucun calcul de prestations ni appui d’un organisme.",
    language: "Langue", handoff: "Liste de passage", from: "Fiche du répertoire", checked: "Vérifié le", source: "Source", licence: "Licence", tier: "Niveau de vérification",
    open: "Ouvrir le lien officiel", call: "Appeler le numéro publié", completed: "Étape terminée", audit: "Audit trimestriel de fraîcheur",
    asOf: "Date de l’audit", status: "État", current: "À jour", ageing: "Vieillissant", stale: "À revérifier", missing: "Date de vérification manquante",
    noFigure: "Chiffre masqué en attendant une nouvelle vérification datée de sa source", figure: "Chiffre daté", recheck: "Consigner une nouvelle vérification",
    checkDate: "Date de vérification manuelle", save: "Enregistrer la date", notice: "La vérification d’une fiche ne renouvelle pas la date de la source d’un chiffre.",
    invalid: "Entrez une date valide ne dépassant pas la date de l’audit.", demonstration: "Fiches de démonstration seulement — ni taux officiels ni faits sur les services",
    nothing: "Aucun passage sélectionné.", reviewed: "Nouvelle vérification consignée", staleFigure: "Chiffre masqué ; date de la source", dateMissing: "Date non consignée", steps: "Liens ou appels",
  },
} as const;

export type Messages = typeof catalogs.en | typeof catalogs.fr;
export function messages(language: Language): Messages { return catalogs[language]; }
