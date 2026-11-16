import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { packFieldLabel, packGroupCountPhrase } from "../src/i18n.js";
import { createFindersModule } from "../src/react/pack-module.js";
import { PackFindersPage } from "../src/react/PackFindersPage.js";
import type { PackManifest, PackRecord, PackSource, PackSourceEntry, Tranche } from "../src/pack-types.js";

const open: PackSourceEntry = { sourceId: "osm-ontario", name: "OpenStreetMap", licence: "ODbL-1.0", retrieved: "2026-11-01", attribution: "© OpenStreetMap contributors, ODbL", inWebPack: true };
function record(id: string, tranche: Tranche, fields: Record<string, unknown>): PackRecord {
  return { id, tranche, region: "toronto", fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, { value, source_id: open.sourceId, licence: "ODbL-1.0", retrieved_at: "2026-11-01", tier: "source" }])) };
}
const fixtures = [
  record("adult-yes", "washroom", { name: "Kingston washroom", adult_changing_table: "yes" }),
  record("generic-yes", "washroom", { name: "Public toilet", changing_table: "yes" }),
  record("known-no", "washroom", { name: "No change table", changing_table: "no" }),
];
const manifest: PackManifest = { version: 1, builtAt: "2026-11-01", sourceCommit: "test", sources: [open], regions: [{ id: "toronto", label: { en: "Toronto", fr: "Toronto" }, bbox: [-80, 43, -79, 44], cells: ["n43.5_w079.5"] }], tranches: {}, search: {}, counts: { records: 3, byTranche: {}, bySource: {} } };
function fixtureSource(): PackSource {
  return {
    manifest: async () => manifest,
    cellsFor: vi.fn(async () => ["n43.5_w079.5"]),
    async *records(tranche) { for (const value of fixtures) if (value.tranche === tranche) yield value; },
    search: vi.fn(async () => []),
    get: async (id) => fixtures.find((value) => value.id === id) ?? null,
    sourcesFor: () => [open], regions: async () => [], downloadRegion: async () => ({ id: "toronto" }), deleteRegion: async () => {},
  };
}

afterEach(() => cleanup());

describe("PackFindersPage honesty and labels", () => {
  it("createFindersModule passes lang to the page", () => {
    const module = createFindersModule(fixtureSource(), "fr");
    const { container } = render(createElement(module.Page));
    expect(container.querySelector("main")?.getAttribute("lang")).toBe("fr");
  });

  it("translates field labels in French and uses typographic apostrophes in pack copy", async () => {
    render(<PackFindersPage source={fixtureSource()} lang="fr" />);
    const kind = await screen.findByLabelText("Recherche");
    await userEvent.selectOptions(kind, "changing");
    await waitFor(() => expect(screen.getAllByText("Table à langer pour adultes").length).toBeGreaterThan(0));
    expect(screen.queryByText("adult_changing_table")).not.toBeInTheDocument();
    expect(screen.queryByText("changing_table")).not.toBeInTheDocument();
    expect(packFieldLabel("opening_hours", "fr")).toBe("Heures d’ouverture");
    expect(packFieldLabel("opening_hours", "fr")).toContain("\u2019");
    expect(packFieldLabel("opening_hours", "fr")).not.toContain("'");
    expect(packFieldLabel("changing_table:adult", "en")).toBe("Adult change table");
    expect(packFieldLabel("changing_table:adult", "fr")).toBe("Table à langer pour adultes");

  });

  it("shows known-yes changing tables in the main list and unknown only in a labelled Unknown group", async () => {
    render(<PackFindersPage source={fixtureSource()} lang="en" />);
    await userEvent.selectOptions(await screen.findByLabelText("Finder"), "changing");
    const known = await screen.findByRole("region", { name: "Known adult change tables" });
    expect(within(known).getByRole("heading", { name: "Kingston washroom" })).toBeInTheDocument();
    expect(within(known).queryByText("Public toilet")).not.toBeInTheDocument();
    expect(screen.queryByText("No change table")).not.toBeInTheDocument();
    const unknown = screen.getByRole("region", { name: "Unknown" });
    expect(within(unknown).getByRole("heading", { name: "Public toilet" })).toBeInTheDocument();
    expect(within(unknown).getByText("These records do not have a known adult change table. Unknown is not a yes.")).toBeInTheDocument();
    expect(within(unknown).queryByText("No change table")).not.toBeInTheDocument();
  });

  it("gives checkboxes, checkbox labels and the contribute link a 44px minimum size", async () => {
    render(<PackFindersPage source={fixtureSource()} lang="en" />);
    const near = await screen.findByLabelText("Near this place");
    const nearLabel = near.closest("label");
    expect(near).toHaveStyle({ minHeight: "44px", minWidth: "44px" });
    expect(nearLabel).toHaveStyle({ minHeight: "44px", minWidth: "44px" });
    const broaden = screen.getByLabelText("Broaden results");
    expect(broaden).toHaveStyle({ minHeight: "44px", minWidth: "44px" });
    expect(broaden.closest("label")).toHaveStyle({ minHeight: "44px", minWidth: "44px" });
    await userEvent.selectOptions(screen.getByLabelText("Finder"), "charging");
    await userEvent.type(screen.getByLabelText("Destination"), "nothing matching");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));
    const contribute = await screen.findByRole("link", { name: "Contribute information" });
    expect(contribute).toHaveStyle({ minHeight: "44px", minWidth: "44px" });
  });

  it("names known and unknown counts instead of Results: 0 when only the Unknown group is shown", async () => {
    const onlyUnknown: PackRecord[] = [
      record("generic-yes", "washroom", { name: "Public toilet", changing_table: "yes" }),
    ];
    const source: PackSource = {
      ...fixtureSource(),
      async *records(tranche) { for (const value of onlyUnknown) if (value.tranche === tranche) yield value; },
      get: async (id) => onlyUnknown.find((value) => value.id === id) ?? null,
    };
    render(<PackFindersPage source={source} lang="en" />);
    await userEvent.selectOptions(await screen.findByLabelText("Finder"), "changing");
    const status = await screen.findByRole("status");
    await waitFor(() => expect(status).toHaveTextContent("Results: 0 known, 1 unknown"));
    expect(status).not.toHaveTextContent(/^Results: 0$/);
    expect(screen.getByRole("region", { name: "Unknown" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Known adult change tables" })).not.toBeInTheDocument();
  });

  it("names both groups in the changing-finder status, including French typography", async () => {
    render(<PackFindersPage source={fixtureSource()} lang="en" />);
    await userEvent.selectOptions(await screen.findByLabelText("Finder"), "changing");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Results: 1 known, 1 unknown"));

    cleanup();
    render(<PackFindersPage source={fixtureSource()} lang="fr" />);
    await userEvent.selectOptions(await screen.findByLabelText("Recherche"), "changing");
    const status = await screen.findByRole("status");
    await waitFor(() => expect(status.textContent ?? "").toBe("Résultats\u00A0: 1 connu, 1 inconnu"));
    expect(status.textContent ?? "").toContain("\u00A0:");
    expect(status.textContent ?? "").not.toMatch(/[^\u00A0]:/);
  });

  it("marks an uncatalogued pack field label as English only and replaces colons", () => {
    expect(packFieldLabel("unlisted_field", "en")).toBe("unlisted field (English only)");
    expect(packFieldLabel("unlisted_field", "fr")).toBe("unlisted field (en anglais seulement)");
    expect(packFieldLabel("foo:bar_baz", "fr")).toBe("foo bar baz (en anglais seulement)");
    expect(packFieldLabel("foo:bar_baz", "en")).toBe("foo bar baz (English only)");
  });

  it("pluralizes French known and unknown counts (1 connu, 2 connus)", () => {
    expect(packGroupCountPhrase(0, "known", "fr")).toBe("0 connus");
    expect(packGroupCountPhrase(1, "known", "fr")).toBe("1 connu");
    expect(packGroupCountPhrase(2, "known", "fr")).toBe("2 connus");
    expect(packGroupCountPhrase(0, "unknown", "fr")).toBe("0 inconnus");
    expect(packGroupCountPhrase(1, "unknown", "fr")).toBe("1 inconnu");
    expect(packGroupCountPhrase(2, "unknown", "fr")).toBe("2 inconnus");
    expect(packGroupCountPhrase(2, "known", "en")).toBe("2 known");
    expect(packGroupCountPhrase(2, "unknown", "en")).toBe("2 unknown");
  });

  it("passes axe on the changing-tables grouped headings in English and French", async () => {
    for (const lang of ["en", "fr"] as const) {
      const labels = lang === "fr"
        ? { kind: "Recherche", known: "Tables à langer pour adultes connues", unknown: "Inconnu" }
        : { kind: "Finder", known: "Known adult change tables", unknown: "Unknown" };
      const { container, unmount } = render(<PackFindersPage source={fixtureSource()} lang={lang} />);
      await userEvent.selectOptions(await screen.findByLabelText(labels.kind), "changing");
      await screen.findByRole("region", { name: labels.known });
      expect(screen.getByRole("region", { name: labels.unknown })).toBeInTheDocument();
      const results = await axe.run(container);
      expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
      unmount();
    }
  });
});
