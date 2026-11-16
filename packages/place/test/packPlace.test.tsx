// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { PackPlaceView } from "../src/react/PackPlaceView.js";
import { commonsTitle, fetchCommonsPhoto } from "../src/pack/commons.js";
import { doorWidthMm, fitWithProfile } from "../src/pack/fit.js";
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
});
