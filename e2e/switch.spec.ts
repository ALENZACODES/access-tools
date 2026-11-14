import { expect, type Page, test } from "playwright/test";
import { CATALOG, choose, createSession, solutionIds, viewSession } from "../packages/games/src/engine.ts";

const SCREENS = ["Directory", "Timing", "Games", "Place", "Search", "Finders", "Paratransit"] as const;
const VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 320, height: 700 },
] as const;

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
    function tidy(value: string | null | undefined): string {
      return (value ?? "").replace(/\s+/g, " ").trim();
    }
    function labelText(host: Element): string {
      const clone = host.cloneNode(true) as Element;
      clone.querySelectorAll("input, select, textarea").forEach((node) => node.remove());
      return tidy(clone.textContent);
    }
    function visibleLabel(el: Element): string {
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        const explicit = el.id ? root.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null;
        const host = explicit ?? el.closest("label");
        return host ? labelText(host) : "";
      }
      return tidy(el.textContent);
    }
    function accessibleName(el: Element): string {
      const labelledBy = el.getAttribute("aria-labelledby");
      if (labelledBy) {
        return tidy(labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" "));
      }
      const aria = el.getAttribute("aria-label");
      if (aria) return tidy(aria);
      if ("labels" in el && el.labels instanceof NodeList && el.labels.length > 0) {
        return tidy([...el.labels].map((label) => labelText(label)).join(" "));
      }
      return tidy(el.textContent);
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

async function assertScanStaysVisible(page: Page): Promise<void> {
  await tabTo(page, "Next");
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press("Space");
    const problem = await page.evaluate(() => {
      const bar = document.querySelector("[data-switch-bar]");
      const current = document.querySelector("[data-switch-current]");
      const next = document.querySelector("[data-switch-bar] button");
      if (!(bar instanceof HTMLElement) || !(current instanceof HTMLElement) || !(next instanceof HTMLElement)) return "missing switch highlight";
      const barBox = bar.getBoundingClientRect();
      const currentBox = current.getBoundingClientRect();
      const nextBox = next.getBoundingClientRect();
      if (nextBox.top < 0 || nextBox.bottom > window.innerHeight) return "Next is outside the viewport";
      const overlaps = currentBox.top < barBox.bottom - 1 && currentBox.bottom > barBox.top + 1;
      if (overlaps) return `highlight is covered by the switch bar (${Math.round(currentBox.top)} under ${Math.round(barBox.bottom)})`;
      return "";
    });
    expect(problem).toBe("");
  }
}

async function chooseHighlighted(page: Page): Promise<void> {
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Choose", exact: true })).toBeFocused();
  await page.keyboard.press("Space");
}

async function scanChoose(page: Page, label: string): Promise<void> {
  await tabTo(page, "Next");
  let start = "";
  const seen: string[] = [];
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
      await chooseHighlighted(page);
      return;
    }
    if (!start) start = info.index;
    else if (info.index === start) break;
    seen.push(info.text || info.index);
  }
  throw new Error(`Switch did not reach ${label}. Saw ${seen.join(" | ")}`);
}

test("place, search, finders, games, directory, timing, and paratransit work from the keyboard", async ({ page }) => {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const screen of SCREENS) {
      await openScreen(page, screen);
      expect(await labelAndSizeFailures(page), `${screen} ${viewport.width}`).toEqual([]);
      await tabTo(page, "Next");
      await page.keyboard.press("Space");
      const first = await page.locator("[data-switch-current]").textContent();
      await expect(page.getByRole("button", { name: "Next", exact: true })).toBeFocused();
      await page.keyboard.press("Space");
      const second = await page.locator("[data-switch-current]").textContent();
      expect(second, `${screen} ${viewport.width}`).not.toBe(first);
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Choose", exact: true })).toBeFocused();
      await assertScanStaysVisible(page);

      await tabTo(page, "Français");
      await page.keyboard.press("Enter");
      await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe("fr");
      expect(await labelAndSizeFailures(page), `${screen} fr ${viewport.width}`).toEqual([]);
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
      expect(left, `${screen} ${viewport.width}`).toBe(true);
    }
  }
});

test("delete confirmation is a dialog and Escape works from the second button", async ({ page }) => {
  await openScreen(page, "Place");
  await tabTo(page, "Delete my profile");
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "This deletes the profile saved on this device." });
  await expect(dialog).toBeVisible();
  await page.evaluate(() => {
    const next = [...document.querySelectorAll("button")].find((button) => button.textContent?.trim() === "Next");
    next?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await expect(page.locator("[data-switch-current]")).toHaveText("Delete the saved profile");
  const inside = await page.evaluate(() => {
    const current = document.querySelector("[data-switch-current]");
    const open = document.querySelector("dialog[open]");
    return Boolean(current && open?.contains(current) && current.textContent !== "Skip to content");
  });
  expect(inside).toBe(true);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Keep my profile" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete my profile" })).toBeFocused();
});

test("Choose activates every widget type on the screens", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await openScreen(page, "Place");

  const picked = new Set<string>();
  let cycleStart = "";
  for (let i = 0; i < 200 && picked.size < 6; i += 1) {
    const onNext = await page.evaluate(() => (document.activeElement?.textContent ?? "").replace(/\s+/g, " ").trim() === "Next");
    if (!onNext) await tabTo(page, "Next");
    await page.keyboard.press("Space");
    const info = await page.evaluate(() => {
      const el = document.querySelector("[data-switch-current]");
      if (!(el instanceof HTMLElement)) return null;
      return {
        tag: el.tagName,
        type: el instanceof HTMLInputElement ? el.type : "",
        text: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
        className: el.className,
        index: [...(document.querySelector("[data-switch-root]")?.querySelectorAll("a[href], button, input, select, textarea, [tabindex]") ?? [])].indexOf(el),
      };
    });
    if (!info) continue;
    const key = String(info.index);
    if (!cycleStart) cycleStart = key;
    else if (key === cycleStart) break;
    const kind =
      info.tag === "A" ? "link"
      : info.type === "checkbox" ? "checkbox"
      : info.type === "text" ? "text"
      : info.tag === "SELECT" ? "select"
      : info.tag === "TEXTAREA" ? "textarea"
      : info.className.includes("table-scroll") ? "group"
      : "";
    if (!kind || picked.has(kind)) continue;
    const before = await page.evaluate(() => [...document.querySelectorAll("input[type='checkbox']")].map((el) => (el as HTMLInputElement).checked));
    await chooseHighlighted(page);
    if (kind === "link") await expect(page).toHaveURL(/#/);
    if (kind === "checkbox") {
      const after = await page.evaluate(() => [...document.querySelectorAll("input[type='checkbox']")].map((el) => (el as HTMLInputElement).checked));
      expect(after).not.toEqual(before);
    }
    if (kind === "text") await expect.poll(() => page.evaluate(() => document.activeElement instanceof HTMLInputElement && document.activeElement.type === "text")).toBe(true);
    if (kind === "select") await expect.poll(() => page.evaluate(() => document.activeElement instanceof HTMLSelectElement)).toBe(true);
    if (kind === "textarea") await expect.poll(() => page.evaluate(() => document.activeElement instanceof HTMLTextAreaElement)).toBe(true);
    if (kind === "group") await expect.poll(() => page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.classList.contains("table-scroll"))).toBe(true);
    picked.add(kind);
    cycleStart = "";
  }
  expect([...picked].sort()).toEqual(["checkbox", "group", "link", "select", "text", "textarea"]);
  await scanChoose(page, "Français");
  await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe("fr");

  await openScreen(page, "Search");
  await tabTo(page, "Next");
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press("Space");
    const type = await page.evaluate(() => {
      const el = document.querySelector("[data-switch-current]");
      return el instanceof HTMLInputElement ? el.type : "";
    });
    if (type === "search") {
      await chooseHighlighted(page);
      await expect.poll(() => page.evaluate(() => document.activeElement instanceof HTMLInputElement && document.activeElement.type === "search")).toBe(true);
      return;
    }
  }
  throw new Error("Switch did not reach the search box");
});

test("each game can finish one round from the switch", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 320, height: 700 });
  await openScreen(page, "Games");
  for (const game of CATALOG) {
    let session = createSession(game.id, { seed: 4, pace: "relaxed", language: "en", timerEnabled: false, practice: false });
    await scanChoose(page, `Play ${game.name}`);
    for (let guard = 0; guard < 80 && !session.done; guard += 1) {
      const step = solutionIds(session)[0];
      const label = viewSession(session).choices.find((choice) => choice.id === step)?.label;
      if (!step || !label) break;
      await scanChoose(page, label);
      session = choose(session, step);
    }
    expect(session.done, game.id).toBe(true);
    await expect(page.getByText("Round finished. You can stop here. Nothing else in the App changes.")).toBeVisible();
    await scanChoose(page, "Back to games");
    await expect(page.getByRole("button", { name: `Play ${game.name}` })).toBeVisible();
  }
});
