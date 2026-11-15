import { expect, type Page } from "playwright/test";

/** Tab until the focused control's text is `name`. */
export async function tabTo(page: Page, name: string, limit = 400): Promise<void> {
  for (let i = 0; i < limit; i += 1) {
    const text = await page.evaluate(() => (document.activeElement?.textContent ?? "").replace(/\s+/g, " ").trim());
    if (text === name) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Tab did not reach ${name}`);
}

/** Use only the switch bar: Next until `label` is highlighted, then Choose. */
export async function scanChoose(page: Page, label: string): Promise<void> {
  await tabTo(page, "Next");
  let start = "";
  for (let i = 0; i < 200; i += 1) {
    await page.keyboard.press("Space");
    const info = await page.evaluate(() => {
      const el = document.querySelector("[data-switch-current]");
      const root = document.querySelector("[data-switch-root]");
      if (!(el instanceof HTMLElement) || !root) return null;
      const index = [...root.querySelectorAll("a[href], button, input, select, textarea, [tabindex]")].indexOf(el);
      return { text: (el.textContent ?? "").replace(/\s+/g, " ").trim(), index: String(index) };
    });
    if (!info) continue;
    if (info.text === label) {
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Choose", exact: true })).toBeFocused();
      await page.keyboard.press("Space");
      return;
    }
    if (!start) start = info.index;
    else if (info.index === start) break;
  }
  throw new Error(`Switch did not reach ${label}`);
}
