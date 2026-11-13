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
  const call = page.getByRole("link", { name: "Call 911 now" });
  await expect(call).toBeVisible();
  const washroom = page.getByLabel("Minutes between washroom stops");
  await expect(washroom).toHaveValue("");
  expect(await washroom.getAttribute("placeholder")).toBe("");
  await washroom.fill("90");
  await expect(page.getByText(/no stop was supplied/i)).toBeVisible();

  await page.getByRole("button", { name: "Games" }).click();
  await expect(page.getByRole("note").first()).toContainText("not therapy");
  await page.getByRole("button", { name: "Play Quiet Count" }).click();
  await page.getByRole("button", { name: "Start counting" }).click();
  await expect(page.getByText(/No clock is running/i)).toBeVisible();

  await page.addScriptTag({ content: axe.source });
  const violations = await page.evaluate(async () => {
    const axeRuntime = (window as unknown as { axe: typeof axe }).axe;
    const results = await axeRuntime.run(document, {
      rules: { region: { enabled: false } },
    });
    return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
  });
  expect(violations).toEqual([]);
});
