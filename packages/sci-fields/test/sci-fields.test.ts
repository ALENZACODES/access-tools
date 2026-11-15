import { describe, expect, it } from "vitest";
import {
  ALIASES, CATALOG, FIELD_IDS, breakReminderText, formatFact, label, loadProfile, makeFact,
  saveProfile, unknownFact, validateCatalog, validateFactShape, validateProfile,
} from "../src";
import type { SciFieldFact } from "../src";

const BANNED = /you should|you are eligible|vous devriez|vous êtes admissible|catheter|cathéter|pressure[- ]relief|décharge de pression|\bAI\b|artificial intelligence|intelligence artificielle|\bclaude\b|\bgpt\b|\bscore\b|\bstars?\b/i;

function allCopy(): string[] {
  const out: string[] = [];
  for (const f of CATALOG) {
    out.push(f.label.en, f.label.fr, f.observed.en, f.observed.fr);
    for (const v of Object.values(f.values ?? {})) out.push(v.en, v.fr);
  }
  return out;
}
const synthetic = (over: Partial<SciFieldFact>): SciFieldFact => ({
  field: "counter_height_mm", value: 900, source_id: "synthetic-fixture", licence: "CC0", retrieved_at: "2026-01-15", tier: 1, ...over,
});

describe("schema", () => {
  it("catalog validates against its JSON Schema", () => {
    expect(validateCatalog(CATALOG)).toBe(true);
  });
  it("covers every required id", () => {
    for (const id of ["transfer_side", "transfer_space_mm", "turning_space_mm", "adult_change_table", "hoist", "door_clear_width_mm", "counter_height_mm", "lighting", "noise", "staff_will_help", "open_without_purchase", "staff_refuel", "approach_step_free", "approach_surface", "approach_notes", "curb_snowbank", "charging_powerchair"])
      expect(FIELD_IDS).toContain(id);
  });
  it("accepts a bare UNKNOWN and a full fact", () => {
    expect(validateFactShape({ field: "hoist", value: "UNKNOWN" })).toBe(true);
    expect(validateFactShape(synthetic({}))).toBe(true);
  });
  it("rejects a value without provenance", () => {
    expect(validateFactShape({ field: "counter_height_mm", value: 900 })).toBe(false);
  });
  it("rejects wrong value types, unknown enum values and unapproved licences", () => {
    expect(validateFactShape(synthetic({ value: "tall" }))).toBe(false);
    expect(validateFactShape(synthetic({ field: "hoist", value: "crane" }))).toBe(false);
    expect(validateFactShape(synthetic({ licence: "Proprietary" as never }))).toBe(false);
  });
  it("this lane never self-assigns tier 2 or 3", () => {
    expect(() => makeFact(synthetic({ tier: 2 as never }))).toThrow();
    expect(makeFact(synthetic({ tier: 1 })).tier).toBe(1);
  });
});

describe("UNKNOWN default and display", () => {
  it("defaults to UNKNOWN for every id", () => {
    for (const id of FIELD_IDS) {
      expect(unknownFact(id).value).toBe("UNKNOWN");
      expect(formatFact(unknownFact(id), "en")).toBe("Unknown");
      expect(formatFact(unknownFact(id), "fr")).toBe("Inconnu");
    }
    expect(formatFact(undefined, "fr")).toBe("Inconnu");
  });
  it("never renders a missing value as no or not accessible", () => {
    const s = formatFact(unknownFact("staff_will_help"), "en").toLowerCase();
    expect(s).not.toMatch(/\bno\b|not accessible/);
  });
  it("tier 0 drafts are not shown as facts", () => {
    expect(formatFact(synthetic({ tier: 0 }), "en")).toBe("Unknown");
  });
  it("shows source, licence, date and tier", () => {
    const s = formatFact(synthetic({}), "en");
    expect(s).toContain("900 mm");
    for (const part of ["synthetic-fixture", "CC0", "2026-01-15", "Tier: 1"]) expect(s).toContain(part);
    expect(formatFact(synthetic({}), "fr")).toContain("Niveau: 1");
  });
  it("uses 'last checked' for dated-visit fields and adds ODbL attribution", () => {
    const f = synthetic({ field: "staff_will_help", value: false, licence: "ODbL" });
    expect(formatFact(f, "en")).toContain("Last checked: 2026-01-15");
    expect(formatFact(f, "en")).toContain("© OpenStreetMap contributors, ODbL");
    expect(formatFact(f, "en")).toContain("No");
  });
  it("label resolves aliases and throws on unknown ids", () => {
    expect(label("door_clear_width", "en")).toBe(label("door_clear_width_mm", "en"));
    expect(() => label("nope", "en")).toThrow();
  });
});

describe("catalog hygiene", () => {
  it("ids are unique", () => { expect(new Set(FIELD_IDS).size).toBe(FIELD_IDS.length); });
  it("aliases are unique, map to real ids and never shadow a canonical id", () => {
    const keys = Object.keys(ALIASES);
    expect(new Set(keys).size).toBe(keys.length);
    for (const [a, id] of Object.entries(ALIASES)) {
      expect(FIELD_IDS).toContain(id);
      expect(FIELD_IDS).not.toContain(a);
    }
  });
  it("has EN and FR text for every id, value and note", () => {
    for (const f of CATALOG) {
      for (const t of [f.label, f.observed, ...Object.values(f.values ?? {})]) {
        expect(t.en.trim().length).toBeGreaterThan(0);
        expect(t.fr.trim().length).toBeGreaterThan(0);
      }
      expect(label(f.id, "fr")).not.toBe(label(f.id, "en") + "!");
    }
  });
  it("measured fields declare a unit and enums declare values", () => {
    for (const f of CATALOG) {
      if (f.id.endsWith("_mm")) expect(f.unit).toBe("mm");
      if (f.kind === "enum") expect(Object.keys(f.values ?? {}).length).toBeGreaterThan(1);
    }
  });
  it("contains no advice, medical, model-name or scoring language", () => {
    for (const t of allCopy()) expect(t).not.toMatch(BANNED);
  });
});

describe("profile hooks", () => {
  it("has no default break interval and accepts an empty profile", () => {
    expect(validateProfile({}).ok).toBe(true);
    expect(breakReminderText({}, "en")).toBeNull();
    expect(loadProfile({ getItem: () => null, setItem: () => {} })).toEqual({});
  });
  it("rejects clinical or unknown keys", () => {
    expect(validateProfile({ injuryLevel: "T6" }).ok).toBe(false);
    expect(validateProfile({ diagnosis: "x" }).ok).toBe(false);
    expect(validateProfile({ breakIntervalMinutes: 0 }).ok).toBe(false);
  });
  it("round-trips through device storage", () => {
    const mem = new Map<string, string>();
    const kv = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    expect(saveProfile(kv, { chairWidthMm: 650, transferSide: "left", breakIntervalMinutes: 45 })).toBe(true);
    expect(loadProfile(kv).breakIntervalMinutes).toBe(45);
    expect(saveProfile(kv, { chairWidthMm: 5 })).toBe(false);
  });
  it("break copy is user-set wording without advice", () => {
    for (const lang of ["en", "fr"] as const) {
      const s = breakReminderText({ breakIntervalMinutes: 30 }, lang)!;
      expect(s).toContain("30");
      expect(s).not.toMatch(BANNED);
    }
    expect(breakReminderText({ breakIntervalMinutes: 30 }, "en")).toMatch(/set by you/);
  });
});
