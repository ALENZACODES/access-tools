import { describe, expect, it } from "vitest";
import { getValidator } from "access-main/schema";
import { canonicalFixtureRecords } from "./canonical.js";
import { fixturePack } from "./fixtures.js";

describe("canonical fixtures", () => {
  it("validates every converted fixture against @access-main/schema", () => {
    const validator = getValidator();
    const records = canonicalFixtureRecords(fixturePack);
    expect(records.length).toBeGreaterThan(0);
    const failures = records.flatMap((record) => {
      const result = validator.validateDetected(record);
      if (result.ok) return [];
      const id = typeof record.id === "string" ? record.id : "unknown";
      return [`${id} (${result.schemaId || "no schema"}): ${result.errors.map((error) => `${error.instancePath} ${error.message}`).join("; ")}`];
    });
    expect(failures).toEqual([]);
  });
});
