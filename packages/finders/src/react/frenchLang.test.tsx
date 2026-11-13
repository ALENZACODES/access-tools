import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  auditFixtureLanguage,
  englishFixtureSamples,
  fixturePack,
  FIXTURE_DAY,
  FixturePlaceNav,
  PlacePage,
} from "@access-tools/place";
import { ChargingFinder } from "./Finders.js";
import { ParkingFinder } from "./Finders.js";
import { RepairSupplyFinder } from "./Finders.js";
import { WashroomFinder } from "./Finders.js";

const REQUIRED = [
  "Fixture: Synthetic Parking Lot",
  "Fixture: Repair Bench Premises",
  "Fixture: Synthetic Trailhead",
  "Fixture washroom A",
  "Fixture washroom B, nothing measured",
  "Fixture bay A",
  "Fixture bay B",
  "Fixture centre outlet",
  "Ceiling track, fixture text",
  "Fixture note: ask at the synthetic desk.",
];

afterEach(() => cleanup());

describe("French fixture language", () => {
  it("marks every rendered English fixture string with lang=en", () => {
    const { container } = render(
      <div lang="fr">
        <FixturePlaceNav places={fixturePack.places} lang="fr" />
        {fixturePack.places.map((place) => (
          <PlacePage
            key={place.id}
            place={place}
            pack={fixturePack}
            lang="fr"
            today={FIXTURE_DAY}
            corrections={[]}
            changes={[]}
            onCorrection={() => undefined}
            onChange={() => undefined}
          />
        ))}
        <WashroomFinder
          pack={fixturePack}
          query={{
            text: "",
            lang: "fr",
            origin: null,
            transferSide: "any",
            changeTable: false,
            hoist: false,
            registerOnly: false,
            openAt: null,
            showHidden: true,
          }}
        />
        <ParkingFinder
          pack={fixturePack}
          query={{ text: "", lang: "fr", origin: null, vanLift: false, showHidden: true, month: 11 }}
        />
        <ChargingFinder
          pack={fixturePack}
          query={{ text: "", lang: "fr", origin: null, openAt: null, showHidden: true, userTestedRangeMetres: null }}
        />
        <RepairSupplyFinder
          pack={fixturePack}
          query={{
            text: "",
            lang: "fr",
            origin: null,
            kind: "all",
            mobileOnly: false,
            outOfHours: false,
            supplyCategory: "any",
            openAt: null,
            showHidden: true,
          }}
        />
      </div>,
    );

    const audit = auditFixtureLanguage(container, englishFixtureSamples(fixturePack));
    expect(audit.flatMap((row) => row.unmarked)).toEqual([]);
    for (const sample of REQUIRED) {
      const row = audit.find((item) => item.sample === sample);
      expect(row?.occurrences ?? 0, `${sample} was not rendered`).toBeGreaterThan(0);
    }

    const washroomGroups = [...container.querySelectorAll("optgroup")].filter((group) =>
      (group.getAttribute("label") ?? "").startsWith("Fixture washroom"),
    );
    expect(washroomGroups).toHaveLength(2);
    expect(washroomGroups.every((group) => group.getAttribute("lang") === "en")).toBe(true);
    const washroomOptions = washroomGroups.flatMap((group) => [...group.querySelectorAll("option")]);
    const washroomLabels = washroomOptions.map((option) => option.textContent ?? "");
    expect(washroomOptions).toHaveLength(28);
    expect(new Set(washroomLabels).size).toBe(washroomLabels.length);
    expect(washroomLabels.filter((text) => text.startsWith("Toilettes A\u00A0: "))).toHaveLength(14);
    expect(washroomLabels.filter((text) => text.startsWith("Toilettes B\u00A0: "))).toHaveLength(14);
    expect(washroomOptions.every((option) => option.getAttribute("lang") === "fr")).toBe(true);
    expect(washroomLabels.some((text) => text.includes("Fixture"))).toBe(false);
  }, 20_000);
});
