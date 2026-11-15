import { test, expect } from "playwright/test";
import axe from "axe-core";

for (const locale of ["en", "fr"] as const) {
  for (const width of [1280, 320]) {
    test(`${locale} empty demo status at ${width}px passes axe`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`/demo.html?lang=${locale}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("status")).toBeVisible();
      await expect(page.locator("body")).toContainText(locale === "en" ? "not a downloaded Ontario map" : "carte de l’Ontario téléchargée");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.addScriptTag({ content: axe.source });
      const results = await page.evaluate(async () => {
        const runner = (window as typeof window & { axe: typeof axe }).axe;
        return runner.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } });
      });
      expect(results.violations).toEqual([]);
    });
  }
}
