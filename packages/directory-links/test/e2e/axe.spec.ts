import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Set DIRECTORY_LINKS_URL to a page that mounts <DirectoryLinks />. Skipped when unset.
const url = process.env.DIRECTORY_LINKS_URL;

for (const width of [320, 1280]) {
  test(`axe: 0 violations at ${width}px`, async ({ page }) => {
    test.skip(!url, "DIRECTORY_LINKS_URL not set");
    await page.setViewportSize({ width, height: 900 });
    await page.goto(url as string);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
