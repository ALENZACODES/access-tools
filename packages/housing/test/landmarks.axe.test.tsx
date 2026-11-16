// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { HousingFinder } from "../src/HousingFinder.js";

afterEach(() => { cleanup(); window.localStorage.clear(); });

/** Region landmarks: a section or role=region element with an accessible name. */
function regionNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll<HTMLElement>("section[aria-labelledby], section[aria-label], [role=region]")].map((el) => {
    const ids = el.getAttribute("aria-labelledby");
    if (ids) return ids.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ").trim();
    return el.getAttribute("aria-label") ?? "";
  });
}

describe("housing page landmarks", () => {
  for (const lang of ["en", "fr"] as const) {
    it(`gives every landmark a unique name and passes axe landmark rules (${lang})`, async () => {
      document.documentElement.lang = lang;
      document.title = "the App";
      const view = render(<HousingFinder />);
      if (lang === "fr") fireEvent.change(screen.getByLabelText("Language"), { target: { value: "fr" } });
      // The unit cards are on screen, so their room blocks are part of the check.
      expect(view.container.querySelectorAll(".unit-card").length).toBeGreaterThan(1);
      const names = regionNames(view.container);
      expect(names.length).toBeGreaterThan(0);
      expect(new Set(names).size).toBe(names.length);
      const results = await axe.run(view.container, {
        runOnly: { type: "rule", values: ["landmark-unique", "landmark-no-duplicate-main", "landmark-main-is-top-level", "landmark-complementary-is-top-level", "aria-allowed-role"] },
      });
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
      const full = await axe.run(view.container, { rules: { region: { enabled: false } } });
      expect(full.violations.map((v) => v.id)).toEqual([]);
    });
  }
});
