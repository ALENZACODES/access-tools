import axe from "axe-core";
import { expect, test as base, type Page } from "playwright/test";
import { CATALOG, choose, createSession, solutionIds, viewSession } from "../packages/games/src/engine.ts";
import { EQUIPMENT_PROFILE_KEY } from "../packages/place/src/profile.ts";
import { scanChoose, tabTo } from "./regression/scan.ts";

/**
 * Day 28 post-demo regression audit. Titles carry the check id from
 * e2e/regression/catalog.ts. The reporter in e2e/regression/reporter.ts
 * writes the check-by-check table with the build identifier.
 */
const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [
    async ({ page }, use, testInfo) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      await use();
      await testInfo.attach("console-errors", { body: JSON.stringify(errors), contentType: "application/json" });
      expect(errors, "console errors").toEqual([]);
    },
    { auto: true },
  ],
});

async function openTab(page: Page, name: string): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name, exact: true }).click();
}

type Input = "keyboard" | "tap";

async function playRound(page: Page, gameId: string, input: Input): Promise<void> {
  const game = CATALOG.find((item) => item.id === gameId)!;
  const play = page.getByRole("button", { name: `Play ${game.name}` });
  if (input === "keyboard") {
    await play.focus();
    await page.keyboard.press("Enter");
  } else {
    await play.click();
  }
  await expect(page.getByRole("heading", { name: game.name })).toBeFocused();
  let session = createSession(game.id, { seed: 4, pace: "relaxed", language: "en", timerEnabled: false, practice: false });
  for (let guard = 0; guard < 80 && !session.done; guard += 1) {
    const step = solutionIds(session)[0];
    const label = viewSession(session).choices.find((choice) => choice.id === step)?.label;
    if (!step || !label) break;
    const control = page.getByRole("button", { name: label, exact: true });
    if (input === "keyboard") {
      await control.focus();
      await page.keyboard.press("Enter");
    } else {
      await control.click();
    }
    session = choose(session, step);
  }
  expect(session.done, gameId).toBe(true);
  await expect(page.getByText("Round finished. You can stop here. Nothing else in the App changes.")).toBeVisible();
}

async function axeViolations(page: Page, selector: string): Promise<string[]> {
  await page.addScriptTag({ content: axe.source });
  return page.evaluate(async (scope) => {
    const runtime = (window as unknown as { axe: typeof axe }).axe;
    const root = document.querySelector(scope);
    if (!root) return [`missing ${scope}`];
    const results = await runtime.run(root, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } });
    return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
  }, selector);
}

test("[R28-01] washroom finder shows fields, tiers, and Unknown", async ({ page }) => {
  await openTab(page, "Finders");
  const finder = page.getByRole("region", { name: "Washrooms, change tables, and hoists" });
  await expect(finder).toBeVisible();
  await expect(finder.getByText(/record\(s\) shown\./).first()).toBeVisible();
  await expect(finder.getByText("Transfer", { exact: false }).first()).toBeVisible();
  await expect(finder.getByText("Change table", { exact: false }).first()).toBeVisible();
  await expect(finder.getByText("Hoist", { exact: false }).first()).toBeVisible();
  await expect(finder.getByText(/Unknown/).first()).toBeVisible();
  await expect(page.getByText("Verified by surveyor")).toHaveCount(0);
});

test("[R28-02] parking finder states the privilege rule and no free-now claim", async ({ page }) => {
  await openTab(page, "Finders");
  const finder = page.getByRole("region", { name: "Accessible parking" });
  await expect(finder).toBeVisible();
  await expect(finder.getByText(/A municipal privilege is quoted only when the municipality, bylaw, and date are all present\./)).toBeVisible();
  await expect(finder).not.toContainText(/\bfree now\b|\bavailable now\b/i);
});

test("[R28-03] equipment profile saves, reloads, and deletes after confirmation", async ({ page }) => {
  await openTab(page, "Finders");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Finders", exact: true }).click();
  await page.getByLabel("Chair type").selectOption({ label: "Power wheelchair" });
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Profile saved on this device." })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Finders", exact: true }).click();
  await expect(page.getByLabel("Chair type")).toHaveValue("power");
  await page.getByRole("button", { name: "Delete my profile" }).click();
  await page.getByRole("button", { name: "Keep my profile" }).click();
  await expect(page.getByLabel("Chair type")).toHaveValue("power");
  await expect(page.getByRole("button", { name: "Delete my profile" })).toBeFocused();
  await page.getByRole("button", { name: "Delete my profile" }).click();
  await page.getByRole("button", { name: "Delete the saved profile" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Profile deleted from this device." })).toBeVisible();
  await expect(page.getByLabel("Chair type")).toHaveValue("");
  expect(await page.evaluate((key) => window.localStorage.getItem(key), EQUIPMENT_PROFILE_KEY)).toBeNull();
});

test("[R28-04] keyboard input finishes Pair Sequence with no clock", async ({ page }) => {
  await openTab(page, "Games");
  await expect(page.getByText(/No clock runs/i).first()).toBeVisible();
  await playRound(page, "pair-sequence", "keyboard");
  await expect(page.getByRole("timer")).toHaveCount(0);
});

test("[R28-05] single-tap input finishes Number Compare", async ({ page }) => {
  await openTab(page, "Games");
  await playRound(page, "number-compare", "tap");
});

test("[R28-06] switch input finishes Grid Recall", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await tabTo(page, "Games", 12);
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-switch-root]")).toBeVisible();
  const game = CATALOG.find((item) => item.id === "grid-recall")!;
  let session = createSession(game.id, { seed: 4, pace: "relaxed", language: "en", timerEnabled: false, practice: false });
  await scanChoose(page, `Play ${game.name}`);
  for (let guard = 0; guard < 80 && !session.done; guard += 1) {
    const step = solutionIds(session)[0];
    const label = viewSession(session).choices.find((choice) => choice.id === step)?.label;
    if (!step || !label) break;
    await scanChoose(page, label);
    session = choose(session, step);
  }
  expect(session.done).toBe(true);
  await expect(page.getByText("Round finished. You can stop here. Nothing else in the App changes.")).toBeVisible();
});

test("[R28-07] a game plays with the network disabled", async ({ page, context }) => {
  await openTab(page, "Games");
  await context.setOffline(true);
  try {
    await playRound(page, "order-keeper", "tap");
  } finally {
    await context.setOffline(false);
  }
});

test("[R28-08] directory and timing keep their notices", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("note").first()).toContainText("not eligibility advice");
  await page.getByRole("button", { name: "Timing", exact: true }).click();
  await expect(page.getByRole("link", { name: "Call 911 now" })).toHaveAttribute("href", "tel:911");
  await expect(page.getByLabel("Minutes between washroom stops")).toHaveCount(0);
});

test("[R28-09] finders and games switch to French and pass axe", async ({ page }) => {
  await openTab(page, "Finders");
  await page.locator("[data-screen]").getByRole("button", { name: "Français", exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe("fr");
  await expect(page.getByRole("heading", { name: "Stationnement accessible" })).toBeVisible();
  expect(await axeViolations(page, "[data-screen]")).toEqual([]);

  await page.getByRole("button", { name: "Games", exact: true }).click();
  await page.getByRole("button", { name: "Français" }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe("fr");
  await expect(page.getByText(/Aucune horloge ne tourne/).first()).toBeVisible();
  expect(await axeViolations(page, "body")).toEqual([]);
});
