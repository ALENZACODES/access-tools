// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App.js";
import { copy } from "../src/copy.js";
import { WORKSPACE_KEY, isWorkspace } from "../src/workspace.js";
import type { Workspace } from "../src/workspace.js";

// These tests type and click through whole screens; the default limit is too tight on a busy machine.
vi.setConfig({ testTimeout: 30_000 });

const NOW = new Date("2026-11-16T15:00:00Z");
const clock = () => NOW;
const en = copy.en;

function start() {
  const user = userEvent.setup();
  const view = render(<App clock={clock} />);
  return { user, view };
}
async function pick(user: ReturnType<typeof userEvent.setup>, label: string, value: string) {
  await user.selectOptions(screen.getByLabelText(label), value);
}
function card(container: HTMLElement, selector: string): HTMLElement {
  const found = container.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`Missing ${selector}`);
  return found;
}
function saved(): Workspace {
  const value: unknown = JSON.parse(localStorage.getItem(WORKSPACE_KEY) ?? "null");
  if (!isWorkspace(value, "2026-11-16")) throw new Error("Saved workspace is malformed");
  return value;
}
async function clean(container: HTMLElement) {
  document.title = "the App";
  // Colour contrast needs a real renderer; the browser run in e2e/a11y.spec.ts covers it.
  const results = await axe.run(container, { rules: { region: { enabled: false }, "color-contrast": { enabled: false } } });
  expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}

beforeEach(() => { localStorage.clear(); document.documentElement.lang = "en"; });
afterEach(() => cleanup());

describe("audit record", () => {
  it("shows every field with a value or Unknown, the tier the rules give and its freshness", () => {
    const { view } = start();
    const record = screen.getByRole("region", { name: en.recordHeading });
    expect(within(record).getAllByRole("listitem")).toHaveLength(8);
    const parking = card(view.container, '[data-field="parkingAisleWidthMm"]');
    expect(parking.textContent).toContain(en.unknown);
    expect(parking.textContent).toContain(en.tierName[0]);
    const lift = card(view.container, '[data-field="liftDoorWidthMm"]');
    expect(lift.dataset.freshness).toBe("stale");
    expect(lift.textContent).toContain("900 mm");
    expect(lift.textContent).toContain("Stale.");
    expect(lift.textContent).toContain("Dropped from tier 3");
    expect(card(view.container, '[data-field="rampWidthMm"]').textContent).toContain("Ageing.");
    expect(card(view.container, '[data-field="transferClearanceMm"]').textContent).toContain("Unknown is not zero");
  });
  it("never words a sample record as verified", () => {
    const { view } = start();
    expect(view.container.textContent).toContain("PROTOTYPE-UNVERIFIED");
    expect(view.container.textContent).toContain("unverified");
    expect(view.container.textContent?.replace(/unverified/gi, "").replace(/PROTOTYPE-UNVERIFIED/g, "")).not.toMatch(/verified/i);
  });
});

describe("auditor programme", () => {
  it("needs every training step before a task can be taken, and closes a task only with an observation", async () => {
    const { user, view } = start();
    expect(screen.getByText(en.trainingNeeded)).toBeTruthy();
    expect(screen.queryByRole("button", { name: new RegExp(`^${en.claim}`) })).toBeNull();
    for (const text of Object.values(en.training)) await user.click(screen.getByLabelText(text));
    expect(screen.getByTestId("training-progress").textContent).toBe("6 of 6 training steps done.");
    expect(screen.queryByText(en.trainingNeeded)).toBeNull();

    await user.click(screen.getByRole("button", { name: en.addFreshness }));
    const task = () => card(view.container, '[data-task^="task-fresh-demo-hall-liftDoorWidthMm"]');
    await user.click(within(task()).getByRole("button", { name: new RegExp(`^${en.claim}`) }));
    expect(within(task()).getByText(en.completeNeeds)).toBeTruthy();
    expect(within(task()).queryByRole("button", { name: new RegExp(`^${en.complete}`) })).toBeNull();
    expect(screen.getByTestId("count-audits").textContent).toBe("0");

    await pick(user, "Measurement type", "liftDoorWidthMm");
    await user.click(screen.getByLabelText("Unknown", { selector: 'input[type="checkbox"]' }));
    await user.type(screen.getByLabelText("Measurement in millimetres"), "900");
    await user.click(screen.getByRole("button", { name: "Save demonstration measurement" }));
    await user.click(within(task()).getByRole("button", { name: new RegExp(`^${en.complete}`) }));

    expect(screen.getByTestId("count-audits").textContent).toBe("1");
    expect(screen.getByTestId("count-fields").textContent).toBe("1");
    // The stale sample survey no longer counts. One new entry is tier 1, and never tier 3 without a review.
    const lift = card(view.container, '[data-field="liftDoorWidthMm"]');
    expect(lift.dataset.tier).toBe("1");
    expect(lift.dataset.freshness).toBe("current");
    const mine = saved().observations.filter((o) => o.origin === "device");
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ value: 900, observerRole: "trained_verifier", label: "PROTOTYPE-UNVERIFIED", observedOn: "2026-11-16" });
    expect(mine[0]?.review).toBeUndefined();
  });
  it("records Unknown as Unknown from the capture form", async () => {
    const { user, view } = start();
    await pick(user, "Measurement type", "parkingAisleWidthMm");
    await user.click(screen.getByRole("button", { name: "Save demonstration measurement" }));
    const parking = card(view.container, '[data-field="parkingAisleWidthMm"]');
    expect(parking.textContent).toContain("Unknown is not zero");
    expect(parking.dataset.tier).toBe("0");
    expect(saved().observations.find((o) => o.origin === "device")).toMatchObject({ value: null, observerRole: "peer" });
  });
});

describe("venue fix-it workflow", () => {
  it("validates the response, raises a re-check task and leaves the record untouched", async () => {
    const { user, view } = start();
    const before = card(view.container, '[data-field="stepHeightMm"]').textContent;
    await pick(user, "Demonstration role", "venue-owner");
    const venue = screen.getByRole("region", { name: en.venueHeading });
    expect(within(venue).getAllByTestId("barrier-status")).toHaveLength(2);
    const step = () => card(view.container, 'section[aria-labelledby="venue-heading"] [data-case="fx-case-step"]');

    await user.click(within(step()).getByLabelText(en.optFixed));
    await user.click(within(step()).getByRole("button", { name: en.sendResponse }));
    expect(within(step()).getByRole("alert").textContent).toBe(en.errFixedDate);
    expect(localStorage.getItem(WORKSPACE_KEY)).toBeNull();

    await user.type(within(step()).getByLabelText(en.fixedOn), "2026-11-15");
    await user.click(within(step()).getByRole("button", { name: en.sendResponse }));
    expect(within(step()).getByTestId("barrier-status").textContent).toBe(en.barrierStatus["fix-awaiting-recheck"]);
    expect(screen.getAllByRole("status").some((node) => node.textContent === en.responseSavedRecheck)).toBe(true);
    expect(card(view.container, '[data-field="stepHeightMm"]').textContent).toBe(before);
    const state = saved();
    expect(state.responses).toMatchObject([{ kind: "fixed", fixedOn: "2026-11-15", caseId: "fx-case-step" }]);
    expect(state.tasks.filter((task) => task.kind === "re-check" && task.caseId === "fx-case-step" && task.status === "open")).toHaveLength(1);
    expect(screen.getByRole("region", { name: "Full demonstration audit trail" }).textContent).toContain("Fix reported; re-check requested");

    await user.click(within(step()).getByLabelText(en.optDispute));
    await user.click(within(step()).getByRole("button", { name: en.sendResponse }));
    expect(within(step()).getByRole("alert").textContent).toBe(en.errReason);
    await user.type(within(step()).getByLabelText(en.reason), "The step is at a staff door.");
    await user.click(within(step()).getByRole("button", { name: en.sendResponse }));
    expect(within(step()).getByTestId("barrier-status").textContent).toBe(en.barrierStatus["dispute-awaiting-recheck"]);
    expect(saved().tasks.filter((task) => task.caseId === "fx-case-step")).toHaveLength(1);
    expect(card(view.container, '[data-field="stepHeightMm"]').textContent).toBe(before);

    await pick(user, "Demonstration role", "auditor");
    expect(card(view.container, '[data-task^="task-recheck-response-"]').textContent).toContain(en.taskKind["re-check"]);
  });
});

describe("correction workflow and service-level summary", () => {
  it("shows no data yet until a report is entered, then counts only what happened", async () => {
    const { user, view } = start();
    expect(screen.getByTestId("service-no-data").textContent).toContain(en.noData);
    expect(screen.queryByTestId("service-summary")).toBeNull();
    const cases = screen.getByRole("region", { name: en.casesHeading });
    expect(within(cases).getByText(en.overdue)).toBeTruthy();

    await user.click(within(cases).getByRole("button", { name: en.sendReport }));
    expect(within(cases).getAllByRole("alert").some((node) => node.textContent === en.errDescription)).toBe(true);
    await user.type(within(cases).getByLabelText(en.description), "The door width on file is too large.");
    await user.click(within(cases).getByRole("button", { name: en.sendReport }));
    expect(screen.queryByTestId("service-no-data")).toBeNull();
    expect(screen.getByTestId("service-summary").textContent).toContain("Computed from 1 reports on this device, as of 2026-11-16.");
    expect(card(view.container, '[data-stage="triage"]').textContent).toContain(`${en.stageMedian}${en.notYet}`);

    const mine = () => card(view.container, '[data-case^="case-"]:not([data-case^="case-fx"])');
    expect(mine().dataset.state).toBe("received");
    expect(mine().textContent).toContain("Next step due by 2026-11-21.");
    expect(within(mine()).getByText(en.coordinatorOnly)).toBeTruthy();

    await pick(user, "Demonstration role", "coordinator");
    await user.click(within(mine()).getByRole("button", { name: en.doDecline }));
    expect(within(mine()).getByRole("alert").textContent).toBe(en.errDeclineReason);
    await user.click(within(mine()).getByRole("button", { name: en.doTriage }));
    expect(mine().dataset.state).toBe("triaged");
    await user.click(within(mine()).getByRole("button", { name: en.doRecheck }));
    expect(mine().dataset.state).toBe("recheck");
    expect(within(mine()).getByText(en.waitingRecheck)).toBeTruthy();
    expect(within(mine()).queryByRole("button", { name: en.doResolve })).toBeNull();
    const state = saved();
    const item = state.cases.find((entry) => entry.origin === "device");
    expect(item?.history.map((event) => event.state)).toEqual(["received", "triaged", "recheck"]);
    expect(state.tasks.some((task) => task.caseId === item?.id && task.kind === "re-check" && task.status === "open")).toBe(true);
    expect(card(view.container, '[data-stage="triage"]').textContent).toContain(`${en.stageCompleted}1`);
    expect(screen.getByTestId("service-overdue").textContent).toBe("0");
  });
});

describe("languages, storage and accessibility", () => {
  it("renders every screen in French", async () => {
    const { user, view } = start();
    await pick(user, "Language", "fr");
    expect(document.documentElement.lang).toBe("fr");
    const fr = copy.fr;
    for (const heading of [fr.recordHeading, fr.programmeHeading, fr.casesHeading, fr.serviceHeading, fr.dataHeading]) {
      expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
    }
    await pick(user, "Rôle de démonstration", "venue-owner");
    expect(screen.getByRole("heading", { name: fr.venueHeading })).toBeTruthy();
    for (const heading of [en.recordHeading, en.casesHeading, en.serviceHeading, en.venueHeading]) {
      expect(view.container.textContent).not.toContain(heading);
    }
    expect(view.container.textContent).toContain(fr.noData);
  });
  it("keeps entries across a reload and removes them on a confirmed reset", async () => {
    const first = start();
    await first.user.click(screen.getByLabelText(en.training.method));
    first.view.unmount();
    const second = start();
    expect(screen.getByTestId("training-progress").textContent).toBe("1 of 6 training steps done.");
    await second.user.click(screen.getByRole("button", { name: en.reset }));
    await second.user.click(screen.getByRole("button", { name: en.resetCancel }));
    expect(screen.getByTestId("training-progress").textContent).toBe("1 of 6 training steps done.");
    await second.user.click(screen.getByRole("button", { name: en.reset }));
    await second.user.click(screen.getByRole("button", { name: en.resetConfirm }));
    expect(screen.getByTestId("training-progress").textContent).toBe("0 of 6 training steps done.");
  });
  it.each(["en", "fr"] as const)("has no axe violations in any role (%s)", async (lang) => {
    const { user, view } = start();
    await pick(user, "Language", lang);
    const roleLabel = lang === "en" ? "Demonstration role" : "Rôle de démonstration";
    for (const role of ["auditor", "venue-owner", "coordinator"]) {
      await pick(user, roleLabel, role);
      await clean(view.container);
    }
  });
  it("gives every form control a name and every button a type", () => {
    const { view } = start();
    for (const control of view.container.querySelectorAll("input, select, textarea")) {
      expect(control.closest("label") ?? control.getAttribute("aria-label"), control.outerHTML).toBeTruthy();
    }
    for (const button of view.container.querySelectorAll("button")) expect(button.getAttribute("type")).toBeTruthy();
  });
});
