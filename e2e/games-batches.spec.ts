import axe from "axe-core";
import { expect, type Page, test } from "playwright/test";
import { BATCH_TWO_CATALOG } from "../packages/games/src/batch2/index.ts";
import { BATCH_THREE_CATALOG } from "../packages/games/src/batch3/index.ts";
import { GAMES_BOUNDARY, ROUND_DONE } from "../packages/games/src/boundaries.ts";
import { choose, createSession, solutionIds, viewSession } from "../packages/games/src/engine.ts";
import { gameCopy } from "../packages/games/src/i18n.ts";
import { tabTo } from "./regression/scan.ts";

/**
 * The nine games of the second batch and the six of the third in a real
 * browser: one full round of each from the keyboard alone, in English and in French, with an axe run at
 * the first question and at the end. The pointer is never used after the
 * Games tab is opened.
 * axe output is recorded here. It does not prove WCAG 2.2 AA.
 */

/** The harness starts every round from this seed. */
const HARNESS_SEED = 4;

type Language = "en" | "fr";

/** Screen text as the focus check reads it: runs of white space, no-break spaces included, become one space. */
function plain(text: string): string {
  return text.replace(/\s+/g, " ").trim();
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

async function focusRing(page: Page): Promise<{ style: string; width: number }> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return { style: "none", width: 0 };
    const style = getComputedStyle(el);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) || 0 };
  });
}

test("the second batch is nine games", () => {
  expect(BATCH_TWO_CATALOG.map((game) => game.id)).toEqual([
    "odd-one-out",
    "trail-recall",
    "mirror-moves",
    "scale-sense",
    "jug-measure",
    "sentence-gap",
    "letter-mix",
    "sum-check",
    "number-steps",
  ]);
});

test("the third batch is six games", () => {
  expect(BATCH_THREE_CATALOG.map((game) => game.id)).toEqual(["tally-row", "day-hop", "compass-steps", "grid-gap", "group-finder", "clock-hop"]);
});

const BATCHES = [
  { title: "second batch", count: "nine", games: BATCH_TWO_CATALOG },
  { title: "third batch", count: "six", games: BATCH_THREE_CATALOG },
] as const;

for (const batch of BATCHES) {
  for (const language of ["en", "fr"] as const satisfies readonly Language[]) {
    test(`${batch.title}, ${language}: each of the ${batch.count} games plays a full round from the keyboard alone and passes axe`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.goto("/");
      await tabTo(page, "Games");
      await page.keyboard.press("Enter");
      await expect(page.locator("[data-games-root]")).toBeVisible();
      if (language === "fr") {
        await tabTo(page, gameCopy("lang.show-french", "en"));
        await page.keyboard.press("Enter");
        await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe("fr");
      }
      await expect(page.getByRole("note").first()).toHaveText(GAMES_BOUNDARY[language]);

      for (const game of batch.games) {
        await expect(page.getByText(game.summary[language], { exact: true })).toBeVisible();
        await tabTo(page, plain(`${gameCopy("ui.play", language)} ${game.name}`));
        await page.keyboard.press("Enter");
        await expect(page.getByRole("heading", { level: 1, name: game.name })).toBeFocused();
        await expect(page.locator("main[data-games-root]")).toHaveAttribute("lang", language);
        await expect(page.locator("main[data-games-root]")).toHaveAttribute("data-game", game.id);
        await expect(page.locator("[data-optional-clock]")).toHaveCount(0);
        expect(await axeViolations(page), `${game.id} ${language} first question`).toEqual([]);

        let session = createSession(game.id, { seed: HARNESS_SEED, pace: "relaxed", language, timerEnabled: false });
        let steps = 0;
        for (let guard = 0; guard < 80 && !session.done; guard += 1) {
          const view = viewSession(session);
          const step = solutionIds(session)[0];
          const label = view.choices.find((choice) => choice.id === step)?.label;
          if (!step || !label) break;
          await expect(page.getByText(view.prompt, { exact: true }).first(), `${game.id} ${language} prompt`).toBeVisible();
          await tabTo(page, plain(label));
          if (steps === 0) {
            const ring = await focusRing(page);
            expect(ring.style, `${game.id} focus ring`).not.toBe("none");
            expect(ring.width, `${game.id} focus ring`).toBeGreaterThanOrEqual(3);
          }
          await page.keyboard.press("Enter");
          session = choose(session, step);
          steps += 1;
        }
        expect(session.done, `${game.id} ${language}`).toBe(true);
        expect(steps, game.id).toBeGreaterThan(0);

        const view = viewSession(session);
        await expect(page.getByText(ROUND_DONE[language]).first()).toBeVisible();
        expect(view.correctCount, game.id).toBe(view.trialCount);
        await expect(
          page.getByText(`${gameCopy("ui.points", language)}${gameCopy("sep.colon", language)}${view.points}.`, { exact: false }),
        ).toBeVisible();
        expect(await axeViolations(page), `${game.id} ${language} finished`).toEqual([]);

        await tabTo(page, gameCopy("ui.back", language));
        await page.keyboard.press("Enter");
        await expect(page.getByRole("button", { name: plain(`${gameCopy("ui.play", language)} ${game.name}`), exact: true })).toBeFocused();
      }
    });
  }
}
