import axe from "axe-core";
import { expect, type Page, test } from "playwright/test";
import { CATALOG, choose, createSession, solutionIds, viewSession } from "../packages/games/src/engine.ts";

/**
 * Days 13 to 15 checks that need a real browser: visible focus, the device's
 * reduced-motion request, play with the network turned off, and axe.
 * axe output is recorded here. It does not prove WCAG 2.2 AA.
 */

async function openGames(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Games", exact: true }).click();
  await expect(page.locator("[data-games-root]")).toBeVisible();
}

async function focusIsVisible(page: Page): Promise<{ outline: string; width: number; boxShadow: string }> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return { outline: "none", width: 0, boxShadow: "none" };
    const style = getComputedStyle(el);
    return { outline: style.outlineStyle, width: parseFloat(style.outlineWidth) || 0, boxShadow: style.boxShadow };
  });
}

async function tabTo(page: Page, name: string, limit = 300): Promise<void> {
  for (let i = 0; i < limit; i += 1) {
    const text = await page.evaluate(() => (document.activeElement?.textContent ?? "").replace(/\s+/g, " ").trim());
    if (text === name) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Tab did not reach ${name}`);
}

async function axeViolations(page: Page): Promise<string[]> {
  await page.addScriptTag({ content: axe.source });
  return page.evaluate(async () => {
    const runtime = (window as unknown as { axe: typeof axe }).axe;
    const root = document.querySelector("[data-games-root]");
    if (!root) return ["missing games root"];
    const results = await runtime.run(root, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
    });
    return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
  });
}

test("Day 13: the hub works by keyboard with visible focus, notice, and no axe violations in English and French", async ({ page }) => {
  await openGames(page);
  await expect(page.getByRole("note").first()).toContainText("does not provide medical advice");
  for (const game of CATALOG) await expect(page.getByRole("heading", { name: game.name, exact: true })).toBeVisible();
  await tabTo(page, "Play Grid Recall");
  const focus = await focusIsVisible(page);
  expect(focus.outline !== "none" && focus.width >= 2 || focus.boxShadow !== "none").toBe(true);
  await tabTo(page, "Practice Order Keeper");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Practice. No score is shown, and this round is not saved.");
  await tabTo(page, "Back to games");
  await page.keyboard.press("Enter");
  expect(await axeViolations(page)).toEqual([]);
  await page.getByRole("button", { name: "Français" }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe("fr");
  await expect(page.getByRole("note").first()).toContainText("ne donne pas d'avis médical");
  expect(await axeViolations(page)).toEqual([]);
});

test("Day 13: reduced motion from the device stops transitions and animation in the games", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openGames(page);
  await page.getByRole("checkbox", { name: "Reduce motion" }).uncheck();
  const probe = await page.evaluate(() => {
    const root = document.querySelector("[data-games-root]");
    const el = document.createElement("div");
    el.style.transition = "opacity 2s";
    el.style.animation = "spin 2s infinite";
    root?.appendChild(el);
    const style = getComputedStyle(el);
    const result = { transition: style.transitionDuration, animation: style.animationName };
    el.remove();
    return result;
  });
  expect(probe.animation).toBe("none");
  expect(["0s", "0s, 0s"]).toContain(probe.transition);
});

test("Day 14: the five Day 14 games play by keyboard with visible focus, and Pair Sequence pays no time penalty", async ({ page }) => {
  await openGames(page);
  for (const id of ["grid-recall", "route-planner", "pair-sequence", "pattern-rules", "word-roots-builder"]) {
    const game = CATALOG.find((item) => item.id === id);
    if (!game) throw new Error(id);
    await tabTo(page, `Play ${game.name}`);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 1, name: game.name })).toBeFocused();
    await expect(page.getByText("Scores stay on this device. Nothing is uploaded.")).toBeVisible();
    let session = createSession(id, { seed: 4, pace: "relaxed", language: "en", timerEnabled: false });
    for (let guard = 0; guard < 80 && !session.done; guard += 1) {
      const step = solutionIds(session)[0];
      const label = viewSession(session).choices.find((choice) => choice.id === step)?.label;
      if (!step || !label) break;
      if (id === "pair-sequence") await page.waitForTimeout(1500);
      await tabTo(page, label);
      const focus = await focusIsVisible(page);
      expect(focus.outline !== "none" && focus.width >= 2 || focus.boxShadow !== "none", label).toBe(true);
      await page.keyboard.press("Enter");
      session = choose(session, step);
    }
    expect(session.done, id).toBe(true);
    await expect(page.getByText(`Points inside this exercise: ${viewSession(session).points}.`, { exact: false })).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);
    await tabTo(page, "Back to games");
    await page.keyboard.press("Enter");
  }
});

test("Day 15: all ten games play by tap with the network turned off", async ({ page, context }) => {
  test.setTimeout(120_000);
  await openGames(page);
  await context.setOffline(true);
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  for (const game of CATALOG) {
    await page.getByRole("button", { name: `Play ${game.name}`, exact: true }).click();
    let session = createSession(game.id, { seed: 4, pace: "relaxed", language: "en", timerEnabled: false });
    for (let guard = 0; guard < 80 && !session.done; guard += 1) {
      const step = solutionIds(session)[0];
      const label = viewSession(session).choices.find((choice) => choice.id === step)?.label;
      if (!step || !label) break;
      await page.getByRole("button", { name: label, exact: true }).click();
      session = choose(session, step);
    }
    expect(session.done, game.id).toBe(true);
    await expect(page.getByText("Round finished. You can stop here. Nothing else in the App changes.").first()).toBeVisible();
    await page.getByRole("button", { name: "Back to games" }).click();
  }
  await context.setOffline(false);
  expect(requests).toEqual([]);
});

test("Day 15: Focus Flankers timed mode is optional, counts up, and never ends the round", async ({ page }) => {
  await openGames(page);
  const option = page.getByRole("checkbox", { name: "Timed mode for Focus Flankers (optional)" });
  await expect(option).not.toBeChecked();
  await page.getByRole("button", { name: "Play Focus Flankers" }).click();
  await expect(page.locator("[data-optional-clock]")).toHaveCount(0);
  await page.getByRole("button", { name: "Back to games" }).click();
  await option.check();
  await page.getByRole("button", { name: "Play Focus Flankers" }).click();
  await expect(page.locator("[data-optional-clock]")).toContainText("No time limit");
  await page.waitForTimeout(2200);
  await expect(page.locator("[data-optional-clock]")).not.toContainText("0 seconds");
  await expect(page.getByRole("button", { name: "Centre points left" })).toBeEnabled();
  expect(await axeViolations(page)).toEqual([]);
});
