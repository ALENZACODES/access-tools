/**
 * Master plan, Part 5, Days 1 to 6: acceptance checks for the code in access-tools.
 *
 * Each test title starts with the check id from the access-help day catalogue
 * (qa/src/days/catalog.ts). The access-help harness looks for these ids.
 *
 * Records here are the labelled fixtures in @access-tools/place. They are not
 * real places. Where a check names seeded Toronto data, the fixture stands in
 * for the access-maps seed and the test title says so.
 */
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { CATALOG, GAMES_BOUNDARY } from "@access-tools/games";
import { findWashrooms, type WashroomQuery } from "@access-tools/finders";
import {
  a11yCss,
  appendCorrection,
  correctionsFor,
  emptyLog,
  FIXTURE_DAY,
  fixturePack,
  placeById,
  readLog,
  writeLog,
  type EquipmentProfile,
  type ReportLog,
} from "@access-tools/place";
import { PlacePage } from "../../place/src/react/PlacePage.js";
import { emptySearchQuery, SearchPanel, searchPack, type SearchQuery } from "@access-tools/search";

afterEach(() => cleanup());

const SCOPE_LOCK = [
  "Grid Recall",
  "Pair Sequence",
  "Route Planner",
  "Pattern Rules",
  "Word Roots Builder",
  "Number Compare",
  "Focus Flankers",
  "Switch Rules",
  "Shape Assembly",
  "Order Keeper",
];

/** Commercial brain-training titles that must not appear. Not exhaustive. */
const PROPRIETARY = /lumosity|memory matrix|speed match|train of thought|lost in migration|pinball recall|ebb and flow|highway hazards/i;

function profile(overrides: Partial<EquipmentProfile>): EquipmentProfile {
  return {
    schemaVersion: "equipment-profile-1.0.0",
    chairType: null,
    widthMm: null,
    stepFreeRequired: false,
    adultChangeTable: false,
    ...overrides,
  };
}

function washroomQuery(overrides: Partial<WashroomQuery>): WashroomQuery {
  return {
    text: "",
    lang: "en",
    origin: null,
    transferSide: "any",
    changeTable: false,
    hoist: false,
    registerOnly: false,
    openAt: null,
    showHidden: true,
    ...overrides,
  };
}

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => [...values.keys()][index] ?? null,
    removeItem: (key: string) => void values.delete(key),
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

function Place({ placeId, lang = "en" }: { placeId: string; lang?: "en" | "fr" }) {
  const place = placeById(placeId);
  const [log, setLog] = useState<ReportLog>(emptyLog());
  if (!place) throw new Error(`no fixture ${placeId}`);
  return (
    <PlacePage
      place={place}
      pack={fixturePack}
      lang={lang}
      today={FIXTURE_DAY}
      corrections={correctionsFor(log, place.id)}
      changes={[]}
      onCorrection={(input) =>
        setLog((current) => appendCorrection(current, { ...input, placeId: place.id }, "2026-11-13T15:00:00.000Z", "c-1"))
      }
      onChange={() => undefined}
    />
  );
}

/** Search, then open the chosen place on the same screen, the way a host app would. */
function SearchThenPlace() {
  const [query, setQuery] = useState<SearchQuery>(emptySearchQuery("en"));
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div className="app-ui">
      <style>{a11yCss}</style>
      <SearchPanel pack={fixturePack} query={query} onQueryChange={setQuery} onOpenPlace={setOpened} />
      {opened ? <Place placeId={opened} /> : null}
    </div>
  );
}

describe("Day 1", () => {
  it("D01-6 the ten game definitions use the scope-lock names, no proprietary name, and a no-medical-claims notice", () => {
    expect(CATALOG.map((game) => game.name)).toEqual(SCOPE_LOCK);
    const blob = JSON.stringify(CATALOG) + JSON.stringify(GAMES_BOUNDARY);
    expect(blob).not.toMatch(PROPRIETARY);
    expect(GAMES_BOUNDARY.en).toContain("does not provide medical advice");
    expect(GAMES_BOUNDARY.fr.length).toBeGreaterThan(20);
    expect(GAMES_BOUNDARY.fr).not.toBe(GAMES_BOUNDARY.en);
  });
});

describe("Day 3", () => {
  it("D03-1 a search for a Toronto fixture shows the tier and links to that place's page (fixture stands in for the access-maps seed)", async () => {
    const user = userEvent.setup();
    render(<SearchThenPlace />);
    await user.type(screen.getByLabelText("Words"), "community centre");
    const link = screen.getByRole("link", { name: "Fixture: Synthetic Community Centre" });
    expect(link).toHaveAttribute("href", "#fix-community-centre");
    const item = link.closest("li");
    if (!item) throw new Error("no result item");
    expect(item.textContent).toContain("Toronto");
    expect(item.textContent).toContain("PROTOTYPE-UNVERIFIED");
    await user.click(link);
    expect(screen.getByRole("heading", { level: 1, name: "Fixture: Synthetic Community Centre" })).toBeInTheDocument();
  });

  it("D03-2 five place pages show tier, source, dates, the PROTOTYPE notice, and unknowns labelled Unknown", () => {
    const ids = ["fix-community-centre", "fix-cafe", "fix-change-hoist", "fix-parking-lot", "fix-library-charging"];
    for (const id of ids) {
      const place = placeById(id);
      if (!place) throw new Error(id);
      const view = render(<Place placeId={id} />);
      const page = within(view.container);
      expect(page.getByRole("note").textContent, id).toMatch(/PROTOTYPE/);
      const header = view.container.querySelector("header")?.textContent ?? "";
      expect(header, id).toContain("PROTOTYPE-UNVERIFIED");
      expect(header, id).toContain(place.recordProvenance.sourceName);
      expect(header, id).toContain(place.recordProvenance.sourceDate);
      expect(view.container.textContent, id).toContain("Unknown");
      expect(view.container.textContent, id).not.toMatch(/Verified by surveyor/);
      view.unmount();
    }
  });

  it("D03-3 a search with no match names the term, says no seeded place matched, and offers a next step", async () => {
    const user = userEvent.setup();
    render(<SearchThenPlace />);
    await user.type(screen.getByLabelText("Words"), "qqzx");
    const status = screen.getByRole("status").textContent ?? "";
    expect(status).toContain("“qqzx”");
    expect(status).toContain("No seeded place matched");
    expect(status).toMatch(/Try a broader word|clear a filter/);
    expect(searchPack(fixturePack, { ...emptySearchQuery("en"), text: "qqzx" }).matched).toBe(0);
  });

  it("D03-4 a correction is stored on the device, shows as pending, and does not change the displayed record", async () => {
    const user = userEvent.setup();
    render(<Place placeId="fix-cafe" />);
    const before = screen.getByRole("row", { name: /Door clear width/i }).textContent;
    await user.type(screen.getByLabelText("Suggested correction"), "Door looked wider");
    await user.click(screen.getByRole("button", { name: "Save correction on this device" }));
    expect(screen.getByText(/Pending correction/)).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Door clear width/i }).textContent).toBe(before);

    const storage = memoryStorage();
    const log = appendCorrection(
      emptyLog(),
      { placeId: "fix-cafe", fieldId: "entrance.doorClearWidthMm", suggestedCorrection: "Door looked wider", note: "" },
      "2026-11-13T15:00:00.000Z",
      "c-2",
    );
    writeLog(storage, log);
    const stored = correctionsFor(readLog(storage), "fix-cafe");
    expect(stored).toHaveLength(1);
    expect(stored[0]?.status).toBe("pending");
    expect(placeById("fix-cafe")?.entrance.doorClearWidthMm.value).toBeNull();
  });

  it("D03-5 search and the place page work by keyboard, with a visible focus style", async () => {
    const user = userEvent.setup();
    render(<SearchThenPlace />);
    await user.tab();
    const words = screen.getByLabelText("Words");
    while (document.activeElement !== words) await user.tab();
    await user.keyboard("community centre");
    const link = screen.getByRole("link", { name: "Fixture: Synthetic Community Centre" });
    for (let step = 0; step < 60 && document.activeElement !== link; step += 1) await user.tab();
    expect(link).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("heading", { level: 1, name: "Fixture: Synthetic Community Centre" })).toBeInTheDocument();
    expect(a11yCss).toMatch(/a:focus-visible/);
    expect(a11yCss).toMatch(/outline/);
  });

  it("D03-6 a skeleton city list shows thin data honestly and makes no depth claim", () => {
    const result = searchPack(fixturePack, { ...emptySearchQuery("en"), placeType: "skeleton" });
    const cities = result.hits.map((hit) => hit.municipality).sort();
    expect(cities).toEqual(["Ottawa", "Thunder Bay"]);
    for (const hit of result.hits) {
      const view = render(<Place placeId={hit.placeId} />);
      const text = view.container.textContent ?? "";
      expect(text).toContain(`Skeleton seed for ${hit.municipality}`);
      expect(text).toContain("absent from this seed");
      expect(text).not.toMatch(/fully mapped|complete coverage|every place in/i);
      expect(text).not.toContain("Verified by surveyor");
      view.unmount();
    }
  });
});

describe("Day 6", () => {
  it("D06-2 a power chair profile flags places, and each flag names the profile setting", () => {
    const base = searchPack(fixturePack, emptySearchQuery("en"));
    const power = searchPack(fixturePack, { ...emptySearchQuery("en"), profile: profile({ chairType: "power" }) });
    const flagged = power.hits.filter((hit) => hit.profileNotes.length > 0);
    expect(flagged.length).toBeGreaterThan(0);
    expect(base.hits.every((hit) => hit.profileNotes.length === 0)).toBe(true);
    for (const hit of flagged) {
      const place = placeById(hit.placeId);
      expect(place?.entrance.stepFree.value).not.toBe("yes");
      expect(hit.profileNotes.join(" ")).toContain("Profile setting “Chair type: Power wheelchair”");
    }
    // A flag does not hide a record.
    expect(power.hits.length).toBe(base.hits.length);
    // Other profile settings that hide records also name the setting.
    const strict = searchPack(fixturePack, {
      ...emptySearchQuery("en"),
      profile: profile({ chairType: "power", stepFreeRequired: true, widthMm: 900 }),
    });
    expect(strict.hidden.length).toBeGreaterThan(0);
    for (const hit of strict.hidden) {
      for (const reason of hit.hiddenReasons) expect(reason).toMatch(/^Profile setting “[^”]+”\./);
    }
    const french = searchPack(fixturePack, { ...emptySearchQuery("fr"), profile: profile({ chairType: "power" }) });
    expect(french.hits.flatMap((hit) => hit.profileNotes).join(" ")).toContain("Réglage du profil « Type de fauteuil");
  });

  it("D06-3 an adult change table preference filters washrooms and explains each hidden one", () => {
    const all = findWashrooms(fixturePack, washroomQuery({}));
    const filtered = findWashrooms(fixturePack, washroomQuery({ profile: profile({ adultChangeTable: true }) }));
    expect(filtered.hits.length).toBeGreaterThan(0);
    expect(filtered.hits.length).toBeLessThan(all.hits.length);
    for (const hit of filtered.hidden) {
      expect(hit.hiddenReasons.join(" ")).toContain("Profile setting “Adult change table needed”");
    }
    for (const hit of filtered.hits) {
      const washroom = fixturePack.places.flatMap((place) => place.washrooms).find((item) => item.id === hit.washroomId);
      expect(washroom?.changeTable.value?.present).toBe("yes");
    }
  });
});
