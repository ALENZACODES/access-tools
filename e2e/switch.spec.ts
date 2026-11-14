import { expect, type Page, test } from "playwright/test";

const SCREENS = ["Directory", "Timing", "Games", "Place", "Search", "Finders"] as const;

async function tabTo(page: Page, name: string, limit = 400): Promise<void> {
  for (let i = 0; i < limit; i += 1) {
    const text = await page.evaluate(() => (document.activeElement?.textContent ?? "").replace(/\s+/g, " ").trim());
    if (text === name) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Tab did not reach ${name}`);
}

async function openScreen(page: Page, name: string): Promise<void> {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await tabTo(page, name, 12);
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-switch-root]")).toBeVisible();
}

async function labelAndSizeFailures(page: Page): Promise<string[]> {
  return page.locator("[data-switch-root]").evaluate((root) => {
    function clean(value: string | null | undefined): string {
      return (value ?? "").replace(/\s+/g, " ").trim();
    }
    function labelText(host: Element): string {
      const clone = host.cloneNode(true) as Element;
      clone.querySelectorAll("input, select, textarea").forEach((node) => node.remove());
      return clean(clone.textContent);
    }
    function visibleLabel(el: Element): string {
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        const explicit = el.id ? root.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null;
        const host = explicit ?? el.closest("label");
        return host ? labelText(host) : "";
      }
      return clean(el.textContent);
    }
    function accessibleName(el: Element): string {
      const labelledBy = el.getAttribute("aria-labelledby");
      if (labelledBy) {
        return clean(labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" "));
      }
      const aria = el.getAttribute("aria-label");
      if (aria) return clean(aria);
      if ("labels" in el && el.labels instanceof NodeList && el.labels.length > 0) {
        return clean([...el.labels].map((label) => labelText(label)).join(" "));
      }
      return clean(el.textContent);
    }
    const positive = [...root.querySelectorAll<HTMLElement>("[tabindex]")].filter((el) => Number(el.getAttribute("tabindex")) > 0);
    const controls = [...root.querySelectorAll<HTMLElement>("button, a[href], input:not([type='hidden']), select, textarea")].filter((el) => {
      const dialog = el.closest("dialog");
      return !dialog || dialog.open;
    });
    const failures = positive.map((el) => `positive tabindex on ${el.tagName}`);
    for (const el of controls) {
      const visible = visibleLabel(el);
      const name = accessibleName(el);
      const label = visible || name || el.tagName;
      if (visible && !name.toLocaleLowerCase().includes(visible.toLocaleLowerCase())) {
        failures.push(`${label}: visible label is not in the accessible name (${name})`);
      }
      const rect = el.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) failures.push(`${label}: target is ${Math.round(rect.width)} by ${Math.round(rect.height)}`);
    }
    return failures;
  });
}

test("place, search, finders, games, directory, and timing work from the keyboard", async ({ page }) => {
  for (const screen of SCREENS) {
    await openScreen(page, screen);
    expect(await labelAndSizeFailures(page), screen).toEqual([]);
    await tabTo(page, "Next");
    await page.keyboard.press("Space");
    const first = await page.locator("[data-switch-current]").textContent();
    await expect(page.getByRole("button", { name: "Next", exact: true })).toBeFocused();
    await page.keyboard.press("Space");
    const second = await page.locator("[data-switch-current]").textContent();
    expect(second, screen).not.toBe(first);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Choose", exact: true })).toBeFocused();

    await tabTo(page, "Français");
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe("fr");
    expect(await labelAndSizeFailures(page), `${screen} fr`).toEqual([]);
    await expect(page.getByRole("button", { name: "Suivant", exact: true })).toBeVisible();

    let left = false;
    for (let i = 0; i < 500; i += 1) {
      const inside = await page.evaluate(() => {
        const root = document.querySelector("[data-switch-root]");
        const active = document.activeElement;
        return Boolean(root && active && root.contains(active));
      });
      if (!inside) {
        left = true;
        break;
      }
      await page.keyboard.press("Tab");
    }
    expect(left, screen).toBe(true);
  }
});

test("delete confirmation is a dialog and Escape works from the second button", async ({ page }) => {
  await openScreen(page, "Place");
  await tabTo(page, "Delete my profile");
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "This deletes the profile saved on this device." });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Keep my profile" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete my profile" })).toBeFocused();
});
