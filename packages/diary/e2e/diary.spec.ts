import { test, expect } from "playwright/test";
import axe from "axe-core";

for (const width of [1280, 320]) {
  for (const language of ["en", "fr"] as const) {
    test(`${language} accessibility at ${width}px, before and after consent`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await page.locator("#language").selectOption(language);
      const inspect = async () => {
        await page.addScriptTag({ content: axe.source });
        const violations = await page.evaluate(async () => {
          const runtime = (window as typeof window & { axe: typeof axe }).axe;
          const result = await runtime.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } });
          return result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }));
        });
        expect(violations).toEqual([]);
      };
      await inspect();
      await page.getByRole("button", { name: language === "en" ? /I agree/ : /J'accepte/ }).click();
      await expect(page.locator("#entry-date")).toBeVisible();
      await inspect();
      await page.getByRole("button", { name: language === "en" ? "Save entry" : "Enregistrer l'entrée" }).last().click();
      await page.getByRole("button", { name: language === "en" ? "Withdraw consent" : "Retirer le consentement" }).click();
      await expect(page.locator("#entry-date")).toHaveCount(0);
      await inspect();
    });
  }
}
