import { describe, expect, it } from "vitest";
import { DEFAULT_GATE_RULES, extractionGate, mayPublish } from "../src/gate.js";
import type { ReviewedSample } from "../src/gate.js";

function samples(fieldType: string, total: number, errors: number): ReviewedSample[] {
  return Array.from({ length: total }, (_, index) => ({ fieldType, correct: index >= errors }));
}

describe("human-review error gate", () => {
  it("uses 100 samples and under 5% error by default", () => {
    expect(DEFAULT_GATE_RULES).toEqual({ minSamples: 100, maxErrorRate: 0.05 });
  });
  it("passes a field type only with enough samples and an error share under the limit", () => {
    const results = extractionGate([...samples("door-width", 100, 4), ...samples("step-height", 100, 5), ...samples("ramp-width", 99, 0)]);
    expect(results).toEqual([
      { fieldType: "door-width", sampled: 100, errors: 4, errorRate: 0.04, outcome: "pass" },
      { fieldType: "ramp-width", sampled: 99, errors: 0, errorRate: 0, outcome: "blocked-too-few-samples" },
      { fieldType: "step-height", sampled: 100, errors: 5, errorRate: 0.05, outcome: "blocked-error-rate" },
    ]);
    expect(mayPublish(results, "door-width")).toBe(true);
    expect(mayPublish(results, "step-height")).toBe(false);
    expect(mayPublish(results, "ramp-width")).toBe(false);
  });
  it("does not let one field type's good record cover for another, or for one never sampled", () => {
    const results = extractionGate([...samples("door-width", 400, 0), ...samples("step-height", 100, 30)]);
    expect(mayPublish(results, "step-height")).toBe(false);
    expect(mayPublish(results, "lift-door")).toBe(false);
    expect(extractionGate([])).toEqual([]);
    expect(mayPublish([], "door-width")).toBe(false);
  });
  it("takes its limits from configuration and rejects nonsense", () => {
    expect(extractionGate(samples("door-width", 10, 1), { minSamples: 10, maxErrorRate: 0.2 })[0]?.outcome).toBe("pass");
    expect(() => extractionGate([], { minSamples: 0, maxErrorRate: 0.05 })).toThrow();
    expect(() => extractionGate([], { minSamples: 100, maxErrorRate: 0 })).toThrow();
    expect(() => extractionGate([{ fieldType: " ", correct: true }])).toThrow();
  });
});
