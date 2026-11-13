import type { Lang } from "@access-tools/place";
import { finderFill } from "./i18n.js";

/** Ontario's 444 municipalities are the geographic denominator from the plan, not a coverage claim. */
export function coverageSentence(municipalities: string[], lang: Lang): string {
  const unique = [...new Set(municipalities)].sort((a, b) => a.localeCompare(b, lang));
  return finderFill("finder.coverage-sentence", lang, { count: unique.length, list: unique.join(", ") });
}
