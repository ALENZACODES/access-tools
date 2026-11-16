// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { PackPlaceView } from "../src/react/PackPlaceView.js";
import { commonsTitle, fetchCommonsPhoto } from "../src/pack/commons.js";
import { doorWidthMm, fitWithProfile } from "../src/pack/fit.js";
import { packFieldLabel } from "../src/pack/catalog.js";
import { copy } from "../src/i18n.js";
import { fromPackRecord } from "../src/pack/projection.js";
import type { PackRecord, PackSourceEntry } from "../src/pack/pack-types.js";
import { EQUIPMENT_PROFILE_VERSION } from "../src/profile.js";

const sources: PackSourceEntry[] = [
  { sourceId: "osm-ontario", name: "OpenStreetMap", licence: "ODbL-1.0", licenceUrl: "https://www.openstreetmap.org/copyright", attribution: "© OpenStreetMap contributors", retrieved: "2026-11-01" },
  { sourceId: "city", name: "Municipal open data", licence: "Open Government Licence", licenceUrl: "https://example.org/licence", retrieved: "2026-10-12" },
];
const field = (value: unknown, source_id = "osm-ontario") => ({ value, source_id, licence: source_id === "city" ? "Open Government Licence" : "ODbL-1.0", retrieved_at: "2026-11-01", tier: 1 });
const record: PackRecord = {
  id: "osm:node:123", tranche: "washroom", region: "toronto",
  fields: {
    name: field("Demonstration washroom"),
    "entrance:step_free": field("yes"),
    "toilets:wheelchair": field("UNKNOWN"),
    "door_clear_width_mm": field(800),
    "changing_table:adult": field("no"),
    "parking:wheelchair": field("yes", "city"),
    "survey:note": field("No inference permitted"),
  },
};
const profile = { schemaVersion: EQUIPMENT_PROFILE_VERSION, chairType: "manual" as const, widthMm: 850, stepFreeRequired: true, adultChangeTable: true };

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("web pack place", () => {
  it("retains Unknown, other fields, and source evidence without filling gaps", () => {
    const projection = fromPackRecord(record, sources);
    expect(projection.facts.washroom.value).toBeNull();
    expect(projection.otherDetails.map((detail) => detail.key)).toContain("survey:note");
    expect(projection.facts.parking.source?.licence).toBe("Open Government Licence");
    expect(projection.allDetails).toHaveLength(Object.keys(record.fields).length);
  });

  it("produces five evidence-linked verdicts, never a score", () => {
    const fit = fitWithProfile(fromPackRecord(record, sources), profile);
    expect(fit.map((item) => item.status)).toEqual(["known-yes", "unknown", "known-no", "known-no", "known-yes"]);
    expect(fit[2]?.decidingField).toBe("door_clear_width_mm");
    expect(fitWithProfile(fromPackRecord(record, sources), null)[2]?.status).toBe("unknown");
  });

  for (const lang of ["en", "fr"] as const) {
    it(`renders ${lang} with attribution and no network on render`, async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("must not fetch"));
      const { container } = render(<PackPlaceView record={record} sources={sources} lang={lang} profile={profile} />);
      expect(screen.getAllByText(lang === "fr" ? "Inconnu" : "Unknown").length).toBeGreaterThan(0);
      expect(screen.getAllByText(/OpenStreetMap contributors|contributeurs OpenStreetMap/).length).toBeGreaterThan(0);
      expect(screen.getByText("Open Government Licence", { exact: false })).toBeTruthy();
      expect(screen.getByText(lang === "fr" ? "Note de relevé" : "Survey note")).toBeTruthy();
      expect(screen.queryByText("survey:note")).toBeNull();
      expect(container.querySelectorAll('a[href^="#pack-field-"]')).toHaveLength(5);
      expect(container.querySelectorAll("img")).toHaveLength(0);
      expect(fetchSpy).not.toHaveBeenCalled();
      const a11y = await axe.run(container);
      expect(a11y.violations).toEqual([]);
    });
  }

  it("does not accept arbitrary image hosts or fetch on mount", async () => {
    expect(commonsTitle("https://bad.example/wiki/File:X.jpg")).toBeNull();
    expect(commonsTitle("https://commons.wikimedia.org/wiki/File:Sample.jpg")).toBe("File:Sample.jpg");
    const withPhoto: PackRecord = { ...record, fields: { ...record.fields, wikimedia_commons: field("File:Sample.jpg") } };
    const request = vi.fn(async () => ({
      ok: true,
      json: async () => ({ query: { pages: { 1: { imageinfo: [{ thumburl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Sample.jpg/480px-Sample.jpg", descriptionurl: "https://commons.wikimedia.org/wiki/File:Sample.jpg", extmetadata: { Artist: { value: "<b>Example artist</b>" }, LicenseShortName: { value: "CC BY-SA 4.0" }, LicenseUrl: { value: "https://commons.wikimedia.org/wiki/Commons:Licensing" } } }] } } } }),
    })) as unknown as typeof fetch;
    const { container } = render(<PackPlaceView record={withPhoto} sources={sources} photoRequest={request} />);
    expect(request).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Show photo" }));
    await waitFor(() => expect(screen.getByText(/Example artist/)).toBeTruthy());
    expect(container.querySelector("img")?.getAttribute("src")).toContain("upload.wikimedia.org");
    expect(request).toHaveBeenCalledTimes(1);
    const returned = await fetchCommonsPhoto("File:Sample.jpg", request);
    expect(returned?.licence).toBe("CC BY-SA 4.0");
  });

  it("rejects restricted photos after an explicit click", async () => {
    const request = vi.fn(async () => ({ ok: true, json: async () => ({ query: { pages: { 1: { imageinfo: [{ thumburl: "https://upload.wikimedia.org/x.jpg", descriptionurl: "https://commons.wikimedia.org/wiki/File:X.jpg", extmetadata: { LicenseShortName: { value: "CC BY-NC 4.0" } } }] } } } }) })) as unknown as typeof fetch;
    expect(await fetchCommonsPhoto("File:X.jpg", request)).toBeNull();
  });

  it("does not treat a generic changing_table tag as an adult change table", () => {
    const genericOnly: PackRecord = { ...record, fields: { name: field("Generic table"), changing_table: field("yes") } };
    const adultYes: PackRecord = { ...record, fields: { name: field("Adult table"), adult_changing_table: field("yes") } };
    const genericWithAdultNo: PackRecord = { ...record, fields: { name: field("Baby table"), changing_table: field("yes"), adult_changing_table: field("no") } };
    const genericFit = fitWithProfile(fromPackRecord(genericOnly, sources), profile).find((item) => item.need === "changeTable");
    const adultFit = fitWithProfile(fromPackRecord(adultYes, sources), profile).find((item) => item.need === "changeTable");
    const bothFit = fitWithProfile(fromPackRecord(genericWithAdultNo, sources), profile).find((item) => item.need === "changeTable");
    expect(genericFit?.status).toBe("unknown");
    expect(adultFit?.status).toBe("known-yes");
    expect(bothFit?.status).toBe("known-no");
  });

  it("converts door width only when the unit is explicit", () => {
    expect(doorWidthMm("door_clear_width_mm", 800)).toBe(800);
    expect(doorWidthMm("door_clear_width_mm", "900")).toBe(900);
    expect(doorWidthMm("door:width", "90 cm")).toBe(900);
    expect(doorWidthMm("door:width", "0.9 m")).toBe(900);
    expect(doorWidthMm("door:width", "900 mm")).toBe(900);
    expect(doorWidthMm("door:width", 90)).toBeNull();
    expect(doorWidthMm("door:width", "90")).toBeNull();
    const implicit: PackRecord = { ...record, fields: { ...record.fields, "door:width": field(90), door_clear_width_mm: undefined as never } };
    implicit.fields = { name: field("Wide door"), "door:width": field(90) };
    const fit = fitWithProfile(fromPackRecord(implicit, sources), profile).find((item) => item.need === "doorWidth");
    expect(fit?.status).toBe("unknown");
  });

  it("drops heldReason sources in the view itself", () => {
    const held: PackSourceEntry = { sourceId: "held", name: "Held source", licence: "restricted", retrieved: "2026-11-01", inWebPack: true, heldReason: "Licence pending" };
    const mixed: PackRecord = {
      ...record,
      fields: { ...record.fields, "held:secret": field("should not appear", "held") },
    };
    render(<PackPlaceView record={mixed} sources={[...sources, held]} />);
    expect(screen.queryByText("Held source")).toBeNull();
    expect(screen.queryByText("should not appear")).toBeNull();
    expect(screen.getByText("Survey note")).toBeTruthy();
  });

  it("avoids verified wording in the no-photo copy and sizes contribute links to 44px", async () => {
    const request = vi.fn(async () => ({ ok: true, json: async () => ({ query: { pages: {} } }) })) as unknown as typeof fetch;
    const withPhoto: PackRecord = { ...record, fields: { ...record.fields, wikimedia_commons: field("File:Missing.jpg") } };
    render(<PackPlaceView record={withPhoto} sources={sources} photoRequest={request} />);
    fireEvent.click(screen.getByRole("button", { name: "Show photo" }));
    await waitFor(() => {
      const unavailable = screen.getByText(/No accepted open-licence photo available/);
      expect(unavailable.textContent ?? "").not.toMatch(/verif/i);
      const add = screen.getAllByRole("link", { name: "Add a photo" });
      expect(add.length).toBeGreaterThan(0);
      for (const link of add) {
        expect(link.getAttribute("style") ?? "").toContain("min-height: 44px");
        expect(link.getAttribute("style") ?? "").toContain("min-width: 44px");
      }
      const correct = screen.getByRole("link", { name: "Suggest a correction" });
      expect(correct.getAttribute("style") ?? "").toContain("min-height: 44px");
    });
  });

  it("prefers an explicit-unit door width over a unitless door:width sibling", () => {
    const both: PackRecord = {
      ...record,
      fields: {
        name: field("Wide door"),
        "door:width": field(90),
        door_clear_width_mm: field(900),
      },
    };
    const projection = fromPackRecord(both, sources);
    expect(projection.facts.doorWidth.key).toBe("door_clear_width_mm");
    expect(projection.facts.doorWidth.value).toBe(900);
    const fit = fitWithProfile(projection, profile).find((item) => item.need === "doorWidth");
    expect(fit?.status).toBe("known-yes");
    expect(fit?.decidingField).toBe("door_clear_width_mm");
  });

  it("prefers a known adult change-table alias over an earlier UNKNOWN alias", () => {
    const unknownFirst: PackRecord = {
      ...record,
      fields: {
        name: field("Adult table later"),
        "changing_table:adult": field("UNKNOWN"),
        adult_changing_table: field("yes"),
      },
    };
    const projection = fromPackRecord(unknownFirst, sources);
    expect(projection.facts.changeTable.key).toBe("adult_changing_table");
    expect(projection.facts.changeTable.value).toBe("yes");
    const fit = fitWithProfile(projection, profile).find((item) => item.need === "changeTable");
    expect(fit?.status).toBe("known-yes");
    expect(fit?.decidingField).toBe("adult_changing_table");
  });

  it.each([
    { first: "yes", second: "no", order: "changing_table:adult yes then adult_changing_table no" },
    { first: "no", second: "yes", order: "changing_table:adult no then adult_changing_table yes" },
  ])("treats a yes/no adult change-table conflict as known-no ($order)", ({ first, second }) => {
    const conflicting: PackRecord = {
      ...record,
      fields: {
        name: field("Conflicting adult table"),
        "changing_table:adult": field(first),
        adult_changing_table: field(second),
      },
    };
    const projection = fromPackRecord(conflicting, sources);
    const fit = fitWithProfile(projection, profile).find((item) => item.need === "changeTable");
    expect(fit?.status).toBe("known-no");
    expect(fit?.status).not.toBe("known-yes");
    expect(projection.facts.changeTable.value).toBe("no");
    expect(projection.otherDetails.some((detail) => detail.value === "yes" && (detail.key === "changing_table:adult" || detail.key === "adult_changing_table"))).toBe(true);
  });

  it.each([
    { first: 900, second: 700, order: "door_clear_width_mm then door_width_mm" },
    { first: 700, second: 900, order: "door_width_mm then door_clear_width_mm" },
  ])("treats disagreeing explicit door widths as Unknown, never a confident yes ($order)", ({ first, second }) => {
    const conflicting: PackRecord = {
      ...record,
      fields: {
        name: field("Conflicting door"),
        door_clear_width_mm: field(first),
        door_width_mm: field(second),
      },
    };
    const projection = fromPackRecord(conflicting, sources);
    expect(projection.facts.doorWidth.value).toBeNull();
    const fit = fitWithProfile(projection, profile).find((item) => item.need === "doorWidth");
    expect(fit?.status).toBe("unknown");
    expect(fit?.status).not.toBe("known-yes");
    expect(projection.allDetails.some((detail) => detail.key === "door_clear_width_mm" && detail.value === first)).toBe(true);
    expect(projection.allDetails.some((detail) => detail.key === "door_width_mm" && detail.value === second)).toBe(true);
  });

  it("uses Oui connu / Non connu in French and drops Vérification from photo-loading copy", () => {
    expect(copy("pack.yes", "fr")).toBe("Oui connu");
    expect(copy("pack.no", "fr")).toBe("Non connu");
    expect(copy("pack.yes", "fr")).not.toMatch(/confirmé/i);
    expect(copy("pack.no", "fr")).not.toMatch(/confirmé/i);
    expect(copy("pack.photo-loading", "fr")).toBe("Chargement de la photo…");
    expect(copy("pack.photo-loading", "fr")).not.toMatch(/v[eé]rif/i);
    expect(copy("pack.photo-loading", "en")).not.toMatch(/verif|check/i);
  });

  it("marks an uncatalogued pack field label as English only", () => {
    expect(packFieldLabel("unlisted_field", "en")).toBe("unlisted field (English only)");
    expect(packFieldLabel("unlisted_field", "fr")).toBe("unlisted field (en anglais seulement)");
    expect(packFieldLabel("foo:bar_baz", "fr")).toBe("foo bar baz (en anglais seulement)");
  });

  it("gives licence and OSM attribution links a 44px minimum size", () => {
    render(<PackPlaceView record={record} sources={sources} lang="en" />);
    const osm = screen.getAllByRole("link", { name: /OpenStreetMap contributors/ });
    expect(osm.length).toBeGreaterThan(0);
    for (const link of osm) {
      expect(link.getAttribute("style") ?? "").toContain("min-height: 44px");
      expect(link.getAttribute("style") ?? "").toContain("min-width: 44px");
    }
    const licences = screen.getAllByRole("link", { name: "Licence" });
    expect(licences.length).toBeGreaterThan(0);
    for (const link of licences) {
      expect(link.getAttribute("style") ?? "").toContain("min-height: 44px");
      expect(link.getAttribute("style") ?? "").toContain("min-width: 44px");
    }
  });
});
