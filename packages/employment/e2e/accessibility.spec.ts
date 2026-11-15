import { test, expect } from "playwright/test";
import axe from "axe-core";

for (const width of [1280, 320]) {
  for (const language of ["en", "fr"] as const) {
    test(`${language} accessibility at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      if (language === "fr") await page.getByLabel("Language").selectOption("fr");
      await expect(page.locator("main")).toHaveAttribute("lang", language);
      await page.getByRole("button", { name: /View details|Voir les détails/ }).last().click();
      await expect(page.getByRole("heading", { level: 2 })).toHaveCount(2);
      await page.addScriptTag({ content: axe.source });
      const report = await page.evaluate(async () => {
        const injectedAxe = (window as typeof window & { axe: typeof axe }).axe;
        return injectedAxe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } });
      });
      expect(report.violations, JSON.stringify(report.violations, null, 2)).toEqual([]);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow).toBe(false);
    });
  }
}
