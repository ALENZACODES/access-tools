import { describe, expect, it } from "vitest";
import { IDLE_CHECKIN, buildHelpSummary, closeCheckIn, isCheckInOverdue, markNeedHelp, markOk, startCheckIn } from "../src/checkin.js";
import { createTripShare } from "../src/tripShare.js";

const NOW = new Date("2026-11-20T14:00:00.000Z");

describe("check-in", () => {
  it("starts a window and becomes overdue only after it ends", () => {
    const state = startCheckIn(NOW, 30);
    expect(state.status).toBe("active");
    expect(state.dueAt).toBe("2026-11-20T14:30:00.000Z");
    expect(isCheckInOverdue(state, new Date("2026-11-20T14:29:59.000Z"))).toBe(false);
    expect(isCheckInOverdue(state, new Date("2026-11-20T14:30:00.000Z"))).toBe(true);
  });

  it("rejects silly windows", () => {
    expect(() => startCheckIn(NOW, 0)).toThrow(RangeError);
    expect(() => startCheckIn(NOW, 1.5)).toThrow(RangeError);
    expect(() => startCheckIn(NOW, 721)).toThrow(RangeError);
  });

  it("marks OK or needs-help only from an active window", () => {
    const active = startCheckIn(NOW, 30);
    expect(markOk(active, NOW).status).toBe("ok");
    expect(markNeedHelp(active, NOW).status).toBe("needs-help");
    expect(markOk(IDLE_CHECKIN, NOW)).toBe(IDLE_CHECKIN);
    const done = markOk(active, NOW);
    expect(markNeedHelp(done, NOW)).toBe(done);
    expect(isCheckInOverdue(done, new Date("2027-01-01T00:00:00Z"))).toBe(false);
    expect(closeCheckIn()).toEqual(IDLE_CHECKIN);
  });

  it("builds a local summary that says it was not sent", () => {
    const state = markNeedHelp(startCheckIn(NOW, 30), NOW);
    const r = createTripShare(
      { originLabel: "Home", destinationLabel: "Clinic", windowStart: NOW, windowEnd: new Date("2026-11-20T16:00:00Z"), notes: "Side door" },
      NOW,
      "s",
    );
    if (!r.ok) throw new Error(r.error);
    const en = buildHelpSummary(state, r.share, "en");
    expect(en).toContain("Trip: Home to Clinic");
    expect(en).toContain("Notes: Side door");
    expect(en).toContain("Not sent to anyone. The App does not dispatch help.");
    expect(buildHelpSummary(state, null, "fr")).toContain("L'application n'envoie pas d'aide");
    expect(buildHelpSummary(state, null, "en")).not.toContain("Trip:");
  });
});
