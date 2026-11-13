import type { DirectoryRecord, SearchQuery } from "./types.js";

function haystack(record: DirectoryRecord): string {
  return [
    record.id,
    record.category,
    record.geography,
    record.name.en,
    record.name.fr,
    record.administrator.en,
    record.administrator.fr,
    record.summary.en,
    record.summary.fr,
    record.doesNot?.en,
    record.doesNot?.fr,
    record.figure?.statement.en,
    record.figure?.statement.fr,
    record.topics.join(" "),
    record.phone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function searchDirectory(records: readonly DirectoryRecord[], query: SearchQuery = {}): DirectoryRecord[] {
  const needle = query.text?.trim().toLowerCase() ?? "";
  return records.filter((record) => {
    if (needle && !haystack(record).includes(needle)) return false;
    if (query.categories && query.categories.length > 0 && !query.categories.includes(record.category)) return false;
    if (query.topics && query.topics.length > 0 && !query.topics.some((topic) => record.topics.includes(topic))) return false;
    if (query.geographies && query.geographies.length > 0 && !query.geographies.includes(record.geography)) return false;
    if (
      query.readingContexts &&
      query.readingContexts.length > 0 &&
      !query.readingContexts.some((context) => record.readingContexts.includes(context) || record.readingContexts.includes("any"))
    ) {
      return false;
    }
    return true;
  });
}

export const CATEGORY_LABEL = {
  benefits: { en: "Benefits", fr: "Prestations" },
  funding: { en: "Funding", fr: "Financement" },
  equipment: { en: "Equipment", fr: "Équipement" },
  employment: { en: "Employment", fr: "Emploi" },
  housing: { en: "Housing", fr: "Logement" },
  services: { en: "Services", fr: "Services" },
} as const;
