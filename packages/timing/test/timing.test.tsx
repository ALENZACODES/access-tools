import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import {
  EMERGENCY_PATHWAYS,
  TIMING_BOUNDARY,
  HEALTH_AWARE_TIMING_ENABLED,
  TimingPanel,
  blankTimingDocument,
  deleteTimingDocument,
  openTimingDatabase,
  parseTimingDocument,
  planTiming,
  readTimingDocument,
  writeTimingDocument,
  type TimingDocument,
} from "../src/index.js";

const legs = [
  { id: "leg-a", label: "Example leg A", durationMin: 40 },
  { id: "leg-b", label: "Example leg B", durationMin: 70 },
];

describe("timing documents", () => {
  it("starts blank with no clinical default", () => {
    const document = blankTimingDocument();
    expect(document.maxTimeBetweenWashroomsMin).toBeNull();
    expect(document.maxContinuousTravelMin).toBeNull();
    expect(document.restBreakEveryMin).toBeNull();
    expect(JSON.stringify(document)).not.toMatch(/15|30/);
  });

  it("rejects health fields and non-integers", () => {
    expect(() => parseTimingDocument({ ...blankTimingDocument(), diagnosis: "x" })).toThrow(/Health/);
    expect(() =>
      parseTimingDocument({ ...blankTimingDocument(), pressureReliefEveryMin: 15 }),
    ).toThrow(/Health|not valid/);
    expect(() =>
      parseTimingDocument({ ...blankTimingDocument(), maxTimeBetweenWashroomsMin: 15.5 }),
    ).toThrow(/not valid/);
    expect(() =>
      parseTimingDocument({ ...blankTimingDocument(), maxContinuousTravelMin: 0 }),
    ).toThrow(/not valid/);
  });

  it("accepts a user-typed interval", () => {
    const document = parseTimingDocument({
      ...blankTimingDocument(),
      maxTimeBetweenWashroomsMin: 90,
      updatedAt: "2026-11-13T15:00:00.000Z",
    });
    expect(document.maxTimeBetweenWashroomsMin).toBe(90);
  });
});

describe("timing plans", () => {
  it("includes emergency pathways and does not invent a limit", () => {
    const plan = planTiming(blankTimingDocument(), legs, []);
    expect(plan.placesLookedUp).toBe(false);
    expect(plan.constraintsSet).toBe(false);
    expect(plan.reminders).toEqual([]);
    expect(plan.flags).toEqual([]);
    expect(plan.emergencyPathways.map((pathway) => pathway.id)).toEqual([
      "call-911",
      "suicide-crisis-helpline-988",
      "connexontario",
    ]);
    expect(plan.emergencyPathways[0]?.href).toBe("tel:911");
    expect(plan.healthLine.status).toBe("not_reverified");
    expect(plan.boundary.en).toMatch(/not give medical advice/i);
    expect(JSON.stringify(plan.reminders)).not.toContain("15");
  });

  it("flags a supplied gap that is longer than the user's washroom note", () => {
    const document = parseTimingDocument({
      ...blankTimingDocument(),
      maxTimeBetweenWashroomsMin: 90,
      reminderLeadMin: 10,
    });
    const plan = planTiming(document, legs, [
      { id: "stop-1", label: "Caller-supplied stop", minutesFromStart: 0 },
    ]);
    expect(plan.flags.some((flag) => flag.kind === "washroom_user_limit")).toBe(true);
    expect(plan.reminders[0]?.atMinute).toBe(80);
    expect(plan.flags[0]?.message.en).toMatch(/your note, not medical advice/i);
  });

  it("says when no washroom stop was supplied", () => {
    const document = parseTimingDocument({
      ...blankTimingDocument(),
      maxTimeBetweenWashroomsMin: 30,
    });
    const plan = planTiming(document, legs, []);
    expect(plan.flags.some((flag) => flag.kind === "no_washroom_supplied")).toBe(true);
    expect(plan.flags.map((flag) => flag.message.en).join(" ")).toMatch(/does not look up places/i);
  });

  it("notes a long leg and a user rest preference", () => {
    const document = parseTimingDocument({
      ...blankTimingDocument(),
      maxContinuousTravelMin: 60,
      restBreakEveryMin: 50,
    });
    const plan = planTiming(document, legs, []);
    expect(plan.flags.some((flag) => flag.message.en.includes("Example leg B"))).toBe(true);
    expect(plan.reminders.filter((reminder) => reminder.kind === "rest_break_user_preference").map((item) => item.atMinute)).toEqual([
      50,
      100,
    ]);
    expect(plan.reminders.some((reminder) => reminder.message.en.includes("pressure-relief"))).toBe(true);
  });
});

describe("timing store", () => {
  it("keeps notes in the timing database and deletes them", async () => {
    const db = await openTimingDatabase();
    expect(await readTimingDocument(db)).toMatchObject({ maxTimeBetweenWashroomsMin: null });
    await writeTimingDocument(db, { ...blankTimingDocument(), maxContinuousTravelMin: 45 });
    expect((await readTimingDocument(db)).maxContinuousTravelMin).toBe(45);
    await deleteTimingDocument(db);
    expect((await readTimingDocument(db)).maxContinuousTravelMin).toBeNull();
    db.close();
  });

  it("refuses a catheter field before writing", async () => {
    const db = await openTimingDatabase();
    await expect(writeTimingDocument(db, { ...blankTimingDocument(), catheter: "x" })).rejects.toThrow(/Health/);
    db.close();
  });
});

function Harness() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [document, setDocument] = useState<TimingDocument>(blankTimingDocument());
  return (
    <TimingPanel
      language={language}
      onLanguage={setLanguage}
      document={document}
      onChange={setDocument}
      legs={legs}
      waypoints={[]}
    />
  );
}

describe("timing panel", () => {
  it("shows 911 and keeps health-aware timing out of the prototype", async () => {
    expect(HEALTH_AWARE_TIMING_ENABLED).toBe(false);
    const { container } = render(<Harness />);
    expect(screen.getByRole("link", { name: "Call 911 now" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Call 9-8-8" })).toHaveAttribute("href", "tel:988");
    expect(screen.getByRole("link", { name: "Text 9-8-8" })).toHaveAttribute("href", "sms:988");
    expect(screen.queryByLabelText(/washroom|toilettes|continuous travel/i)).not.toBeInTheDocument();
    expect(screen.getByText(/not in the prototype/i)).toBeInTheDocument();
    expect(screen.getByRole("note").textContent).toBe(TIMING_BOUNDARY.en);
    expect(EMERGENCY_PATHWAYS).toHaveLength(3);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Français" }));
    expect(document.documentElement.lang).toBe("fr");
    expect(screen.getByRole("link", { name: "Composer le 911 maintenant" })).toBeInTheDocument();
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
