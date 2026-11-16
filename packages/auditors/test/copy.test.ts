import { describe, expect, it } from "vitest";
import { sweep, collectStrings } from "../../release/src/index.js";
import { words } from "../src/catalog.js";
import { copy, fill } from "../src/copy.js";
import * as fixtures from "../src/fixtures.js";

function keys(value: unknown, path = ""): string[] {
  if (value === null || typeof value !== "object") return [path];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => keys(child, `${path}.${key}`)).sort();
}
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1] as string).sort();
}

describe("string catalogues", () => {
  it.each([["copy", copy], ["words", words]] as const)("%s has the same keys in English and French", (_name, catalog) => {
    expect(keys(catalog.fr)).toEqual(keys(catalog.en));
  });
  it.each([["copy", copy], ["words", words]] as const)("%s has no empty string and the same placeholders in both languages", (name, catalog) => {
    const en = new Map(collectStrings(catalog.en, name));
    for (const [where, text] of collectStrings(catalog.fr, name)) {
      expect(text.trim(), where).not.toBe("");
      expect(placeholders(text), where).toEqual(placeholders(en.get(where) ?? ""));
    }
  });
  it("makes no endorsement, verified-data, guarantee, live, medical or eligibility claim, and names no tooling", () => {
    const strings = [
      ...collectStrings(copy, "auditors.copy"), ...collectStrings(words, "auditors.words"),
      ...collectStrings(fixtures.fixtureObservations("2026-11-16"), "auditors.fixtures.observations"),
      ...collectStrings(fixtures.fixtureCases("2026-11-16"), "auditors.fixtures.cases"),
    ];
    expect(strings.length).toBeGreaterThan(300);
    expect(sweep(strings)).toEqual([]);
  });
  it("offers no points, badges or leaderboard wording as a feature", () => {
    for (const [where, text] of [...collectStrings(copy, "copy"), ...collectStrings(words, "words")]) {
      expect(text, where).not.toMatch(/\b(leaderboard|badge|top auditor|streak|palmarès|écusson)\b/i);
    }
  });
  it("fills placeholders and leaves an unknown one visible", () => {
    expect(fill("{a} of {b}", { a: 1, b: 2 })).toBe("1 of 2");
    expect(fill("{a} {missing}", { a: "x" })).toBe("x {missing}");
  });
});
