import { describe, expect, it } from "vitest";
import { DIRECTORY, RETRIEVED_ON, SHELL_CONTRACT_VERSION, listForShell, navigatorShellModule, recordErrors } from "../src/index.js";

const ctx = { locale: "en" as const, offline: true, nowIso: "2026-11-14T12:00:00.000Z" };
const HEALTH_KEY = /^(diagnosis|injurylevel|ais|medication|prescription|bladder|bowel|healthcard|ohip)$/;

function keys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(keys);
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => [key, ...keys(child)]);
}

describe("navigator shell adapter", () => {
  it("pins the shell contract version", () => {
    expect(SHELL_CONTRACT_VERSION).toBe("1.1.0");
  });

  it("returns every directory record unchanged, with no live status", async () => {
    const result = await navigatorShellModule.list(ctx);
    expect(result).toMatchObject({ moduleId: "navigator", availability: "ready", liveStatus: "unavailable", asOf: RETRIEVED_ON });
    expect(result.items).toEqual([...DIRECTORY]);
    expect(new Set(result.items.map((record) => record.id)).size).toBe(result.items.length);
  });

  it("keeps the fields the shell uses for source, licence, date, and tier E", () => {
    for (const record of listForShell(ctx).items) {
      expect(recordErrors(record), record.id).toEqual([]);
      expect(record.schemaVersion).toBe("directory-record-1.0.0");
      expect(record.verificationTier).toBe("administrator_page");
      expect(record.notEligibilityAdvice).toBe(true);
      expect(record.sourceName.trim()).not.toBe("");
      expect(record.licenceNote.en.trim()).not.toBe("");
      expect(record.licenceNote.fr.trim()).not.toBe("");
      expect(record.retrievedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(record.officialUrl.startsWith("https://")).toBe(true);
      expect(keys(record).filter((key) => HEALTH_KEY.test(key.toLowerCase()))).toEqual([]);
      expect(Object.keys(record)).not.toContain("eligibility");
      expect(Object.keys(record)).not.toContain("tier");
    }
  });

  it("filters with the submitted text and returns an empty list when nothing matches", () => {
    const first = DIRECTORY[0]!;
    const found = listForShell({ ...ctx, query: first.name.en });
    expect(found.items.map((record) => record.id)).toContain(first.id);
    const none = listForShell({ ...ctx, query: "zzzz no such program zzzz" });
    expect(none.items).toEqual([]);
    expect(none.availability).toBe("ready");
  });
});
