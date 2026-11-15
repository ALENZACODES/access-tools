export type Lang = "en" | "fr";

const NBSP = " ";

/** French typography: U+00A0 before :, and U+202F before ; ! ? and inside « ». */
export const CATALOG = {
  en: {
    summary: "{sourceName} ({retrievedAt}): {read} rows read, {emitted} records written, {rejected} rejected.",
    notCoverage: "These counts describe this import only. They are not a coverage claim.",
    statementNote: "The accessibility value is a Wikidata statement, not a measurement.",
    licenceOpen: "Licence status: open.",
    licenceHeld: "Held by the licence gate. A licence record was supplied.",
  },
  fr: {
    summary: `{sourceName} ({retrievedAt})${NBSP}: {read} lignes lues, {emitted} fiches écrites, {rejected} rejetées.`,
    notCoverage: "Ces totaux décrivent uniquement cet import. Ils ne constituent pas une affirmation de couverture.",
    statementNote: "La valeur d’accessibilité est une déclaration de Wikidata, et non une mesure.",
    licenceOpen: `Statut de la licence${NBSP}: ouverte.`,
    licenceHeld: "Retenue par la barrière de licence. Un dossier de licence a été fourni.",
  },
} as const;

export type CatalogKey = keyof (typeof CATALOG)["en"];

export function t(lang: Lang, key: CatalogKey, params: Record<string, string | number> = {}): string {
  return CATALOG[lang][key].replace(/\{(\w+)\}/g, (_m, name: string) => String(params[name] ?? `{${name}}`));
}
