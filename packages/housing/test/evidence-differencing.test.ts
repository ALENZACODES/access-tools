import { describe, expect, it } from "vitest";
import {
  BARRIER_TYPES, SUPPRESSION_THRESHOLD, aggregateEvidence, suppressCounts, suppressOverlapping,
} from "../src/evidence.js";
import type { BarrierType, EvidenceAggregate, EvidenceReport } from "../src/evidence.js";

/**
 * Barrier counts overlap: one report can name several barriers. These tests
 * check that a published barrier count never lets a reader work out a small
 * count by subtracting it from the published total.
 *
 * The property tests draw many report sets from a seeded generator, so a
 * failure can be repeated from its seed.
 */

/** Small seeded generator (mulberry32), so each case is repeatable. */
function generator(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function report(barriers: BarrierType[]): EvidenceReport {
  return { schemaVersion: "housing-evidence-1", category: "applied", setting: "dwelling", waitBand: "unknown", barriers: [...barriers].sort(), period: "2026-Q4" };
}

/** A random set of reports. Each barrier has its own chance of being named, so some are common, some rare, some universal. */
function randomReports(seed: number): EvidenceReport[] {
  const random = generator(seed);
  const size = Math.floor(random() * 41);
  const chance = BARRIER_TYPES.map(() => {
    const kind = random();
    if (kind < 0.15) return 1;
    if (kind < 0.3) return 0;
    if (kind < 0.5) return 0.9 + random() * 0.1;
    if (kind < 0.7) return random() * 0.1;
    return random();
  });
  return Array.from({ length: size }, () => report(BARRIER_TYPES.filter((_, index) => random() < (chance[index] ?? 0))));
}

function trueCounts(reports: readonly EvidenceReport[]): Record<BarrierType, number> {
  const counts = Object.fromEntries(BARRIER_TYPES.map((item) => [item, 0])) as Record<BarrierType, number>;
  for (const item of reports) for (const barrier of item.barriers) counts[barrier] += 1;
  return counts;
}

/** Every number a reader can get from the published barrier cells and total by one subtraction. */
function derivable(result: EvidenceAggregate): number[] {
  if (result.total === null) return [];
  const numbers: number[] = [];
  for (const barrier of BARRIER_TYPES) {
    const cell = result.byBarrier[barrier];
    if (cell !== null) numbers.push(result.total - cell);
  }
  return numbers;
}

const SEEDS = Array.from({ length: 600 }, (_, index) => index + 1);
const small = (value: number, threshold: number): boolean => value > 0 && value < threshold;

describe("overlapping cells beside a total", () => {
  it("withholds a cell when the total minus the cell is 1 to 4", () => {
    // 12 reports, 9 named the barrier: publishing 9 would show that 3 did not.
    expect(suppressOverlapping({ a: 9 }, 12)).toEqual({ a: null });
    expect(suppressOverlapping({ a: 8 }, 12)).toEqual({ a: null });
    expect(suppressOverlapping({ a: 11 }, 12)).toEqual({ a: null });
    // 7 did not name it: both sides are 5 or more.
    expect(suppressOverlapping({ a: 5 }, 12)).toEqual({ a: 5 });
    expect(suppressOverlapping({ a: 7 }, 12)).toEqual({ a: 7 });
    // Every report named it: the remainder is zero, as with a cell that equals its total.
    expect(suppressOverlapping({ a: 12 }, 12)).toEqual({ a: 12 });
  });

  it("still withholds small cells and zero", () => {
    expect(suppressOverlapping({ a: 0, b: 1, c: 4, d: 5 }, 20)).toEqual({ a: null, b: null, c: null, d: 5 });
  });

  it("withholds every cell when the total is withheld", () => {
    expect(suppressOverlapping({ a: 4, b: 3 }, 4)).toEqual({ a: null, b: null });
    expect(suppressOverlapping({ a: 6 }, 6, 10)).toEqual({ a: null });
  });

  it("withholds a count that cannot be right", () => {
    expect(suppressOverlapping({ a: 13, b: -1, c: 6.5, d: Number.NaN }, 12)).toEqual({ a: null, b: null, c: null, d: null });
    expect(suppressOverlapping({ a: 6 }, Number.NaN)).toEqual({ a: null });
  });

  it("checks every total up to 40 and every count up to the total, at thresholds 5, 7 and 10", () => {
    for (const threshold of [5, 7, 10]) {
      for (let total = 0; total <= 40; total += 1) {
        for (let count = 0; count <= total; count += 1) {
          const cell = suppressOverlapping({ a: count }, total, threshold).a;
          const safe = total >= threshold && count >= threshold && !small(total - count, threshold);
          expect(cell, `threshold ${threshold}, total ${total}, count ${count}`).toBe(safe ? count : null);
        }
      }
    }
  });
});

describe("barrier counts in the aggregate: property tests", () => {
  it("never publishes a barrier count that, taken from the total, leaves 1 to 4", () => {
    for (const seed of SEEDS) {
      const result = aggregateEvidence(randomReports(seed));
      for (const value of derivable(result)) expect(small(value, SUPPRESSION_THRESHOLD), `seed ${seed}: total minus a cell = ${value}`).toBe(false);
    }
  });

  it("holds at a higher threshold as well", () => {
    for (const seed of SEEDS) {
      for (const threshold of [7, 10]) {
        const result = aggregateEvidence(randomReports(seed), threshold);
        expect(result.threshold).toBe(threshold);
        for (const value of derivable(result)) expect(small(value, threshold), `seed ${seed}, threshold ${threshold}`).toBe(false);
        for (const barrier of BARRIER_TYPES) {
          const cell = result.byBarrier[barrier];
          if (cell !== null) expect(cell).toBeGreaterThanOrEqual(threshold);
        }
      }
    }
  });

  it("publishes only true counts of 5 or more, and nothing when the total is withheld", () => {
    for (const seed of SEEDS) {
      const reports = randomReports(seed);
      const truth = trueCounts(reports);
      const result = aggregateEvidence(reports);
      for (const barrier of BARRIER_TYPES) {
        const cell = result.byBarrier[barrier];
        if (cell === null) continue;
        expect(result.total, `seed ${seed}`).not.toBeNull();
        expect(cell, `seed ${seed} ${barrier}`).toBe(truth[barrier]);
        expect(cell).toBeGreaterThanOrEqual(SUPPRESSION_THRESHOLD);
      }
      if (reports.length < SUPPRESSION_THRESHOLD) {
        expect(result.total).toBeNull();
        expect(Object.values(result.byBarrier).every((cell) => cell === null)).toBe(true);
      }
    }
  });

  it("only ever withholds more than primary suppression does, and withholds exactly the unsafe cells", () => {
    let extra = 0;
    for (const seed of SEEDS) {
      const reports = randomReports(seed);
      const truth = trueCounts(reports);
      const primary = suppressCounts(truth);
      const result = aggregateEvidence(reports);
      for (const barrier of BARRIER_TYPES) {
        const cell = result.byBarrier[barrier];
        if (primary[barrier] === null) expect(cell, `seed ${seed} ${barrier}`).toBeNull();
        const safe = reports.length >= SUPPRESSION_THRESHOLD && truth[barrier] >= SUPPRESSION_THRESHOLD && !small(reports.length - truth[barrier], SUPPRESSION_THRESHOLD);
        expect(cell === null, `seed ${seed} ${barrier}`).toBe(!safe);
        if (primary[barrier] !== null && cell === null) extra += 1;
      }
    }
    // The generated sets do reach the case this protection is for.
    expect(extra).toBeGreaterThan(50);
  });

  it("gives the same cells whatever order the reports are in", () => {
    for (const seed of SEEDS.slice(0, 100)) {
      const reports = randomReports(seed);
      expect(aggregateEvidence([...reports].reverse())).toEqual(aggregateEvidence(reports));
    }
  });

  it("covers the worked example: 12 reports, 9 with entrance steps", () => {
    const reports = [
      ...Array.from({ length: 9 }, () => report(["entrance-steps", "narrow-doorway"])),
      ...Array.from({ length: 3 }, () => report(["narrow-doorway"])),
    ];
    const result = aggregateEvidence(reports);
    expect(result.total).toBe(12);
    // 12 - 9 = 3 reports without entrance steps: the 9 is withheld.
    expect(result.byBarrier["entrance-steps"]).toBeNull();
    // Every report named a narrow doorway: nothing is left over to work out.
    expect(result.byBarrier["narrow-doorway"]).toBe(12);
  });
});
