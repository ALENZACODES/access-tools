import { render } from "@testing-library/react";
import axe from "axe-core";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { fixturePack } from "@access-tools/place";
import { ChargingFinder, ParkingFinder, RepairSupplyFinder, WashroomFinder } from "./Finders.js";

async function expectClean(ui: ReactElement) {
  document.documentElement.lang = "en";
  document.title = "the App";
  const view = render(ui);
  const results = await axe.run(view.container, { rules: { region: { enabled: false } } });
  expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
  view.unmount();
}

describe("finder accessibility", () => {
  it("washroom, parking, charging, and repair views have no axe violations", async () => {
    await expectClean(
      <WashroomFinder
        pack={fixturePack}
        query={{
          text: "",
          lang: "en",
          origin: null,
          transferSide: "any",
          changeTable: false,
          hoist: false,
          registerOnly: true,
          openAt: null,
          showHidden: true,
        }}
      />,
    );
    await expectClean(
      <ParkingFinder
        pack={fixturePack}
        query={{ text: "", lang: "en", origin: null, vanLift: true, showHidden: true, month: 1 }}
      />,
    );
    await expectClean(
      <ChargingFinder
        pack={fixturePack}
        query={{ text: "", lang: "en", origin: null, openAt: null, showHidden: false, userTestedRangeMetres: null }}
      />,
    );
    await expectClean(
      <RepairSupplyFinder
        pack={fixturePack}
        query={{
          text: "",
          lang: "en",
          origin: null,
          kind: "all",
          mobileOnly: false,
          outOfHours: false,
          supplyCategory: "any",
          openAt: null,
          showHidden: false,
        }}
      />,
    );
  });
});
