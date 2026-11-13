import type { Lang } from "@access-tools/place";

/** Ontario's 444 municipalities are the geographic denominator from the plan, not a coverage claim. */
export function coverageSentence(municipalities: string[], lang: Lang): string {
  const unique = [...new Set(municipalities)].sort((a, b) => a.localeCompare(b, lang));
  const list = unique.join(", ");
  return lang === "fr"
    ? `Ce paquet nomme ${unique.length} municipalité(s) : ${list}. L'Ontario compte 444 municipalités. Ce paquet ne décrit pas la couverture provinciale.`
    : `This pack names ${unique.length} municipalities: ${list}. Ontario has 444 municipalities. This pack does not describe provincial coverage.`;
}
