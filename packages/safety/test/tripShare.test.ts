import { describe, expect, it } from "vitest";
import {
  MAX_SHARE_LIFETIME_MS,
  SHARE_GRACE_MS,
  createTripShare,
  decodeTripShare,
  encodeTripShare,
  isTripShareExpired,
  revokeTripShare,
} from "../src/tripShare.js";

const NOW = new Date("2026-11-20T14:00:00.000Z");
const input = {
  originLabel: " Home ",
  destinationLabel: "Clinic",
  windowStart: new Date("2026-11-20T14:30:00.000Z"),
  windowEnd: new Date("2026-11-20T16:00:00.000Z"),
  notes: "Meet at side door",
};

function make(id = "share-1") {
  const result = createTripShare(input, NOW, id);
  if (!result.ok) throw new Error(result.error);
  return result.share;
}

describe("trip share", () => {
  it("trims labels and expires one hour after the expected end", () => {
    const share = make();
    expect(share.originLabel).toBe("Home");
    expect(share.expiresAt).toBe(new Date(input.windowEnd.getTime() + SHARE_GRACE_MS).toISOString());
  });

  it("caps lifetime at 24 hours from creation", () => {
    const result = createTripShare({ ...input, windowEnd: new Date("2026-11-25T00:00:00.000Z") }, NOW, "x");
    expect(result.ok && result.share.expiresAt).toBe(new Date(NOW.getTime() + MAX_SHARE_LIFETIME_MS).toISOString());
  });

  it("is live before expiry and dead at and after expiry", () => {
    const share = make();
    const text = encodeTripShare(share);
    const expires = new Date(share.expiresAt).getTime();
    expect(decodeTripShare(text, new Date(expires - 1)).status).toBe("live");
    expect(isTripShareExpired(share, new Date(expires))).toBe(true);
    const dead = decodeTripShare(text, new Date(expires));
    expect(dead).toEqual({ status: "expired", expiresAt: share.expiresAt });
    expect(JSON.stringify(dead)).not.toContain("Clinic");
  });

  it("round-trips a live payload with notes", () => {
    const decoded = decodeTripShare(encodeTripShare(make()), NOW);
    expect(decoded.status === "live" && decoded.share.notes).toBe("Meet at side door");
  });

  it("revoke kills the payload and reveals nothing", () => {
    const share = make("abc");
    const text = encodeTripShare(share);
    const revoked = revokeTripShare([], "abc");
    expect(revoked).toEqual(["abc"]);
    expect(revokeTripShare(revoked, "abc")).toEqual(["abc"]);
    expect(decodeTripShare(text, NOW, revoked)).toEqual({ status: "revoked" });
    expect(decodeTripShare(text, NOW, ["other"]).status).toBe("live");
  });

  it("rejects bad input", () => {
    const err = (patch: Partial<typeof input>) => {
      const r = createTripShare({ ...input, ...patch }, NOW);
      return r.ok ? "ok" : r.error;
    };
    expect(err({ originLabel: "  " })).toBe("origin-required");
    expect(err({ destinationLabel: "" })).toBe("destination-required");
    expect(err({ originLabel: "x".repeat(81) })).toBe("label-long");
    expect(err({ notes: "x".repeat(281) })).toBe("notes-long");
    expect(err({ windowEnd: input.windowStart })).toBe("window-invalid");
    expect(err({ windowStart: new Date("nope") })).toBe("window-invalid");
    expect(err({ windowStart: new Date("2026-11-20T12:00:00Z"), windowEnd: new Date("2026-11-20T13:00:00Z") })).toBe("window-ended");
  });

  it("treats malformed or foreign text as invalid", () => {
    expect(decodeTripShare("hello", NOW).status).toBe("invalid");
    expect(decodeTripShare("ACCESS-TRIP-SHARE/1 {not json", NOW).status).toBe("invalid");
    expect(decodeTripShare('ACCESS-TRIP-SHARE/1 {"version":1}', NOW).status).toBe("invalid");
  });
});
