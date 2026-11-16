import { expect, test } from "playwright/test";
import type { Page } from "playwright/test";
import AxeBuilder from "axe-core";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
async function violations(page: Page) {
  return page.evaluate(async (tags) => {
    const axe = (window as typeof window & { axe?: typeof AxeBuilder }).axe;
    if (!axe) throw new Error("axe missing");
    return (await axe.run(document, { runOnly: { type: "tag", values: tags } })).violations;
  }, TAGS);
}

for (const lang of ["en", "fr"] as const) {
  for (const width of [1280, 320]) {
    test(`${lang} ${width}px: audit record, programme, owner dashboard, coordinator, axe`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      await page.getByLabel("Language").selectOption(lang);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await page.addScriptTag({ content: AxeBuilder.source });
      await expect(page.locator('[data-field]')).toHaveCount(8);
      await expect(page.getByTestId("service-no-data")).toBeVisible();
      expect(await violations(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

      await page.locator("select").nth(1).selectOption("venue-owner");
      await page.getByRole("button", { name: lang === "en" ? "Claim demo venue" : "Revendication du lieu fictif" }).click();
      await expect(page.locator("ol.trail li")).toHaveCount(1);
      await expect(page.getByTestId("barrier-status")).toHaveCount(2);
      expect(await violations(page)).toEqual([]);

      // A dispute without a reason is refused; with a reason it raises a re-check and leaves the record alone.
      const step = page.locator('section[aria-labelledby="venue-heading"] [data-case="fx-case-step"]');
      const before = await page.locator('[data-field="stepHeightMm"]').textContent();
      await step.getByRole("radio").nth(2).check();
      await step.getByRole("button").click();
      await expect(step.getByRole("alert")).not.toBeEmpty();
      expect(await violations(page)).toEqual([]);
      await step.getByRole("textbox").fill("Demo reason");
      await step.getByRole("button").click();
      await expect(page.locator("ol.trail li")).toHaveCount(2);
      expect(await page.locator('[data-field="stepHeightMm"]').textContent()).toBe(before);

      await page.locator("select").nth(1).selectOption("coordinator");
      expect(await violations(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }
}

test("keyboard only: tick a training step and send a report", async ({ page }) => {
  await page.goto("/");
  const first = page.getByRole("checkbox").nth(1);
  await first.focus();
  await expect(first).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("training-progress")).toContainText("1 of 6");
  const outline = await first.evaluate((node) => getComputedStyle(node).outlineStyle);
  expect(outline).not.toBe("none");
  const description = page.getByLabel("What is wrong or what has changed");
  await description.focus();
  await page.keyboard.type("Keyboard report");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("service-summary")).toBeVisible();
});
