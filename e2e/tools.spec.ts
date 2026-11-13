import axe from "axe-core";
import { expect, test } from "playwright/test";

test("directory, timing, and a game are usable without advice or a timer", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("note").first()).toContainText("not eligibility advice");
  await page.getByLabel("Search programs and services").fill("ODSP");
  const official = page.getByRole("link", { name: /Official page: Ontario Disability Support Program/i });
  await official.focus();
  await expect(official).toBeFocused();

  await page.getByRole("button", { name: "Timing" }).click();
  await expect(page.getByRole("link", { name: "Call 911 now" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Text 9-8-8 Suicide Crisis Helpline" })).toHaveAttribute("href", "sms:988");
  await expect(page.getByRole("link", { name: "Text CONNEX to 247247" })).toHaveAttribute("href", "sms:247247?body=CONNEX");
  await expect(page.getByLabel("Minutes between washroom stops")).toHaveCount(0);

  await page.getByRole("button", { name: "Games" }).click();
  await expect(page.getByRole("note").first()).toContainText("does not provide medical advice");
  await expect(page.getByRole("heading", { name: "Grid Recall" })).toBeVisible();
  await expect(page.getByText(/No clock runs/i).first()).toBeVisible();
  await page.getByRole("button", { name: "Play Grid Recall" }).click();
  await expect(page.getByRole("heading", { name: "Grid Recall" })).toBeFocused();
  await page.getByRole("button", { name: "Back to games" }).click();
  await page.getByRole("button", { name: "Français" }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe("fr");

  await page.setViewportSize({ width: 320, height: 700 });
  const gamesOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(gamesOverflow).toBeLessThanOrEqual(0);
  await page.getByRole("button", { name: "Directory" }).click();
  const directoryOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(directoryOverflow).toBeLessThanOrEqual(0);

  await page.addScriptTag({ content: axe.source });
  const violations = await page.evaluate(async () => {
    const axeRuntime = (window as unknown as { axe: typeof axe }).axe;
    const results = await axeRuntime.run(document, {
      rules: {},
    });
    return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
  });
  expect(violations).toEqual([]);
});
