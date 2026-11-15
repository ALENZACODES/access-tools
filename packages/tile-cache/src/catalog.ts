export type Locale = "en" | "fr";

export const catalog = {
  en: {
    title: "Demonstration tile cache",
    notice: "These are demonstration tiles, not a downloaded Ontario map.",
    entries: "Entries",
    bytes: "Bytes used",
    cap: "Storage cap",
    asOf: "As of",
    licence: "Licence",
    attribution: "Attribution",
    empty: "No demonstration tiles are stored. Offline maps are not available.",
    unknown: "Unknown",
    none: "None",
  },
  fr: {
    title: "Cache de tuiles de démonstration",
    notice: "Il s’agit de tuiles de démonstration, et non d’une carte de l’Ontario téléchargée.",
    entries: "Entrées",
    bytes: "Octets utilisés",
    cap: "Limite de stockage",
    asOf: "En date du",
    licence: "Licence",
    attribution: "Attribution",
    empty: "Aucune tuile de démonstration n’est stockée. Les cartes hors ligne ne sont pas disponibles.",
    unknown: "Inconnu",
    none: "Aucune",
  },
} as const;
