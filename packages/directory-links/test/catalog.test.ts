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
});
