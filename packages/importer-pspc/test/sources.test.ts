// @vitest-environment node
import { describe, expect, it } from "vitest";
import { licenceGate, LicenceGateError, SOURCES, type SourceDef } from "#src/sources";
import { source } from "./helpers";

// Source ids already imported by access-maps pull request #1.
const ACCESS_MAPS_PR1 = [
  "osm-ontario", "gtfs-ttc", "gtfs-go-transit", "gtfs-up-express", "gtfs-grt-bus", "gtfs-grt-ion", "gtfs-miway",
  "gtfs-brampton", "gtfs-hsr", "gtfs-ltc", "toronto-park-washrooms", "toronto-street-washrooms",
  "toronto-crem-washrooms", "gtfs-rt-ttc-accessibility", "kingston-public-washrooms",
  "kingston-accessible-features", "brampton-recreation-centres", "sudbury-fieldhouses", "mto-picnic-parks",
];

describe("source registry", () => {
  it("does not overlap sources already imported by access-maps #1", () => {
    for (const s of SOURCES) expect(ACCESS_MAPS_PR1).not.toContain(s.id);
  });

  it("has unique ids and the catalogue licence facts", () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
    expect(source).toMatchObject({
      id: "pspc-building-accessibility",
      licenceName: "Open Government Licence – Canada 2.0",
      licenceStatus: "open",
      sourceDate: "2026-03-21",
    });
    expect(source.attribution).toBe("Contains information licensed under the Open Government Licence – Canada.");
    expect(source.name.fr).not.toBe("");
  });
});

describe("licence gate", () => {
  const held: SourceDef = { ...source, licenceStatus: "restricted" };
  it("passes open and open-recorded", () => {
    expect(licenceGate(source)).toEqual({ held: false });
    expect(licenceGate({ ...source, licenceStatus: "open-recorded" })).toEqual({ held: false });
  });
  it("refuses any other status without a complete licence record", () => {
    expect(() => licenceGate(held)).toThrow(LicenceGateError);
    expect(() => licenceGate(held, { checkedOn: "soon", urlRead: "https://example.invalid", result: "ok" })).toThrow(LicenceGateError);
  });
  it("lists the source as held when a licence record is given", () => {
    expect(licenceGate(held, { checkedOn: "2026-11-15", urlRead: "https://example.invalid/licence", result: "terms unclear" })).toEqual({ held: true });
  });
});
