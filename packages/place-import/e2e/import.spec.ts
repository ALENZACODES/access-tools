import { expect, test } from "playwright/test";
import axe from "axe-core";

for (const language of ["en", "fr"] as const) {
  for (const width of [1280, 320]) {
    test(`${language} at ${width}px: report and WCAG audit`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await page.locator("#lang").selectOption(language);
      await page.getByRole("button").click();
      await expect(page.locator("article")).toHaveCount(2);
      await page.addScriptTag({ content: axe.source });
      const violations = await page.evaluate(async () => {
        const auditor = (window as unknown as { axe: {
          run: (document: Document, options: object) => Promise<{ violations: unknown[] }>
        } }).axe;
        const result = await auditor.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
        });
        return result.violations;
      });
      expect(violations).toEqual([]);
    });
  }
}
