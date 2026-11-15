import axe from "axe-core";
import { expect, type Locator, type Page, test } from "playwright/test";

/**
 * Days 19, 22, and 24 checks on the harness: the games hub still works by
 * keyboard and still shows its notices, no screen logs a console error in
 * English or French, and an empty result offers a next action that works.
 */
const SCREENS = ["Directory", "Timing", "Games", "Place", "Search", "Finders", "Paratransit"] as const;

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function tabTo(page: Page, target: Locator, limit = 300): Promise<void> {
  for (let presses = 0; presses < limit; presses += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  await expect(target).toBeFocused();
}

async function axeViolations(page: Page): Promise<string[]> {
  await page.addScriptTag({ content: axe.source });
  return page.evaluate(async () => {
    const runtime = (window as unknown as { axe: typeof axe }).axe;
    const results = await runtime.run(document);
    return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
  });
}

test("no screen logs a console error in English or French", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  for (const screen of SCREENS) {
    await page.goto("/");
    await page.getByRole("button", { name: screen, exact: true }).click();
    const french = page.getByRole("button", { name: "Français" }).first();
    await expect(french).toBeVisible();
    await french.click();
    await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe("fr");
    const english = page.getByRole("button", { name: "English" }).first();
    await english.click();
    await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe("en");
  }
  expect(errors).toEqual([]);
});

test("the games hub still works by keyboard and keeps its notices in both languages", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/");
  await tabTo(page, page.getByRole("button", { name: "Games", exact: true }));
  await page.keyboard.press("Enter");

  const notices = [
    "These exercises are for enjoyment and practice. Scores measure performance inside the exercise only. The App does not provide medical advice.",
    "Untimed. No clock runs.",
  ];
  for (const notice of notices) await expect(page.getByText(notice).first()).toBeVisible();

  await tabTo(page, page.getByRole("button", { name: "Play Grid Recall" }));
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Grid Recall" })).toBeFocused();
  await expect(page.getByText(notices[0]!).first()).toBeVisible();
  await tabTo(page, page.getByRole("button", { name: "Back to games" }));
  await page.keyboard.press("Enter");
  for (const notice of notices) await expect(page.getByText(notice).first()).toBeVisible();

  await tabTo(page, page.getByRole("button", { name: "Français" }).first());
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe("fr");
  await expect(page.getByText("L'application ne donne pas d'avis médical.", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Sans minuterie. Aucune horloge ne tourne.").first()).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test("an empty paratransit search explains itself and clearing works by keyboard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Paratransit", exact: true }).click();
  const search = page.getByLabel("Search agencies");
  const status = page.getByRole("status").filter({ hasText: "agencies. Each one links out." });
  const before = await status.textContent();
  await search.fill("zzqx no such agency");
  await expect(page.getByText("No agency in this list matches.", { exact: false })).toBeVisible();
  await expect(status).toContainText("0 agencies");
  expect(await axeViolations(page)).toEqual([]);

  const clear = page.getByRole("button", { name: "Clear the search" });
  await tabTo(page, clear);
  await page.keyboard.press("Enter");
  await expect(search).toBeFocused();
  await expect(search).toHaveValue("");
  await expect(status).toHaveText(before ?? "");
  await expect(page.getByRole("button", { name: "Clear the search" })).toHaveCount(0);

  await page.getByRole("button", { name: "Français" }).first().click();
  await page.getByLabel("Chercher un organisme").fill("zzqx");
  await expect(page.getByText("Aucun organisme de cette liste ne correspond.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Effacer la recherche" }).click();
  await expect(page.getByLabel("Chercher un organisme")).toHaveValue("");
});
