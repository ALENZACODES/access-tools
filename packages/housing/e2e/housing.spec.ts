import { test, expect } from "playwright/test";
import axe from "axe-core";
for (const language of ["en", "fr"] as const) {
  for (const width of [1280, 320]) {
    test(`${language} accessibility at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      await page.locator("#language").selectOption(language);
      await expect(page.locator("main h1")).toBeVisible();
      await page.addScriptTag({ content: axe.source });
      const violations = await page.evaluate(async () => {
        const runner = (window as unknown as { axe: { run: (options: object) => Promise<{ violations: { id: string }[] }> } }).axe;
        return (await runner.run({ runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((v) => v.id);
      });
      expect(violations).toEqual([]);
      await page.locator("#door-width").fill("2000");
      await expect(page.locator(".empty")).toBeVisible();
      await page.getByRole("button", { name: language === "en" ? "Broaden filters" : "Élargir les filtres" }).click();
      await expect(page.locator(".room")).toHaveCount(2);
      await expect(page.locator(".unit-card")).toHaveCount(5);
      await page.locator("#depth-requireRollInShower").check();
      await expect(page.locator(".unit-card")).toHaveCount(2);
      await page.locator("#depth-requireHoist").check();
      await expect(page.locator(".unit-card")).toHaveCount(0);
      await page.locator("#evidence-agree").check();
      await page.getByRole("button", { name: language === "en" ? "Save report" : "Enregistrer le signalement" }).click();
      await expect(page.locator("#barriers-heading ~ p[role=status]")).not.toBeEmpty();
      const again = await page.evaluate(async () => {
        const runner = (window as unknown as { axe: { run: (options: object) => Promise<{ violations: { id: string }[] }> } }).axe;
        return (await runner.run({ runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((v) => v.id);
      });
      expect(again).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    });
  }
}
