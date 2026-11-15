import { describe, expect, it } from "vitest";
import { DEFAULT_OUTAGE_SNAPSHOT, resolveOutage, type OutageSnapshot } from "../src/disruption.js";
import { validateOutageSnapshot } from "../src/outageSchema.js";

const NOW = new Date("2026-11-20T14:00:00.000Z");
const fixture: OutageSnapshot = {
  status: "disrupted",
  stationOrSegmentId: "demo-station-1",
  source: "Demonstration fixture",
  licence: "Demonstration data, not real",
  retrievedAt: "2026-11-20T13:00:00.000Z",
  expiresAt: "2026-11-20T15:00:00.000Z",
  tier: "PROTOTYPE-UNVERIFIED",
};

describe("disruption mode", () => {
  it("defaults to unknown with no invented station, source or feed", () => {
    expect(DEFAULT_OUTAGE_SNAPSHOT.status).toBe("unknown");
    expect(DEFAULT_OUTAGE_SNAPSHOT.stationOrSegmentId).toBeNull();
    expect(DEFAULT_OUTAGE_SNAPSHOT.tier).toBe("PROTOTYPE-UNVERIFIED");
    expect(resolveOutage(undefined, NOW)).toMatchObject({ status: "unknown", isDefault: true });
    expect(resolveOutage(DEFAULT_OUTAGE_SNAPSHOT, NOW).status).toBe("unknown");
  });

  it("uses a complete, unexpired prototype snapshot", () => {
    expect(resolveOutage(fixture, NOW)).toMatchObject({ status: "disrupted", isDefault: false });
  });

  it("falls back to unknown when expired, incomplete or above prototype tiers", () => {
    expect(resolveOutage(fixture, new Date("2026-11-20T15:00:00.000Z")).status).toBe("unknown");
    expect(resolveOutage({ ...fixture, licence: null }, NOW).status).toBe("unknown");
    expect(resolveOutage({ ...fixture, source: " " }, NOW).status).toBe("unknown");
    expect(resolveOutage({ ...fixture, expiresAt: fixture.retrievedAt }, NOW).status).toBe("unknown");
    expect(resolveOutage({ ...fixture, tier: "VERIFIED" } as unknown as OutageSnapshot, NOW).status).toBe("unknown");
    expect(resolveOutage({ ...fixture, tier: "3" } as unknown as OutageSnapshot, NOW).status).toBe("unknown");
  });

  it("schema accepts the default and a complete fixture", () => {
    expect(validateOutageSnapshot(DEFAULT_OUTAGE_SNAPSHOT)).toEqual({ valid: true, errors: [] });
    expect(validateOutageSnapshot({ ...fixture, tier: "SEEDED-OPEN-DATA" }).valid).toBe(true);
  });

  it("schema rejects missing provenance, bad tiers and extra fields", () => {
    expect(validateOutageSnapshot({ ...fixture, licence: null }).valid).toBe(false);
    expect(validateOutageSnapshot({ ...fixture, tier: "VERIFIED" }).valid).toBe(false);
    expect(validateOutageSnapshot({ ...fixture, tier: 3 }).valid).toBe(false);
    expect(validateOutageSnapshot({ ...fixture, status: "closed" }).valid).toBe(false);
    expect(validateOutageSnapshot({ ...fixture, extra: 1 }).valid).toBe(false);
    expect(validateOutageSnapshot({ ...fixture, retrievedAt: "yesterday" }).valid).toBe(false);
  });
});
