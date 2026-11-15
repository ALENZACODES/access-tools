import { describe, expect, it } from "vitest";
import { appendEvent, blankAudit, isAudit, newProvenance, saveFact, serviceReport } from "../src/model.js";
import type { AuditEvent } from "../src/model.js";

const venueId = "demo-hall";
function event(id: string, at: string): AuditEvent {
  return { id, venueId, at, actor: "venue-owner", action: "dispute", detail: "Demo only" };
}
describe("auditor contract", () => {
  it("accepts unknown with provenance and never turns unknown into zero", () => {
    const audit = blankAudit(venueId);
    const fact = { field: "stepHeightMm" as const, value: null, provenance: newProvenance("2026-11-15", "local-1"), photoIds: [] };
    const saved = saveFact(audit, fact, { ...event("capture", "2026-11-15T14:00:00Z"), actor: "auditor", action: "measurement" });
    expect(isAudit(saved)).toBe(true);
    expect(saved.facts[0]?.value).toBeNull();
    expect(saved.facts[0]?.provenance.tier).toBe(0);
  });
  it("forbids VERIFIED, tier 3, other prototype labels and injected verified fields", () => {
    const base = blankAudit(venueId);
    const fact = { field: "doorClearWidthMm" as const, value: 850, provenance: newProvenance("2026-11-15", "local-2"), photoIds: [] };
    const audit = saveFact(base, fact, { ...event("capture", "2026-11-15T14:00:00Z"), actor: "auditor", action: "measurement" });
    expect(isAudit({ ...audit, verified: true })).toBe(false);
    expect(isAudit({ ...audit, label: "VERIFIED" })).toBe(false);
    expect(isAudit({ ...audit, label: "SEEDED-OPEN-DATA" })).toBe(false);
    expect(isAudit({ ...audit, facts: [{ ...fact, provenance: { ...fact.provenance, tier: 3 } }] })).toBe(false);
    expect(isAudit({ ...audit, facts: [{ ...fact, provenance: { ...fact.provenance, prototypeLabel: "VERIFIED" } }] })).toBe(false);
    expect(isAudit({ ...audit, facts: [{ ...fact, provenance: { ...fact.provenance, evidence: { protocolVersion: "1" } } }] })).toBe(false);
  });
  it("rejects missing photo references and non-demo venues", () => {
    expect(() => blankAudit("real-venue")).toThrow();
    const audit = blankAudit(venueId);
    const fact = { field: "doorClearWidthMm" as const, value: 800, provenance: newProvenance("2026-11-15", "local-1"), photoIds: ["absent"] };
    expect(() => saveFact(audit, fact, event("capture", "2026-11-15T14:00:00Z"))).toThrow();
  });
  it("keeps the full audit trail ordered by timestamp and then ID", () => {
    const first = appendEvent(blankAudit(venueId), event("z", "2026-11-15T13:00:00Z"));
    const second = appendEvent(first, event("b", "2026-11-14T13:00:00Z"));
    const third = appendEvent(second, event("a", "2026-11-15T13:00:00Z"));
    expect(third.events.map((e) => e.id)).toEqual(["b", "a", "z"]);
    expect(() => appendEvent(third, event("a", "2026-11-15T13:00:00Z"))).toThrow();
  });
  it("reports overdue unanswered demo submissions as misses, not responses", () => {
    const audit = appendEvent(blankAudit(venueId), event("x", "2026-11-01T00:00:00Z"));
    expect(serviceReport(audit, new Date("2026-11-15T00:00:00Z"))).toEqual({ submissions: 1, responded: 0, pending: 1, misses: 1 });
    expect(serviceReport(blankAudit(venueId), new Date())).toEqual({ submissions: 0, responded: 0, pending: 0, misses: 0 });
  });
});
