import { describe, expect, it } from "vitest";
import { OSM_CREDIT, TileCache, attributionForDisplay, validateManifest } from "../src/index";
import type { TileRecord } from "../src/index";

const NOW = Date.parse("2026-11-15T12:00:00.000Z");
function tile(x = 0, bytes = [1, 2, 3]): TileRecord {
  return {
    bytes: new Uint8Array(bytes),
    manifest: {
      key: { z: 2, x, y: 0 }, byteLength: bytes.length,
      storedAt: "2026-11-14T12:00:00.000Z", expiresAt: "2026-11-16T12:00:00.000Z",
      source: "OpenStreetMap demonstration synthetic tiles", licence: "ODbL-1.0",
      attribution: OSM_CREDIT, retrievedOn: "2026-11-14",
      verification: "PROTOTYPE-UNVERIFIED",
    },
  };
}

describe("tile cache", () => {
  it("puts, retrieves, lists, checks, deletes and copies bytes defensively", () => {
    const cache = new TileCache(1, () => NOW);
    const record = tile();
    cache.put(record);
    record.bytes[0] = 99;
    expect(cache.has(record.manifest.key)).toBe(true);
    expect(cache.get(record.manifest.key)?.bytes[0]).toBe(1);
    expect(cache.getForDisplay(record.manifest.key)?.credit).toEqual({ text: OSM_CREDIT, licence: "ODbL-1.0" });
    expect(cache.list()).toHaveLength(1);
    expect(cache.status()).toMatchObject({ entries: 1, bytesUsed: 3, asOf: "2026-11-14" });
    expect(cache.delete(record.manifest.key)).toBe(true);
    expect(cache.get(record.manifest.key)).toBeUndefined();
  });

  it("rejects missing credits, wrong OSM licence, coordinates and unsupported verification", () => {
    const record = tile();
    record.manifest.attribution = "";
    expect(() => validateManifest(record.manifest)).toThrow();
    expect(() => new TileCache(1, () => NOW).put(record)).toThrow();
    record.manifest.attribution = OSM_CREDIT;
    record.manifest.licence = "Unknown";
    expect(() => validateManifest(record.manifest)).toThrow();
    record.manifest.licence = "ODbL-1.0";
    record.manifest.key.x = 4;
    expect(() => validateManifest(record.manifest)).toThrow();
    record.manifest.key.x = 0;
    record.manifest.verification = "3" as TileRecord["manifest"]["verification"];
    expect(() => validateManifest(record.manifest)).toThrow();
  });

  it("fails closed on display if a stored manifest is corrupted", () => {
    const record = tile();
    record.manifest.attribution = "";
    expect(() => attributionForDisplay(record.manifest)).toThrow();
    const cache = new TileCache(1, () => NOW);
    cache.put(tile());
    const stored = cache.get(tile().manifest.key);
    expect(stored).toBeDefined();
    if (!stored) throw new Error("Missing tile");
    stored.manifest.attribution = "";
    expect(() => attributionForDisplay(stored.manifest)).toThrow();
    expect(cache.getForDisplay(tile().manifest.key)?.credit.text).toBe(OSM_CREDIT);
  });

  it("enforces byte lengths, source bans and never fetches", () => {
    const cache = new TileCache(1, () => NOW);
    const record = tile();
    record.manifest.byteLength = 10;
    expect(() => cache.put(record)).toThrow(/length/);
    for (const source of ["live traffic", "elevator status", "disruption alerts"]) {
      const candidate = tile();
      candidate.manifest.source = source;
      expect(() => cache.put(candidate)).toThrow();
    }
    expect(cache.status().entries).toBe(0);
  });

  it("expires tiles and evicts oldest to meet cap", () => {
    let now = NOW;
    const cache = new TileCache(0.000006, () => now);
    cache.put(tile(0, [1, 2, 3]));
    cache.put(tile(1, [4, 5, 6]));
    expect(cache.status().entries).toBe(2);
    cache.put(tile(2, [7]));
    expect(cache.has({ z: 2, x: 0, y: 0 })).toBe(false);
    expect(cache.bytesUsed).toBeLessThanOrEqual(cache.capBytes);
    expect(cache.evictToQuota(0)).toBe(2);
    cache.put(tile());
    now = Date.parse("2026-11-17T00:00:00.000Z");
    expect(cache.evictExpired()).toBe(1);
    expect(cache.list()).toEqual([]);
  });

  it("rejects expired, oversized and invalid cap tiles", () => {
    expect(() => new TileCache(0)).toThrow();
    const cache = new TileCache(0.000002, () => NOW);
    expect(() => cache.put(tile())).toThrow(/cap/);
    const expired = tile();
    expired.manifest.expiresAt = "2026-11-15T11:00:00.000Z";
    expect(() => cache.put(expired)).toThrow(/expired/);
  });
});
