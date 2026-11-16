import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import schema from "../src/catalog.schema.json";
import { catalog, isLive } from "../src/catalog";

describe("catalog", () => {
  it("matches the JSON Schema", () => {
    const validate = new Ajv2020({ allErrors: true }).compile(schema);
    expect(validate(catalog), JSON.stringify(validate.errors)).toBe(true);
  });
  it("has unique ids and the two listed addresses", () => {
    expect(new Set(catalog.map((l) => l.id)).size).toBe(catalog.length);
    expect(catalog.find((l) => l.id === "211-ontario")?.url).toBe("https://211ontario.ca/");
    expect(catalog.find((l) => l.id === "benefits-wayfinder")?.url).toBe("https://benefitswayfinder.org/");
  });
  it("stores unverified links with url null and never marks them live", () => {
    const pending = catalog.filter((l) => l.status === "needs-verification");
    expect(pending.length).toBeGreaterThanOrEqual(7);
    for (const l of pending) {
      expect(l.url).toBeNull();
      expect(isLive(l)).toBe(false);
    }
  });
  it("treats a needs-verification link with an address as not live", () => {
    const pendingRow = catalog.find((l) => l.status === "needs-verification");
    expect(pendingRow).toBeDefined();
    expect(isLive({ ...pendingRow!, url: "https://example.invalid/" })).toBe(false);
  });
  it("lists the pages read on 2026-11-16 as dated link-outs on https addresses", () => {
    const dated = catalog.filter((l) => l.retrieved_at === "2026-11-16");
    expect(dated).toHaveLength(32);
    expect(dated.filter((l) => l.group === "transit")).toHaveLength(25);
    expect(dated.filter((l) => l.group === "wav")).toHaveLength(7);
    for (const l of dated) {
      expect(isLive(l)).toBe(true);
      expect(l.licence).toBe("link-out");
      expect(l.notesEn).toMatch(/^Link-out only\./);
      expect(l.notesFr).toMatch(/^Lien externe seulement\./);
    }
    expect(new Set(dated.map((l) => l.url)).size).toBe(dated.length);
    // The general wheelchair-accessible vehicle placeholder stays unverified: no province-wide page was read.
    expect(catalog.find((l) => l.id === "wav-official-info")?.url).toBeNull();
  });
});
