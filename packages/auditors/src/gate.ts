/**
 * Human-review error gate for automatically proposed values.
 *
 * A proposal source may publish a field type only when people have reviewed at
 * least the minimum number of sampled proposals for that field type and the
 * share found wrong is under the limit. Too few samples is a block, not a pass.
 * The figures come only from the review samples passed in.
 */
export interface ReviewedSample {
  fieldType: string;
  /** True when the reviewer found the proposed value correct. */
  correct: boolean;
}
export interface GateRules {
  minSamples: number;
  /** Exclusive upper bound on the error share, between 0 and 1. */
  maxErrorRate: number;
}
export const DEFAULT_GATE_RULES: GateRules = { minSamples: 100, maxErrorRate: 0.05 };

export type GateOutcome = "pass" | "blocked-too-few-samples" | "blocked-error-rate";
export interface GateResult {
  fieldType: string;
  sampled: number;
  errors: number;
  /** Null when nothing was sampled. */
  errorRate: number | null;
  outcome: GateOutcome;
}

/** One result per field type seen in the samples, in name order. */
export function extractionGate(samples: readonly ReviewedSample[], rules: GateRules = DEFAULT_GATE_RULES): GateResult[] {
  if (!(rules.minSamples >= 1) || !(rules.maxErrorRate > 0 && rules.maxErrorRate <= 1)) throw new Error("Invalid gate rules");
  const byType = new Map<string, { sampled: number; errors: number }>();
  for (const sample of samples) {
    if (!sample.fieldType.trim()) throw new Error("A sample needs a field type");
    const row = byType.get(sample.fieldType) ?? { sampled: 0, errors: 0 };
    row.sampled += 1;
    if (!sample.correct) row.errors += 1;
    byType.set(sample.fieldType, row);
  }
  return [...byType.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fieldType, row]): GateResult => {
      const errorRate = row.sampled === 0 ? null : row.errors / row.sampled;
      const outcome: GateOutcome =
        row.sampled < rules.minSamples ? "blocked-too-few-samples"
          : (errorRate as number) < rules.maxErrorRate ? "pass" : "blocked-error-rate";
      return { fieldType, sampled: row.sampled, errors: row.errors, errorRate, outcome };
    });
}

/** A field type may publish only with a passing result. A field type with no samples has no result and may not publish. */
export function mayPublish(results: readonly GateResult[], fieldType: string): boolean {
  return results.some((result) => result.fieldType === fieldType && result.outcome === "pass");
}
