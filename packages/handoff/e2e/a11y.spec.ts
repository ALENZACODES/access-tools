import { expect, test } from "playwright/test";
import axe from "axe-core";

for (const language of ["en", "fr"] as const) {
  for (const width of [1280, 320]) {
    test(`${language} at ${width}px has no axe violations`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 });
      await page.goto("/");
      await page.locator("#language").selectOption(language);
      await expect(page.locator("h1")).toBeVisible();
      await page.evaluate(axe.source);
      const result = await page.evaluate(async () => {
        const runtime = (window as typeof window & { axe: typeof axe }).axe;
        return runtime.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } });
      });
      expect(result.violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }
}
