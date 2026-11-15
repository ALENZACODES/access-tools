import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertFrenchCatalog,
  auditFixtureLanguage,
  englishFixtureSamples,
  EQUIPMENT_PROFILE_KEY,
  fixturePack,
  frenchColonViolations,
  placeById,
  type EquipmentProfile,
  type Lang,
} from "@access-tools/place";
import { FinderDemo } from "../demo/main.js";
import { broadenParkingQuery, broadenWashroomQuery, destinationText, parkingFilters, washroomFilters } from "../filters.js";
import { FINDER_COPY } from "../i18n.js";
import { findParking, type ParkingQuery } from "../parking.js";
import { findWashrooms, type WashroomQuery } from "../washrooms.js";
import { ParkingFinder } from "./ParkingFinder.js";
import { WashroomFinder } from "./WashroomFinder.js";

const LANGS: Lang[] = ["en", "fr"];

function profile(part: Partial<EquipmentProfile>): EquipmentProfile {
  return {
    schemaVersion: "equipment-profile-1.0.0",
    chairType: null,
    widthMm: null,
    stepFreeRequired: false,
    adultChangeTable: false,
    ...part,
  };
}

function washroomQuery(part: Partial<WashroomQuery> = {}): WashroomQuery {
  return {
    text: "",
    lang: "en",
    origin: null,
    transferSide: "any",
    changeTable: false,
    hoist: false,
    registerOnly: false,
    openAt: null,
    showHidden: false,
    ...part,
  };
}

function parkingQuery(part: Partial<ParkingQuery> = {}): ParkingQuery {
  return { text: "", lang: "en", origin: null, vanLift: false, showHidden: false, month: 11, ...part };
}

/** "Unverified" and the PROTOTYPE-UNVERIFIED label are allowed. Any other "verified" wording is a claim. */
function verifiedClaims(text: string): string[] {
  const stripped = text
    .replace(/PROTOTYPE-UNVERIFIED/g, "")
    .replace(/unverified/gi, "")
    .replace(/non vérifié(e)?(s)?/gi, "");
  return stripped.match(/\S*(verif|vérif)\S*/gi) ?? [];
}

async function expectAxeClean(container: HTMLElement, lang: Lang) {
  document.documentElement.lang = lang;
  document.title = "the App";
  const results = await axe.run(container, { rules: { region: { enabled: false } } });
  expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("catalog", () => {
  it("has English and French for every string and a no-break space before each French colon", () => {
    expect(() => assertFrenchCatalog(FINDER_COPY)).not.toThrow();
    expect(frenchColonViolations(FINDER_COPY)).toEqual([]);
  });
});

describe("washroom finder logic", () => {
  it("searches by destination name in either language, address, or municipality", () => {
    const english = findWashrooms(fixturePack, washroomQuery({ text: "Change Table and Hoist" }));
    expect(english.hits.map((hit) => hit.washroomId)).toEqual(["fix-hoist-wash"]);
    const french = findWashrooms(fixturePack, washroomQuery({ text: "salle de change", lang: "en" }));
    expect(french.hits.map((hit) => hit.washroomId)).toEqual(["fix-hoist-wash"]);
    const address = findWashrooms(fixturePack, washroomQuery({ text: "1 fixture lane" }));
    expect(address.hits.map((hit) => hit.placeId)).toEqual(["fix-community-centre", "fix-community-centre"]);
    expect(findWashrooms(fixturePack, washroomQuery({ text: "toronto" })).hits).toHaveLength(3);
    expect(findWashrooms(fixturePack, washroomQuery({ text: "no such destination" })).hits).toHaveLength(0);
  });

  it("applies the adult change table from the profile and names it as a filter", () => {
    const query = washroomQuery({ profile: profile({ adultChangeTable: true }) });
    const result = findWashrooms(fixturePack, query);
    expect(result.hits.map((hit) => hit.washroomId)).toEqual(["fix-hoist-wash"]);
    expect(result.filters).toHaveLength(1);
    expect(result.filters[0]).toMatchObject({ id: "change-table", origin: "profile", label: "Adult change table needed" });
    expect(result.filters[0]?.explanation).toMatch(/Unknown is not a match/);
  });

  it("explains every profile filter and every screen filter that is on", () => {
    const filters = washroomFilters(
      washroomQuery({
        profile: profile({ widthMm: 700, stepFreeRequired: true, adultChangeTable: true }),
        hoist: true,
        registerOnly: true,
        transferSide: "left",
        openAt: { day: 1, minutes: 600 },
      }),
    );
    expect(filters.map((filter) => filter.id)).toEqual(["change-table", "width", "step-free", "hoist", "register", "transfer", "open-at"]);
    expect(filters.every((filter) => filter.explanation.length > 20)).toBe(true);
    expect(filters.find((filter) => filter.id === "width")?.label).toBe("Chair width: 700 mm");
    expect(washroomFilters(washroomQuery())).toEqual([]);
    expect(washroomFilters(washroomQuery({ profile: profile({ chairType: "power" }) }))).toEqual([]);
  });

  it("gives every field a value or Unknown, with tier, source, and record date", () => {
    for (const lang of LANGS) {
      const unknown = lang === "fr" ? "Inconnu" : "Unknown";
      const result = findWashrooms(fixturePack, washroomQuery({ lang }));
      expect(result.hits).toHaveLength(3);
      for (const hit of result.hits) {
        expect(hit.fields).toHaveLength(14);
        for (const field of hit.fields) {
          expect(field.label.trim()).not.toBe("");
          expect(field.valueText.trim()).not.toBe("");
          expect(field.tierText.trim()).not.toBe("");
          expect(field.sourceName.trim()).not.toBe("");
          expect(field.recordDate.trim()).not.toBe("");
          if (field.unknown) {
            expect(field.valueText).toBe(unknown);
            expect(field.recordDate).toBe(unknown);
          } else {
            expect(field.recordDate).toBe("2026-11-13");
            expect(field.tierText).toContain("PROTOTYPE-UNVERIFIED");
          }
        }
      }
      const blank = result.hits.find((hit) => hit.washroomId === "fix-cc-wash-2");
      expect(blank?.fields.every((field) => field.unknown)).toBe(true);
    }
  });

  it("counts the seeded records and the records at the destination", () => {
    const result = findWashrooms(fixturePack, washroomQuery({ text: "Community Centre", profile: profile({ adultChangeTable: true }) }));
    expect(result.empty).toBe(true);
    expect(result.seeded).toEqual({ records: 3, places: 2 });
    expect(result.destinationCount).toBe(2);
  });

  it("broadens by turning every filter off without touching the destination or the saved profile", () => {
    const saved = profile({ chairType: "power", widthMm: 2000, stepFreeRequired: true, adultChangeTable: true });
    const query = washroomQuery({ text: "Community", profile: saved, hoist: true, registerOnly: true, transferSide: "right" });
    const broad = broadenWashroomQuery(query);
    expect(washroomFilters(broad)).toEqual([]);
    expect(broad.text).toBe("Community");
    expect(broad.profile?.chairType).toBe("power");
    expect(saved).toEqual(profile({ chairType: "power", widthMm: 2000, stepFreeRequired: true, adultChangeTable: true }));
    expect(findWashrooms(fixturePack, query).hits).toHaveLength(0);
    expect(findWashrooms(fixturePack, broad).hits).toHaveLength(2);
  });
});

describe("parking finder logic", () => {
  it("clusters bays by destination", () => {
    const result = findParking(fixturePack, parkingQuery({ origin: { latitude: 43.7, longitude: -79.4 } }));
    expect(result.clusters.map((cluster) => [cluster.placeId, cluster.bays.map((bay) => bay.bayId)])).toEqual([
      ["fix-community-centre", ["fix-cc-bay-a", "fix-cc-bay-b"]],
      ["fix-parking-lot", ["fix-lot-bay"]],
    ]);
    expect(result.seeded).toEqual({ records: 3, places: 2 });
    const one = findParking(fixturePack, parkingQuery({ text: "Synthetic Parking Lot" }));
    expect(one.clusters).toHaveLength(1);
    expect(one.destinationCount).toBe(1);
  });

  it("shows space type, van-accessible status, entrance distance, surface, and payment with tier, source, and record date", () => {
    const result = findParking(fixturePack, parkingQuery());
    const bayA = result.hits.find((hit) => hit.bayId === "fix-cc-bay-a");
    const byId = (suffix: string) => bayA?.fields.find((field) => field.id === `fix-cc-bay-a.${suffix}`);
    expect(byId("type")?.valueText).toBe("Type A van-accessible bay");
    expect(byId("van")?.valueText).toBe("Recorded as van-accessible (Type A).");
    expect(byId("distance")?.valueText).toBe("40 m");
    expect(byId("surface")?.valueText).toBe("Fixture surface text: paved");
    expect(byId("payment")?.valueText).toMatch(/payment method not recorded/);
    for (const suffix of ["type", "van", "distance", "surface", "payment"]) {
      expect(byId(suffix)).toMatchObject({
        unknown: false,
        tierText: "PROTOTYPE-UNVERIFIED. Labelled fixture. Unverified by the App.",
        sourceName: "access-tools labelled fixture",
        recordDate: "2026-11-13",
      });
    }
    const lot = result.hits.find((hit) => hit.bayId === "fix-lot-bay");
    const lotField = (suffix: string) => lot?.fields.find((field) => field.id === `fix-lot-bay.${suffix}`);
    expect(lotField("van")?.valueText).toBe("Not recorded as van-accessible (Type B).");
    for (const suffix of ["distance", "surface", "step-free", "aisle"]) {
      expect(lotField(suffix)).toMatchObject({
        unknown: true,
        valueText: "Unknown",
        tierText: "No tier. Unverified.",
        sourceName: "No source",
        recordDate: "Unknown",
      });
    }
  });

  it("explains the profile filter, and broadening turns it off", () => {
    const query = parkingQuery({ profile: profile({ stepFreeRequired: true, widthMm: 700 }), vanLift: true });
    expect(parkingFilters(query).map((filter) => [filter.id, filter.origin])).toEqual([
      ["step-free", "profile"],
      ["van-lift", "screen"],
    ]);
    const strict = findParking(fixturePack, query);
    expect(strict.empty).toBe(true);
    expect(strict.clusters).toEqual([]);
    const broad = findParking(fixturePack, broadenParkingQuery(query));
    expect(broad.filters).toEqual([]);
    expect(broad.hits).toHaveLength(3);
  });
});

describe("washroom finder screen", () => {
  it.each(LANGS)("labels demonstration data and says what is not shown (%s)", (lang) => {
    render(<WashroomFinder pack={fixturePack} query={washroomQuery({ lang })} />);
    const notes = screen.getAllByRole("note").map((note) => note.textContent ?? "");
    if (lang === "en") {
      expect(notes.some((text) => text.startsWith("Demonstration data."))).toBe(true);
      expect(notes.some((text) => /available, open right now, or clean/.test(text))).toBe(true);
    } else {
      expect(notes.some((text) => text.startsWith("Données de démonstration."))).toBe(true);
      expect(notes.some((text) => /disponibles, ouvertes en ce moment ou propres/.test(text))).toBe(true);
    }
  });

  it("renders every field of every result with tier, source, and record date", () => {
    const { container } = render(<WashroomFinder pack={fixturePack} query={washroomQuery()} />);
    const cards = [...container.querySelectorAll("[data-washroom]")];
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      const fields = [...card.querySelectorAll("[data-field]")];
      expect(fields).toHaveLength(14);
      for (const field of fields) {
        const text = field.textContent ?? "";
        expect(text).toMatch(/Tier: \S/);
        expect(text).toMatch(/Source: \S/);
        expect(text).toMatch(/Record date: (2026-11-13|Unknown)/);
      }
    }
    const blank = container.querySelector('[data-washroom="fix-cc-wash-2"]') as HTMLElement;
    expect(within(blank).getAllByText("Unknown", { selector: "dd" })).toHaveLength(14);
    expect(blank.querySelectorAll(".unknown")).toHaveLength(14);
  });

  it("filters as the destination is typed", async () => {
    const user = userEvent.setup();
    const { container } = render(<WashroomFinder pack={fixturePack} query={washroomQuery()} />);
    await user.type(screen.getByRole("searchbox", { name: "Destination" }), "hoist room");
    expect([...container.querySelectorAll("[data-washroom]")].map((card) => card.getAttribute("data-washroom"))).toEqual(["fix-hoist-wash"]);
    expect(screen.getByRole("status")).toHaveTextContent("1 washroom record(s) listed.");
  });

  it("explains the applied profile filters above the results", () => {
    const { container } = render(
      <WashroomFinder pack={fixturePack} query={washroomQuery({ profile: profile({ adultChangeTable: true, widthMm: 900 }) })} />,
    );
    const filters = container.querySelector("[data-finder-filters]") as HTMLElement;
    expect(within(filters).getByRole("heading", { name: "Filters applied" })).toBeInTheDocument();
    const change = filters.querySelector('[data-filter="change-table"]')?.textContent ?? "";
    expect(change).toContain("Adult change table needed");
    expect(change).toContain("From your saved equipment profile.");
    expect(change).toContain("Only a washroom with an adult change table recorded as present is listed.");
    expect(filters.querySelector('[data-filter="width"]')?.textContent).toContain("Chair width: 900 mm");
    expect([...container.querySelectorAll("[data-washroom]")].map((card) => card.getAttribute("data-washroom"))).toEqual(["fix-hoist-wash"]);
  });

  it("names the filters and the seeded count in the empty state, then broadens and restores", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <WashroomFinder
        pack={fixturePack}
        query={washroomQuery({ text: "Fixture: Synthetic Community Centre", profile: profile({ adultChangeTable: true }) })}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("No washroom record matches.");
    const empty = container.querySelector("[data-finder-empty]") as HTMLElement;
    expect(empty).toHaveTextContent("Filters on: Adult change table needed.");
    expect(empty).toHaveTextContent("Destination searched: Fixture: Synthetic Community Centre.");
    expect(empty).toHaveTextContent("The demonstration data holds 3 washroom record(s) in 2 place(s). 2 match(es) this destination before the filters.");
    const broaden = within(empty).getByRole("button", { name: "Broaden filters" });
    expect(broaden).toHaveAccessibleDescription(/turns off the filters named above for this list only/);

    await user.click(broaden);
    expect(container.querySelectorAll("[data-washroom]")).toHaveLength(2);
    expect(container.querySelector("[data-finder-empty]")).toBeNull();
    expect(screen.getByRole("status")).toHaveFocus();
    expect(screen.getByText("Filters turned off for this list: Adult change table needed. Your saved profile is not changed.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Restore my filters" }));
    expect(container.querySelectorAll("[data-washroom]")).toHaveLength(0);
    expect(container.querySelector("[data-finder-empty]")).not.toBeNull();
  });

  it("clears the destination when Broaden is used with no filter on", async () => {
    const user = userEvent.setup();
    const { container } = render(<WashroomFinder pack={fixturePack} query={washroomQuery({ text: "nowhere at all" })} />);
    const empty = container.querySelector("[data-finder-empty]") as HTMLElement;
    expect(empty).toHaveTextContent("No filter is on.");
    expect(empty).toHaveTextContent("0 match(es) this destination before the filters.");
    await user.click(within(empty).getByRole("button", { name: "Broaden filters" }));
    expect(screen.getByRole("searchbox", { name: "Destination" })).toHaveValue("");
    expect(container.querySelectorAll("[data-washroom]")).toHaveLength(3);
  });

  it("shows Back only when opened from a journey, and Back calls the journey", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const plain = render(<WashroomFinder pack={fixturePack} query={washroomQuery()} />);
    expect(screen.queryByRole("button", { name: "Back to the journey" })).toBeNull();
    plain.unmount();
    render(<WashroomFinder pack={fixturePack} query={washroomQuery({ text: "Community" })} entry={{ from: "journey", onBack }} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveFocus();
    expect(screen.getByText(/Opened from a journey result/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to the journey" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe("parking finder screen", () => {
  it.each(LANGS)("says it lists spaces the data records, not free spaces (%s)", (lang) => {
    render(<ParkingFinder pack={fixturePack} query={parkingQuery({ lang })} />);
    const notes = screen.getAllByRole("note").map((note) => note.textContent ?? "");
    if (lang === "en") {
      expect(notes).toContain(
        "This list shows spaces the data says exist. It does not show spaces that are free right now. No live availability feed is connected.",
      );
      expect(notes.some((text) => text.startsWith("Demonstration data."))).toBe(true);
    } else {
      expect(notes.some((text) => /places qui existent selon les données/.test(text) && /libres en ce moment/.test(text))).toBe(true);
      expect(notes.some((text) => text.startsWith("Données de démonstration."))).toBe(true);
    }
  });

  it("renders the results as a list of destinations, each with a list of bays", () => {
    const { container } = render(<ParkingFinder pack={fixturePack} query={parkingQuery()} />);
    const clusters = [...container.querySelectorAll("li[data-destination]")];
    expect(clusters.map((cluster) => cluster.getAttribute("data-destination")).sort()).toEqual(["fix-community-centre", "fix-parking-lot"]);
    expect(clusters.every((cluster) => cluster.parentElement?.tagName === "UL")).toBe(true);
    const centre = container.querySelector('li[data-destination="fix-community-centre"]') as HTMLElement;
    expect(within(centre).getByRole("heading", { level: 3 })).toHaveTextContent("Fixture: Synthetic Community Centre");
    const bays = [...centre.querySelectorAll("li[data-bay]")];
    expect(bays.map((bay) => bay.getAttribute("data-bay"))).toEqual(["fix-cc-bay-a", "fix-cc-bay-b"]);
    expect(container.querySelector("table")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("3 bay record(s) listed at 2 destination(s).");
  });

  it("shows each required field with tier, source, and record date, and Unknown where unknown", () => {
    const { container } = render(<ParkingFinder pack={fixturePack} query={parkingQuery()} />);
    for (const bay of container.querySelectorAll("li[data-bay]")) {
      const labels = [...bay.querySelectorAll("[data-field] dt")].map((dt) => dt.textContent);
      expect(labels.slice(0, 5)).toEqual(["Space type", "Van-accessible", "Distance to the entrance", "Surface", "Payment notes"]);
      for (const field of bay.querySelectorAll("[data-field]")) {
        const text = field.textContent ?? "";
        expect(text).toMatch(/Tier: \S/);
        expect(text).toMatch(/Source: \S/);
        expect(text).toMatch(/Record date: (2026-11-13|Unknown)/);
      }
    }
    const surface = container.querySelector('[data-field="fix-lot-bay.surface"]') as HTMLElement;
    expect(surface).toHaveClass("unknown");
    expect(surface).toHaveTextContent("SurfaceUnknownTier: No tier. Unverified.Source: No sourceRecord date: Unknown");
  });

  it("gives an honest empty state that names the filter and the seeded count, and broadens", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ParkingFinder pack={fixturePack} query={parkingQuery({ profile: profile({ stepFreeRequired: true, adultChangeTable: true }) })} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("No parking bay matches.");
    const filters = container.querySelector("[data-finder-filters]") as HTMLElement;
    expect(filters).toHaveTextContent("Only a bay whose route to the entrance is recorded as step-free is listed. Unknown is not a match.");
    expect(filters).toHaveTextContent("The chair width and adult change table settings in your profile do not filter parking bays.");
    const empty = container.querySelector("[data-finder-empty]") as HTMLElement;
    expect(empty).toHaveTextContent("Filters on: Step-free required.");
    expect(empty).toHaveTextContent("The demonstration data holds 3 parking bay record(s) in 2 place(s). 3 match(es) this destination before the filters.");
    expect(empty).toHaveTextContent("A gap in the demonstration data is not proof that nothing exists.");
    await user.click(within(empty).getByRole("button", { name: "Broaden filters" }));
    expect(container.querySelectorAll("li[data-bay]")).toHaveLength(3);
  });

  it("names the screen it returns to when opened from a place page", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<ParkingFinder pack={fixturePack} query={parkingQuery({ text: "Parking Lot" })} entry={{ from: "place", onBack }} />);
    expect(screen.getByText(/Opened from a place page/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to the place page" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe("no verified label, and French marks the English fixture text", () => {
  it.each(LANGS)("washroom and parking screens label nothing as verified (%s)", (lang) => {
    const { container } = render(
      <div>
        <WashroomFinder pack={fixturePack} query={washroomQuery({ lang, showHidden: true, registerOnly: true })} />
        <ParkingFinder pack={fixturePack} query={parkingQuery({ lang, showHidden: true, vanLift: true })} />
      </div>,
    );
    expect(verifiedClaims(container.textContent ?? "")).toEqual([]);
  });

  it("marks every English fixture string on the French screens, including the empty states", () => {
    const { container } = render(
      <div lang="fr">
        <WashroomFinder pack={fixturePack} query={washroomQuery({ lang: "fr", showHidden: true })} />
        <ParkingFinder pack={fixturePack} query={parkingQuery({ lang: "fr", showHidden: true })} />
      </div>,
    );
    const audit = auditFixtureLanguage(container, englishFixtureSamples(fixturePack));
    expect(audit.flatMap((row) => row.unmarked)).toEqual([]);
    expect(audit.find((row) => row.sample === "Fixture surface text: paved")?.occurrences ?? 0).toBeGreaterThan(0);
    const french = container.cloneNode(true) as HTMLElement;
    french.querySelectorAll('[lang="en"], style').forEach((node) => node.remove());
    expect(french.textContent).not.toMatch(/Unknown|Tier:|Record date|Source:/);
  });
});

describe("demo entry points", () => {
  function saveProfile(part: Partial<EquipmentProfile>) {
    window.localStorage.setItem(EQUIPMENT_PROFILE_KEY, JSON.stringify(profile(part)));
  }

  it("opens the washroom finder filtered from the journey result, and Back returns to the journey", async () => {
    saveProfile({ adultChangeTable: true });
    const user = userEvent.setup();
    const view = render(<FinderDemo />);
    const opener = screen.getByRole("button", { name: "Washrooms for this destination" });
    await user.click(opener);
    expect(screen.queryByRole("heading", { name: "Demonstration journey result" })).toBeNull();
    const destination = placeById("fix-community-centre");
    expect(screen.getByRole("searchbox", { name: "Destination" })).toHaveValue(destination ? destinationText(destination, "en") : "");
    expect(view.container.querySelector('[data-filter="change-table"]')).not.toBeNull();
    expect(view.container.querySelectorAll("[data-washroom]")).toHaveLength(0);
    expect(screen.getByRole("heading", { level: 2, name: "Washrooms, change tables, and hoists" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Back to the journey" }));
    expect(screen.getByRole("heading", { name: "Demonstration journey result" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Washrooms for this destination" })).toHaveFocus();
  });

  it("opens parking in one action from the journey result and from the place page", async () => {
    const user = userEvent.setup();
    const view = render(<FinderDemo />);
    await user.click(screen.getByRole("button", { name: "Parking for this destination" }));
    expect([...view.container.querySelectorAll("li[data-destination]")].map((item) => item.getAttribute("data-destination"))).toEqual([
      "fix-community-centre",
    ]);
    await user.click(screen.getByRole("button", { name: "Back to the journey" }));

    await user.click(screen.getByRole("button", { name: "Accessible parking at this place" }));
    expect([...view.container.querySelectorAll("li[data-destination]")].map((item) => item.getAttribute("data-destination"))).toEqual([
      "fix-parking-lot",
    ]);
    await user.click(screen.getByRole("button", { name: "Back to the place page" }));
    expect(screen.getByRole("button", { name: "Accessible parking at this place" })).toHaveFocus();
  });

  it("keeps the destination match after the language changes", async () => {
    const user = userEvent.setup();
    const view = render(<FinderDemo />);
    await user.click(screen.getByRole("button", { name: "Washrooms for this destination" }));
    await user.click(screen.getByRole("button", { name: "Français" }));
    expect(view.container.querySelectorAll("[data-washroom]")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Retour au trajet" })).toBeInTheDocument();
  });
});

describe("axe in jsdom", () => {
  it.each(LANGS)("results, empty states, and entry views have no violations (%s)", async (lang) => {
    const strict = profile({ adultChangeTable: true, stepFreeRequired: true, widthMm: 900 });
    const views = [
      <WashroomFinder key="w" pack={fixturePack} query={washroomQuery({ lang, showHidden: true })} entry={{ from: "journey", onBack: () => undefined }} />,
      <WashroomFinder key="we" pack={fixturePack} query={washroomQuery({ lang, text: "Community", showHidden: true, profile: strict })} />,
      <ParkingFinder key="p" pack={fixturePack} query={parkingQuery({ lang, showHidden: true })} entry={{ from: "place", onBack: () => undefined }} />,
      <ParkingFinder key="pe" pack={fixturePack} query={parkingQuery({ lang, showHidden: true, profile: strict })} />,
    ];
    for (const ui of views) {
      const view = render(ui);
      await expectAxeClean(view.container, lang);
      view.unmount();
    }
  }, 30_000);
});
