import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { fixturePack } from "@access-tools/place";
import { FinderDemo } from "../demo/main.js";
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

  it("puts a no-break space before the colon in French hidden records", () => {
    render(
      <WashroomFinder
        pack={fixturePack}
        query={{
          text: "",
          lang: "fr",
          origin: null,
          transferSide: "any",
          changeTable: true,
          hoist: false,
          registerOnly: false,
          openAt: null,
          showHidden: true,
        }}
      />,
    );
    const hidden = screen.getByRole("heading", { name: "Fiches cachées" }).closest("section");
    const item = hidden?.querySelector("li");
    expect(item?.textContent ?? "").toContain("\u00A0:");
    expect(item?.textContent ?? "").not.toMatch(/[^\u00A0]:/);
  });

  it("stacks the demo filter labels in English and French", async () => {
    const view = render(<FinderDemo />);
    const hidden = screen.getByText("Show hidden records").closest("label");
    const range = screen.getByText("Your tested range, in metres (optional)");
    expect(window.getComputedStyle(hidden as HTMLElement).display).toBe("block");
    expect(window.getComputedStyle(range).display).toBe("block");
    await userEvent.setup().click(screen.getByRole("button", { name: "Français" }));
    const frenchHidden = screen.getByText("Afficher les fiches cachées").closest("label");
    const frenchRange = screen.getByText("Votre autonomie testée, en mètres (facultatif)");
    expect(window.getComputedStyle(frenchHidden as HTMLElement).display).toBe("block");
    expect(window.getComputedStyle(frenchRange).display).toBe("block");
    view.unmount();
  });
});
