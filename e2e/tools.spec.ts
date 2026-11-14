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
  await expect(page.getByRole("link", { name: "Text CONNEX to 247247" })).toHaveAttribute("href", "sms:247247?&body=CONNEX");
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

test("place, search, finders, and paratransit pass axe in English and French", async ({ page }) => {
  await page.goto("/");
  await page.addScriptTag({ content: axe.source });
  const viewports = [
    { width: 1280, height: 800 },
    { width: 320, height: 700 },
  ];
  for (const screen of ["Place", "Search", "Finders", "Paratransit"]) {
    await page.getByRole("button", { name: screen, exact: true }).click();
    await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe("en");
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      for (const lang of ["en", "fr"] as const) {
        const current = await page.evaluate(() => document.documentElement.lang);
        if (current !== lang) {
          await page.getByRole("button", { name: lang === "fr" ? "Français" : "English" }).click();
        }
        await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe(lang);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${screen} ${lang} ${viewport.width}`).toBeLessThanOrEqual(0);
        const violations = await page.evaluate(async () => {
          const axeRuntime = (window as unknown as { axe: typeof axe }).axe;
          const screenRoot = document.querySelector("[data-screen]");
          if (!screenRoot) return ["missing screen"];
          const results = await axeRuntime.run(screenRoot, {
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
            },
          });
          return results.violations.map((violation) => {
            const target = violation.nodes[0]?.target.join(" ") ?? "";
            return `${violation.id}: ${violation.help}${target ? ` [${target}]` : ""}`;
          });
        });
        expect(violations, `${screen} ${lang} ${viewport.width}`).toEqual([]);
      }
    }
  }
});
