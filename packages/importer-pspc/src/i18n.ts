export type Lang = "en" | "fr";

const NBSP = " ";

export const CATALOG = {
  en: {
    summary: (read: number, emitted: number) => `${read} buildings read, ${emitted} emitted`,
    rejected: (n: number) => `${n} rejected`,
    skipped: (n: number) => `${n} skipped (outside Ontario)`,
    held: "Held by licence: no output written",
    notice: "Counts describe this import run only. They are not a coverage claim.",
  },
  fr: {
    summary: (read: number, emitted: number) => `${read} bâtiments lus, ${emitted} émis`,
    rejected: (n: number) => `${n} rejetés`,
    skipped: (n: number) => `${n} ignorés (hors Ontario)`,
    held: `Retenu en raison de la licence${NBSP}: aucune sortie écrite`,
    notice: "Les nombres décrivent uniquement cette importation. Ils ne constituent pas une déclaration de couverture.",
  },
} as const;

export function summaryLine(lang: Lang, read: number, emitted: number, rejected = 0, skipped = 0): string {
  const c = CATALOG[lang];
  const parts = [c.summary(read, emitted)];
  if (rejected > 0) parts.push(c.rejected(rejected));
  if (skipped > 0) parts.push(c.skipped(skipped));
  return parts.join("; ");
}
