// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ACCEPT, ENDPOINT, QUERY_VARS, SPARQL_QUERY, USER_AGENT } from "../src/query";
import { SOURCES } from "../src/sources";
import { fixture } from "./helpers";

/** Ids already imported by access-maps pull request #1. */
const IMPORTED_BY_ACCESS_MAPS_1 = [
  "osm-ontario", "gtfs-ttc", "gtfs-go-transit", "gtfs-up-express", "gtfs-grt-bus", "gtfs-grt-ion", "gtfs-miway",
  "gtfs-brampton", "gtfs-hsr", "gtfs-ltc", "toronto-park-washrooms", "toronto-street-washrooms",
  "toronto-crem-washrooms", "gtfs-rt-ttc-accessibility", "kingston-public-washrooms", "kingston-accessible-features",
  "brampton-recreation-centres", "sudbury-fieldhouses", "mto-picnic-parks",
];

describe("source registry", () => {
  it("does not overlap sources already imported by access-maps #1", () => {
    for (const s of SOURCES) expect(IMPORTED_BY_ACCESS_MAPS_1).not.toContain(s.id);
  });

  it("has unique ids and the catalogue facts", () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
    const s = SOURCES[0]!;
    expect(s).toMatchObject({
      id: "wikidata-p2846-ontario",
      publisher: "Wikidata contributors",
      datasetUrl: "https://query.wikidata.org/",
      licenceName: "CC0 1.0",
      licenceStatus: "open",
      cadence: "Continuous",
    });
    expect(s.nameEn).toBeTruthy();
    expect(s.nameFr).toBeTruthy();
    expect(s.attribution).toContain("not an endorsement");
  });
});

describe("query", () => {
  it("contains the counted SPARQL conditions", () => {
    expect(SPARQL_QUERY).toContain("?item wdt:P2846 ?v");
    expect(SPARQL_QUERY).toContain("?item wdt:P17 wd:Q16");
    expect(SPARQL_QUERY).toContain("?item wdt:P131+ wd:Q1904");
    expect(SPARQL_QUERY).toContain("wdt:P625");
    expect(SPARQL_QUERY).toContain('LANG(?itemLabel_en) = "en"');
    expect(SPARQL_QUERY).toContain('LANG(?itemLabel_fr) = "fr"');
    expect(SPARQL_QUERY).toMatch(/ORDER BY \?item$/);
  });

  it("selects the variables used by the fixtures and names its endpoint and headers", () => {
    expect(fixture("wikidata-p2846-ontario.sample.json").head.vars).toEqual([...QUERY_VARS]);
    expect(ENDPOINT).toBe("https://query.wikidata.org/sparql");
    expect(ACCEPT).toBe("application/sparql-results+json");
    expect(USER_AGENT).toMatch(/importer-wikidata/);
  });
});
