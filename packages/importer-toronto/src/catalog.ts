const NBSP = "\u00A0";

export const CATALOG = {
  en: {
    summary: (id: string, read: number, emitted: number) => `${id}: ${read} read, ${emitted} emitted. Counts are not a coverage claim.`,
    held: "Licence review required; no output was published.",
    disclaimer: "Counts are not a coverage claim.",
    notice: "Attribution does not imply endorsement of the App.",
  },
  fr: {
    summary: (id: string, read: number, emitted: number) => `${id}${NBSP}: ${read} lignes lues, ${emitted} lignes exportées. Ces chiffres ne constituent pas une garantie de couverture.`,
    held: `Vérification de la licence requise${NBSP}; aucune donnée n'a été publiée.`,
    disclaimer: "Ces chiffres ne constituent pas une garantie de couverture.",
    notice: "L’attribution ne signifie pas que la Ville appuie the App.",
  },
} as const;
