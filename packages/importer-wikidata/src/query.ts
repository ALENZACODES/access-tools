/**
 * The SPARQL used to count and import. Items with wheelchair accessibility
 * (P2846) in Canada (Q16) that sit, at any depth, inside Ontario (Q1904).
 * Rows are ordered by item so that several P2846 values for one item are adjacent.
 */
export const ENDPOINT = "https://query.wikidata.org/sparql";

export const QUERY_VARS = ["item", "itemLabel_en", "itemLabel_fr", "v", "coord"] as const;

export const SPARQL_QUERY = `SELECT ?item ?itemLabel_en ?itemLabel_fr ?v ?coord WHERE {
  ?item wdt:P2846 ?v .
  ?item wdt:P17 wd:Q16 .
  ?item wdt:P131+ wd:Q1904 .
  OPTIONAL { ?item wdt:P625 ?coord . }
  OPTIONAL { ?item rdfs:label ?itemLabel_en . FILTER(LANG(?itemLabel_en) = "en") }
  OPTIONAL { ?item rdfs:label ?itemLabel_fr . FILTER(LANG(?itemLabel_fr) = "fr") }
}
ORDER BY ?item`;

export const ACCEPT = "application/sparql-results+json";
export const USER_AGENT = "the-app-importer-wikidata/0.1 (open-data import; https://github.com/ALENZACODES/access-tools)";
