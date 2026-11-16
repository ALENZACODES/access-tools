import axe from "axe-core";
import { expect, type Locator, type Page, test } from "playwright/test";
import { tabTo } from "./regression/scan.ts";

/**
 * Dwell select with a real pointer. The browser sends its own pointer events
 * as the mouse moves; nothing here clicks a control once dwell select is on,
 * except where a test says so.
 */

async function openGames(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Games", exact: true }).click();
  await expect(page.locator("[data-games-root]")).toBeVisible();
}

/** Turns dwell select on by ordinary clicks and sets the hold time, in half-second presses from 1.5 seconds. */
async function turnDwellOn(page: Page, seconds: number): Promise<void> {
  const group = page.getByRole("group", { name: "Dwell select" });
  await group.getByRole("button", { name: "Turn dwell select on" }).click();
  const presses = Math.round((seconds - 1.5) / 0.5);
  const name = presses < 0 ? "Shorter hold time" : "Longer hold time";
  for (let press = 0; press < Math.abs(presses); press += 1) await group.getByRole("button", { name }).click();
  await expect(group.locator("[data-dwell-state]")).toHaveText(`Dwell select is on. Hold time: ${seconds} seconds.`);
  await park(page);
}

/** Moves the pointer onto plain text, where nothing can be held. */
async function park(page: Page): Promise<void> {
  const heading = page.locator("[data-games-root] h1").first();
  await heading.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const box = await heading.boundingBox();
  if (!box) throw new Error("No heading to park on");
  await page.mouse.move(box.x + 4, box.y + box.height / 2, { steps: 3 });
  await expect(page.locator("[data-dwell-idle]")).toBeVisible();
}

/** Rests the pointer on the middle of a control. No button is pressed. */
async function rest(page: Page, control: Locator): Promise<void> {
  await control.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const box = await control.boundingBox();
  if (!box) throw new Error("Control is not on screen");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
}

test("pointer dwell opens a game, answers a question, and goes back, with no click", async ({ page }) => {
  await openGames(page);
  await turnDwellOn(page, 1);
  let clicks = 0;
  await page.exposeFunction("countTrustedClick", () => {
    clicks += 1;
  });
  await page.evaluate(() => {
    document.addEventListener(
      "click",
      (event) => {
        if (event.isTrusted) void (window as unknown as { countTrustedClick: () => void }).countTrustedClick();
      },
      true,
    );
  });

  const play = page.getByRole("button", { name: "Play Sum Check", exact: true });
  await rest(page, play);
  await expect(play).toHaveAttribute("data-dwell-target", "true");
  await expect(page.locator("[data-dwell-holding]")).toHaveText("Holding: Play Sum Check");
  await expect(page.getByRole("progressbar", { name: "Hold progress for Play Sum Check" })).toBeVisible();
  const outline = await play.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).toBe("dashed");
  await expect(page.getByRole("heading", { level: 1, name: "Sum Check" })).toBeVisible();

  // The pointer has not moved since the game opened. Whatever is under it now must not be held.
  const opening = await page.locator("[aria-live='polite']").textContent();
  await page.waitForTimeout(2500);
  await expect(page.locator("[data-dwell-idle]")).toBeVisible();
  expect(await page.locator("[aria-live='polite']").textContent()).toBe(opening);

  await park(page);
  const answers = page.getByRole("group", { name: "Sum Check" }).getByRole("button");
  const first = answers.first();
  const label = (await first.textContent()) ?? "";
  const before = await page.locator("[aria-live='polite']").textContent();
  await rest(page, first);
  await expect(page.locator("[data-dwell-holding]")).toHaveText(`Holding: ${label}`);
  await expect.poll(() => page.locator("[aria-live='polite']").textContent()).not.toBe(before);

  await park(page);
  await rest(page, page.getByRole("button", { name: "Back to games", exact: true }));
  await expect(page.getByRole("heading", { level: 1, name: "Games", exact: true })).toBeVisible();
  // Back on the hub with the pointer where it was: nothing under it is chosen.
  await page.waitForTimeout(2500);
  await expect(page.getByRole("heading", { level: 1, name: "Games", exact: true })).toBeVisible();
  await expect(page.locator("[data-dwell-idle]")).toBeVisible();
  expect(clicks).toBe(0);
});

test("pointer dwell cancels when the pointer leaves, and does not repeat while the pointer stays", async ({ page }) => {
  await openGames(page);
  await turnDwellOn(page, 1.5);
  const play = page.getByRole("button", { name: "Play Grid Recall", exact: true });
  await rest(page, play);
  await expect(page.locator("[data-dwell-holding]")).toHaveText("Holding: Play Grid Recall");
  await park(page);
  await expect(play).not.toHaveAttribute("data-dwell-target", "true");
  await page.waitForTimeout(2500);
  await expect(page.getByRole("heading", { level: 1, name: "Games", exact: true })).toBeVisible();

  const longer = page.getByRole("group", { name: "Dwell select" }).getByRole("button", { name: "Longer hold time" });
  const state = page.locator("[data-dwell-state]");
  await rest(page, longer);
  await expect(state).toHaveText("Dwell select is on. Hold time: 2 seconds.");
  await page.waitForTimeout(3500);
  await expect(state).toHaveText("Dwell select is on. Hold time: 2 seconds.");
  await park(page);
  await rest(page, longer);
  await expect(state).toHaveText("Dwell select is on. Hold time: 2.5 seconds.");
});

test("pointer dwell changes the text size list and puts the cursor in the search box", async ({ page }) => {
  await openGames(page);
  await turnDwellOn(page, 1);
  const list = page.getByRole("combobox", { name: "Text size" });
  await expect(list).toHaveValue("default");
  const sizeBefore = await page.locator("main[data-games-root]").evaluate((el) => getComputedStyle(el).fontSize);
  await rest(page, list);
  await expect(page.locator("[data-dwell-holding]")).toHaveText("Holding the list: Text size. It will change to: Large");
  await expect(list).toHaveValue("large");
  const sizeAfter = await page.locator("main[data-games-root]").evaluate((el) => getComputedStyle(el).fontSize);
  expect(parseFloat(sizeAfter)).toBeGreaterThan(parseFloat(sizeBefore));
  await park(page);
  await rest(page, list);
  await expect(list).toHaveValue("extra_large");
  await park(page);

  const box = page.getByRole("textbox", { name: "Search games" });
  await expect(box).not.toBeFocused();
  await rest(page, box);
  await expect(page.locator("[data-dwell-holding]")).toHaveText("Holding the text box: Search games. The cursor will move into it.");
  await expect(box).toBeFocused();
  await page.keyboard.type("jug");
  await expect(page.getByRole("button", { name: /^Play / })).toHaveCount(1);
  await park(page);
  await rest(page, page.getByRole("button", { name: "Clear the search", exact: true }));
  await expect(box).toHaveValue("");
  await expect(page.getByRole("button", { name: "Clear the search", exact: true })).toHaveCount(0);

  await page.addScriptTag({ content: axe.source });
  const violations = await page.evaluate(async () => {
    const runtime = (window as unknown as { axe: typeof axe }).axe;
    const root = document.querySelector("[data-games-root]");
    if (!root) return ["missing games root"];
    const results = await runtime.run(root, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
    return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
  });
  expect(violations).toEqual([]);
});

test("with dwell select on, the switch bar's Next is enough: the highlighted control is chosen after the hold", async ({ page }) => {
  await openGames(page);
  await turnDwellOn(page, 2);
  await page.mouse.move(0, 0);
  const favourites = page.getByRole("button", { name: "My favourites", exact: true });
  await expect(favourites).toHaveAttribute("aria-pressed", "false");
  await tabTo(page, "Next");
  let reached = false;
  for (let presses = 0; presses < 40 && !reached; presses += 1) {
    await page.keyboard.press("Space");
    reached = await page.evaluate(() => (document.querySelector("[data-switch-current]")?.textContent ?? "").trim() === "My favourites");
  }
  expect(reached).toBe(true);
  await expect(page.locator("[data-dwell-holding]")).toHaveText("Holding: My favourites");
  await expect(favourites).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeFocused();
  await expect(page.getByRole("heading", { level: 1, name: "Games", exact: true })).toBeVisible();
});

test("the hold strip keeps its height and does not cover the control that has keyboard focus", async ({ page }) => {
  await openGames(page);
  await turnDwellOn(page, 5);
  const strip = page.locator("[data-dwell-layer]");
  const idleHeight = (await strip.boundingBox())?.height ?? 0;
  expect(idleHeight).toBeGreaterThan(0);
  await rest(page, page.getByRole("button", { name: "Play Jug Measure", exact: true }));
  await expect(page.locator("[data-dwell-holding]")).toHaveText("Holding: Play Jug Measure");
  expect((await strip.boundingBox())?.height).toBe(idleHeight);
  await park(page);

  await tabTo(page, "Next");
  const covered: string[] = [];
  for (let presses = 0; presses < 70; presses += 1) {
    await page.keyboard.press("Tab");
    const report = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      const root = document.querySelector("[data-games-root]");
      const stripEl = document.querySelector("[data-dwell-layer]");
      if (!active || !root || !stripEl || !root.contains(active)) return null;
      const box = active.getBoundingClientRect();
      const top = stripEl.getBoundingClientRect().top;
      return { name: (active.textContent ?? "").replace(/\s+/g, " ").trim() || active.id || active.tagName, hidden: box.top >= top };
    });
    if (report?.hidden) covered.push(report.name);
  }
  expect(covered).toEqual([]);
});
