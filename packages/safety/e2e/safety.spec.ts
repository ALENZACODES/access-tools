import { createRequire } from "node:module";
import { expect, test, type Page } from "playwright/test";

const axeSource = createRequire(import.meta.url).resolve("axe-core/axe.min.js");

async function violations(page: Page): Promise<unknown[]> {
  await page.addScriptTag({ path: axeSource });
  return page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: () => Promise<{ violations: unknown[] }> } }).axe;
    return (await axe.run()).violations;
  });
}

const text = {
  en: { start: "Start check-in window", help: "I need help contacting someone", create: "Create trip share", origin: "Origin label", destination: "Destination label", call: "Call 911 now", french: "Français" },
  fr: { start: "Démarrer la fenêtre de vérification", help: "J'ai besoin d'aide pour joindre quelqu'un", create: "Créer le partage", origin: "Libellé de départ", destination: "Libellé de destination", call: "Composer le 911 maintenant", french: "English" },
} as const;

for (const language of ["en", "fr"] as const) {
  for (const width of [1280, 320]) {
    test(`axe finds 0 violations: ${language} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      if (language === "fr") await page.getByRole("button", { name: text.en.french }).click();
      const t = text[language];
      await expect(page.locator("html")).toHaveAttribute("lang", language);
      expect(await violations(page)).toEqual([]);

      await page.getByRole("button", { name: t.start }).click();
      await page.getByRole("button", { name: t.help }).click();
      await expect(page.getByRole("link", { name: t.call })).toBeVisible();
      await page.getByLabel(t.origin).fill("Home");
      await page.getByLabel(t.destination).fill("Clinic");
      await page.getByRole("button", { name: t.create }).click();
      await expect(page.getByTestId("trip-share")).toBeVisible();
      expect(await violations(page)).toEqual([]);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow).toBe(false);
    });
  }
}

test("outage status is unknown by default", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("outage-status")).toHaveText("Outage status: Unknown");
  await expect(page.getByText("Live elevator or outage status is not connected here.", { exact: false })).toBeVisible();
});
