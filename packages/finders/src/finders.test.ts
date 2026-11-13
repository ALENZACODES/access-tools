import { describe, expect, it } from "vitest";
import { fixturePack, FIXTURE_PROVENANCE, type Repairer } from "@access-tools/place";
import { findCharging } from "./charging.js";
import { findParking } from "./parking.js";
import { findRepairAndSupply } from "./repair.js";
import { findWashrooms } from "./washrooms.js";

describe("washroom finder", () => {
  it("keeps fixture washrooms as call-ahead and can show the change-table register", () => {
    const all = findWashrooms(fixturePack, {
      text: "",
      lang: "en",
      origin: { latitude: 43.7, longitude: -79.4 },
      transferSide: "any",
      changeTable: false,
      hoist: false,
      registerOnly: false,
      openAt: null,
      showHidden: true,
    });
    expect(all.hits.length).toBeGreaterThan(0);
    expect(all.hits.every((hit) => hit.recommendation.includes("call ahead"))).toBe(true);
    expect(all.coverage).toContain("444");
    const register = findWashrooms(fixturePack, {
      text: "",
      lang: "en",
      origin: null,
      transferSide: "any",
      changeTable: false,
      hoist: false,
      registerOnly: true,
      openAt: null,
      showHidden: true,
    });
    expect(register.hits.map((hit) => hit.washroomId)).toEqual(["fix-hoist-wash"]);
    expect(register.hits[0]?.hoistText).toContain("not provided");
    expect(register.hits[0]?.changeTableText).toContain("present");
  });

  it("does not treat unknown hours as open", () => {
    const result = findWashrooms(fixturePack, {
      text: "",
      lang: "en",
      origin: null,
      transferSide: "any",
      changeTable: false,
      hoist: false,
      registerOnly: false,
      openAt: { day: 1, minutes: 12 * 60 },
      showHidden: true,
    });
    const unknownHours = result.hidden.find((hit) => hit.washroomId === "fix-cc-wash-2");
    expect(unknownHours?.hiddenReasons.join(" ")).toContain("Hours are unknown");
    expect(result.hits.some((hit) => hit.washroomId === "fix-cc-wash-1")).toBe(true);
  });
});

describe("parking finder", () => {
  it("hides a Type B bay from a side-lift filter and refuses a free-parking claim", () => {
    const result = findParking(fixturePack, {
      text: "",
      lang: "en",
      origin: null,
      vanLift: true,
      showHidden: true,
      month: 11,
    });
    expect(result.disclaimer.toLowerCase()).toContain("does not show whether a bay is free");
    expect(result.hits.map((hit) => hit.bayId)).toEqual(["fix-cc-bay-a"]);
    expect(result.hidden.some((hit) => hit.bayId === "fix-cc-bay-b")).toBe(true);
    expect(result.hits[0]?.privilegeText).toContain("unknown");
    expect(result.hits[0]?.winterText).toBe("Winter clearance unknown");
  });
});

describe("charging finder", () => {
  it("does not say a route is in range", () => {
    const result = findCharging(fixturePack, {
      text: "",
      lang: "en",
      origin: { latitude: 43.7, longitude: -79.4 },
      openAt: null,
      showHidden: false,
      userTestedRangeMetres: 20000,
    });
    const text = JSON.stringify(result);
    expect(text.toLowerCase()).not.toContain("in range");
    expect(result.hits.every((hit) => hit.recommendation.includes("call ahead"))).toBe(true);
    expect(result.hits.some((hit) => hit.rangeText?.includes("not a guarantee"))).toBe(true);
    expect(result.rangeReminder).toContain("does not use a generic chair range");
  });
});

describe("repair and supply finder", () => {
  it("lists only published services and does not infer electronics repair", () => {
    const electronics: Repairer = {
      id: "fix-electronics-name",
      name: "Fixture Power Electronics",
      nameFr: null,
      datasetStatus: "labelled-fixture",
      honestyNote: "Labelled fixture. Not a real repairer.",
      servicesPublished: ["tyre"],
      coverageNote: null,
      mobileRadiusKm: null,
      hoursText: null,
      hours: null,
      phone: "555-0199",
      website: null,
      latitude: null,
      longitude: null,
      coordinateNote: null,
      premisesPlaceId: null,
      provenance: FIXTURE_PROVENANCE,
    };
    const pack = { ...fixturePack, repairers: [...fixturePack.repairers, electronics] };
    const result = findRepairAndSupply(pack, {
      text: "electronics",
      lang: "en",
      origin: null,
      kind: "repair",
      mobileOnly: false,
      outOfHours: false,
      supplyCategory: "any",
      openAt: null,
      showHidden: false,
    });
    expect(result.hits).toHaveLength(1);
    expect(result.hits[0]?.servicesText).toBe("tyre");
    expect(result.hits[0]?.servicesText).not.toContain("power-chair");
    expect(result.disclaimer).toContain("does not recommend");
    expect(result.disclaimer).toContain("medical");
  });

  it("does not claim a product is in stock", () => {
    const result = findRepairAndSupply(fixturePack, {
      text: "",
      lang: "en",
      origin: null,
      kind: "supply",
      mobileOnly: false,
      outOfHours: false,
      supplyCategory: "catheter-supplies",
      openAt: null,
      showHidden: false,
    });
    expect(result.hits.map((hit) => hit.id)).toEqual(["fix-pharmacy"]);
    expect(result.stockNote).toContain("not a statement that a specific product is in stock");
    expect(result.hits[0]?.servicesText).not.toMatch(/brand|model/i);
  });
});
