import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { FullConfig, Reporter, TestCase, TestResult } from "playwright/types/testReporter";
import { auditMarkdown, buildAudit, checkIdOf, type RanCheck } from "./audit.js";

function git(args: string[], cwd: string): string {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

/** The build is the REGRESSION_BUILD_ID given to the run, or the commit of this checkout. */
export function buildIdentifier(cwd: string, env: NodeJS.ProcessEnv = process.env): string {
  const given = env.REGRESSION_BUILD_ID?.trim();
  if (given) return given;
  const commit = git(["rev-parse", "--short=12", "HEAD"], cwd);
  if (!commit) return "unrecorded: no REGRESSION_BUILD_ID and no git commit";
  const dirty = git(["status", "--porcelain"], cwd) !== "";
  return dirty ? `commit ${commit} with uncommitted changes` : `commit ${commit}`;
}

export default class RegressionAuditReporter implements Reporter {
  private readonly ran: RanCheck[] = [];
  private root = process.cwd();

  onBegin(config: FullConfig): void {
    this.root = path.resolve(config.rootDir, "..");
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const id = checkIdOf(test.title);
    if (!id) return;
    const consoleErrors = result.attachments
      .filter((attachment) => attachment.name === "console-errors" && attachment.body)
      .flatMap((attachment) => JSON.parse(attachment.body!.toString("utf8")) as string[]);
    // Strip terminal colour codes from Playwright's message.
    const escape = String.fromCharCode(27);
    const message = (result.errors[0]?.message ?? "").split(escape).map((part, index) => (index === 0 ? part : part.replace(/^\[[0-9;]*m/, ""))).join("");
    this.ran.push({
      id,
      passed: result.status === "passed",
      error: result.status === "skipped" ? "Skipped." : message.split("\n")[0] ?? "",
      consoleErrors,
      durationMs: result.duration,
    });
  }

  onEnd(): void {
    if (this.ran.length === 0) return;
    const audit = buildAudit(this.ran, buildIdentifier(this.root), new Date().toISOString());
    const dir = path.join(this.root, "test-results");
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "regression-audit.json"), `${JSON.stringify(audit, null, 2)}\n`);
    writeFileSync(path.join(dir, "regression-audit.md"), auditMarkdown(audit));
    process.stdout.write(`\nRegression audit: ${audit.verdict}. Written to test-results/regression-audit.md\n`);
  }
}
