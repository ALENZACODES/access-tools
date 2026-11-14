import { CONSOLE_RULE, REGRESSION_CHECKS, type RegressionCheck } from "./catalog.js";

export type Outcome = "pass" | "fail" | "not run here" | "not run";

export interface RanCheck {
  id: string;
  passed: boolean;
  /** First line of the failure, or empty. */
  error: string;
  consoleErrors: string[];
  durationMs: number;
}

export interface AuditRow {
  id: string;
  check: string;
  owner: RegressionCheck["owner"];
  outcome: Outcome;
  detail: string;
}

export interface Audit {
  build: string;
  ranAt: string;
  rows: AuditRow[];
  counts: Record<Outcome, number>;
  verdict: "BLOCK" | "NO REGRESSION FOUND HERE";
  statement: string;
}

/** Pull a check id such as R28-04 out of a test title. */
export function checkIdOf(title: string): string | null {
  const match = /\[(R28-\d{2})\]/.exec(title);
  return match ? match[1]! : null;
}

export function buildAudit(ran: readonly RanCheck[], build: string, ranAt: string, checks: readonly RegressionCheck[] = REGRESSION_CHECKS): Audit {
  if (!build.trim()) throw new Error("a build identifier is required");
  const byId = new Map<string, RanCheck>();
  for (const result of ran) {
    const previous = byId.get(result.id);
    // A retry does not hide an earlier failure.
    if (!previous || !result.passed) byId.set(result.id, previous && !previous.passed ? previous : result);
  }
  const rows: AuditRow[] = checks.map((check) => {
    if (check.notRunReason) {
      return { id: check.id, check: check.check, owner: check.owner, outcome: "not run here", detail: check.notRunReason };
    }
    const result = byId.get(check.id);
    if (!result) {
      return { id: check.id, check: check.check, owner: check.owner, outcome: "not run", detail: "No test result was recorded for this check in this run." };
    }
    if (result.passed && result.consoleErrors.length === 0) {
      return { id: check.id, check: check.check, owner: check.owner, outcome: "pass", detail: `Passed in ${Math.round(result.durationMs)} ms.` };
    }
    const parts = [result.error, ...result.consoleErrors.map((line) => `Console: ${line}`)].filter(Boolean);
    return { id: check.id, check: check.check, owner: check.owner, outcome: "fail", detail: parts.join(" ") || "Failed with no message." };
  });
  const counts: Record<Outcome, number> = { pass: 0, fail: 0, "not run here": 0, "not run": 0 };
  for (const row of rows) counts[row.outcome] += 1;
  return {
    build,
    ranAt,
    rows,
    counts,
    verdict: counts.fail > 0 || counts["not run"] > 0 ? "BLOCK" : "NO REGRESSION FOUND HERE",
    statement: `${CONSOLE_RULE} Checks owned by another repository are not re-run here and earlier evidence is not reused. This table does not cover the whole App.`,
  };
}

function cell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export function auditMarkdown(audit: Audit): string {
  const lines = [
    "# Post-demo regression audit, access-tools",
    "",
    `Build: ${cell(audit.build)}`,
    `Run at: ${audit.ranAt}`,
    `Result here: **${audit.verdict}**. Pass ${audit.counts.pass}, fail ${audit.counts.fail}, not run here ${audit.counts["not run here"]}, not run ${audit.counts["not run"]}.`,
    "",
    audit.statement,
    "",
    "| Check | What passes | Owner | Outcome | Detail |",
    "| --- | --- | --- | --- | --- |",
    ...audit.rows.map((row) => `| ${row.id} | ${cell(row.check)} | ${row.owner} | ${row.outcome} | ${cell(row.detail)} |`),
  ];
  return `${lines.join("\n")}\n`;
}
