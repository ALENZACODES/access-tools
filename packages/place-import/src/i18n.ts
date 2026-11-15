export type Language = "en" | "fr";
export const messages = {
  en: {
    title: "the App — place import", language: "Language", introduction: "Demonstration fixtures only. No Ontario coverage claim.",
    input: "JSON import document", run: "Run import", report: "Import report", accepted: "Accepted", rejected: "Rejected",
    unknownFields: "Unknown fields", refused: "Refused live fields", reasons: "Rejection reasons", refusals: "Refused inputs",
    places: "Emitted places", fields: "Fields", value: "Value", unknown: "Unknown", source: "Source", licence: "Licence",
    date: "Date", tier: "Tier", none: "—", invalidJson: "Invalid JSON", noPlaces: "No accepted records",
    warning: "Unknown does not mean accessible. These venues are fictional.",
  },
  fr: {
    title: "the App — importation de lieux", language: "Langue", introduction: "Données de démonstration uniquement. Aucune affirmation sur la couverture de l’Ontario.",
    input: "Document JSON à importer", run: "Lancer l’importation", report: "Rapport d’importation", accepted: "Acceptés", rejected: "Rejetés",
    unknownFields: "Champs inconnus", refused: "Champs en direct refusés", reasons: "Motifs de rejet", refusals: "Données refusées",
    places: "Lieux produits", fields: "Champs", value: "Valeur", unknown: "Inconnu", source: "Source", licence: "Licence",
    date: "Date", tier: "Niveau", none: "—", invalidJson: "JSON invalide", noPlaces: "Aucune fiche acceptée",
    warning: "Inconnu ne signifie pas accessible. Ces lieux sont fictifs.",
  },
} as const;
