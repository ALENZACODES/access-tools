import axe from "axe-core";
import { expect, type Page, test } from "playwright/test";

const VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 320, height: 700 },
] as const;
const LANGS = ["en", "fr"] as const;
type Lang = (typeof LANGS)[number];

const TEXT = {
  en: {
    toggle: "Français",
    journeyWashrooms: "Washrooms for this destination",
    journeyParking: "Parking for this destination",
    placeParking: "Accessible parking at this place",
    backJourney: "Back to the journey",
    backPlace: "Back to the place page",
    broaden: "Broaden filters",
    changeTable: "Adult change table needed",
    stepFree: "Step-free required",
    save: "Save profile",
  },
  fr: {
    toggle: "English",
    journeyWashrooms: "Toilettes pour cette destination",
    journeyParking: "Stationnement pour cette destination",
    placeParking: "Stationnement accessible à ce lieu",
    backJourney: "Retour au trajet",
    backPlace: "Retour à la page du lieu",
    broaden: "Élargir les filtres",
    changeTable: "Table à langer pour adultes nécessaire",
    stepFree: "Sans marche exigé",
    save: "Enregistrer le profil",
  },
} as const;

async function setLang(page: Page, lang: Lang) {
  const current = await page.evaluate(() => document.documentElement.lang);
  if (current !== lang) await page.getByRole("button", { name: TEXT[current as Lang].toggle, exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe(lang);
}

async function axeViolations(page: Page): Promise<string[]> {
  await page.addScriptTag({ content: axe.source });
  return page.evaluate(async () => {
    const runtime = (window as unknown as { axe: typeof axe }).axe;
    const results = await runtime.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
    });
    return results.violations.map((violation) => {
      const target = violation.nodes[0]?.target.join(" ") ?? "";
      return `${violation.id}: ${violation.help}${target ? ` [${target}]` : ""}`;
    });
  });
}

async function overflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

async function check(page: Page, label: string) {
  expect(await overflow(page), `${label} overflow`).toBeLessThanOrEqual(0);
  expect(await axeViolations(page), label).toEqual([]);
}

async function saveProfile(page: Page, lang: Lang, boxes: Array<"changeTable" | "stepFree">) {
  for (const box of boxes) await page.getByLabel(TEXT[lang][box], { exact: true }).check();
  await page.getByRole("button", { name: TEXT[lang].save, exact: true }).click();
}

for (const viewport of VIEWPORTS) {
  for (const lang of LANGS) {
    test(`washroom and parking finders pass axe with 0 violations (${lang}, ${viewport.width})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await page.evaluate(() => window.localStorage.clear());
      await page.reload();
      await setLang(page, lang);
      const t = TEXT[lang];
      await check(page, `${lang} ${viewport.width} home`);

      await page.getByRole("button", { name: t.journeyWashrooms, exact: true }).click();
      await expect(page.locator("[data-washroom]")).toHaveCount(2);
      await check(page, `${lang} ${viewport.width} washrooms from journey`);
      await page.getByRole("button", { name: t.backJourney, exact: true }).click();
      await expect(page.getByRole("button", { name: t.journeyWashrooms, exact: true })).toBeFocused();

      await page.getByRole("button", { name: t.journeyParking, exact: true }).click();
      await expect(page.locator("li[data-destination]")).toHaveCount(1);
      await check(page, `${lang} ${viewport.width} parking from journey`);
      await page.getByRole("button", { name: t.backJourney, exact: true }).click();

      await page.getByRole("button", { name: t.placeParking, exact: true }).click();
      await expect(page.locator('li[data-destination="fix-parking-lot"]')).toHaveCount(1);
      await check(page, `${lang} ${viewport.width} parking from place`);
      await page.getByRole("button", { name: t.backPlace, exact: true }).click();
      await expect(page.getByRole("button", { name: t.placeParking, exact: true })).toBeFocused();

      await saveProfile(page, lang, ["changeTable", "stepFree"]);
      await page.getByRole("button", { name: t.journeyWashrooms, exact: true }).click();
      await expect(page.locator("[data-finder-empty]")).toBeVisible();
      await check(page, `${lang} ${viewport.width} washroom empty state`);
      await page.getByRole("button", { name: t.broaden, exact: true }).click();
      await expect(page.locator("[data-washroom]")).toHaveCount(2);
      await check(page, `${lang} ${viewport.width} washrooms broadened`);
      await page.getByRole("button", { name: t.backJourney, exact: true }).click();

      await page.getByRole("button", { name: t.placeParking, exact: true }).click();
      await expect(page.locator("[data-finder-empty]")).toBeVisible();
      await check(page, `${lang} ${viewport.width} parking empty state`);
    });
  }
}

test("washroom results show every field with tier, source and record date, and nothing is labelled verified", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: TEXT.en.journeyWashrooms, exact: true }).click();
  await expect(page.getByText("This list does not show whether a washroom is available, open right now, or clean.", { exact: false })).toBeVisible();
  await expect(page.getByText("Demonstration data.", { exact: false }).first()).toBeVisible();
  const fields = page.locator("[data-washroom] [data-field]");
  await expect(fields).toHaveCount(28);
  for (const text of await fields.allTextContents()) {
    expect(text).toMatch(/Tier: \S.*Source: \S.*Record date: (2026-11-13|Unknown)/);
  }
  const body = (await page.locator("body").textContent()) ?? "";
  const claims = body.replace(/PROTOTYPE-UNVERIFIED|unverified/gi, "").match(/\S*verif\S*/gi) ?? [];
  expect(claims).toEqual([]);
});

test("parking results say they are spaces the data records, not free spaces", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: TEXT.en.placeParking, exact: true }).click();
  await expect(page.getByText("It does not show spaces that are free right now.", { exact: false })).toBeVisible();
  const bay = page.locator('li[data-bay="fix-lot-bay"]');
  for (const label of ["Space type", "Van-accessible", "Distance to the entrance", "Surface", "Payment notes"]) {
    await expect(bay.locator("[data-field] dt", { hasText: label }).first()).toBeVisible();
  }
  await expect(bay.locator('[data-field="fix-lot-bay.surface"]')).toContainText("Unknown");
});
