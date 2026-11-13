import { describe, expect, it } from "vitest";
import { fixturePack, frenchColonViolations } from "@access-tools/place";
import { SEARCH_COPY } from "./i18n.js";
import { emptySearchQuery, searchPack } from "./search.js";
import { tokenize } from "./tokenize.js";

describe("search", () => {
  it("folds accents and requires every word", () => {
    expect(tokenize("Café communautaire")).toEqual(["cafe", "communautaire"]);
    const query = emptySearchQuery("fr");
    query.text = "communautaire";
    const result = searchPack(fixturePack, query);
    expect(result.hits.map((hit) => hit.placeId)).toContain("fix-community-centre");
    expect(result.hits.every((hit) => hit.tier.length > 0 && hit.sourceName.length > 0)).toBe(true);
  });

  it("names the term when nothing matches", () => {
    const query = emptySearchQuery("en");
    query.text = "zzzz-no-match";
    const result = searchPack(fixturePack, query);
    expect(result.empty).toBe(true);
    expect(result.matched).toBe(0);
    expect(result.queryText).toBe("zzzz-no-match");
  });

  it("does not treat an unknown entrance as step-free", () => {
    const query = emptySearchQuery("en");
    query.sci = { stepFreeEntrance: true };
    const result = searchPack(fixturePack, query);
    expect(result.hits.map((hit) => hit.placeId)).toEqual(["fix-community-centre"]);
    expect(result.hidden.some((hit) => hit.placeId === "fix-cafe")).toBe(true);
    expect(result.hidden.find((hit) => hit.placeId === "fix-cafe")?.hiddenReasons[0]).toContain("not recorded as yes");
  });

  it("filters adult change tables and van bays without a quality score", () => {
    const change = emptySearchQuery("en");
    change.sci = { adultChangeTable: true };
    expect(searchPack(fixturePack, change).hits.map((hit) => hit.placeId)).toEqual(["fix-change-hoist"]);
    const van = emptySearchQuery("en");
    van.sci = { vanAccessibleBay: true };
    expect(searchPack(fixturePack, van).hits.map((hit) => hit.placeId)).toEqual(["fix-community-centre"]);
    expect(emptySearchQuery("en").sort).not.toBe("distance");
    const sorts = ["name", "source-date", "distance"] as const;
    expect(sorts).not.toContain("rating" as unknown as (typeof sorts)[number]);
  });

  it("sorts by straight-line distance and leaves places without coordinates last", () => {
    const query = emptySearchQuery("en");
    query.sort = "distance";
    query.origin = { latitude: 43.7, longitude: -79.4 };
    query.pageSize = 20;
    const result = searchPack(fixturePack, query);
    const first = result.hits[0];
    expect(first?.placeId).toBe("fix-community-centre");
    expect(first?.distanceMetres).toBe(0);
    const trail = result.hits.find((hit) => hit.placeId === "fix-trailhead");
    expect(trail?.distanceMetres).toBeNull();
    expect(result.hits.at(-1)?.distanceMetres).toBeNull();
  });

  it("pages a long list", () => {
    const many = {
      ...fixturePack,
      places: Array.from({ length: 25 }, (_, index) => {
        const base = fixturePack.places[1]!;
        return {
          ...base,
          id: `page-${index}`,
          identity: { ...base.identity, name: `Fixture page ${String(index).padStart(2, "0")}` },
        };
      }),
    };
    const query = emptySearchQuery("en");
    query.pageSize = 10;
    query.page = 2;
    const result = searchPack(many, query);
    expect(result.hits).toHaveLength(10);
    expect(result.page).toBe(2);
    expect(result.pageCount).toBe(3);
  });

  it("puts a no-break space before every French colon", () => {
    expect(frenchColonViolations(SEARCH_COPY)).toEqual([]);
  });
});
