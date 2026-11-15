import { expect, test } from "playwright/test";
import AxeBuilder from "axe-core";

for (const lang of ["en", "fr"] as const) {
  for (const width of [1280, 320]) {
    test(`${lang} ${width}px: audit capture, owner dashboard, axe`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      await page.getByLabel("Language").selectOption(lang);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await page.addScriptTag({ content: AxeBuilder.source });
      const results = await page.evaluate(async () => {
        const axe = (window as typeof window & { axe: typeof AxeBuilder }).axe;
        return axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } });
      });
      expect(results.violations).toEqual([]);
      await page.locator("select").nth(1).selectOption("venue-owner");
      await page.getByRole("button", { name: lang === "en" ? "Claim demo venue" : "Revendication du lieu fictif" }).click();
      await expect(page.locator("ol li")).toHaveCount(1);
      const ownerResults = await page.evaluate(async () => {
        const axe = (window as typeof window & { axe?: typeof AxeBuilder }).axe;
        if (!axe) throw new Error("axe missing");
        return axe.run(document);
      });
      expect(ownerResults.violations).toEqual([]);
    });
  }
}
