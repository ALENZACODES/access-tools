import { describe, expect, it } from "vitest";
import { auditMarkdown, buildAudit, checkIdOf, type RanCheck } from "./audit.js";
import { REGRESSION_CHECKS } from "./catalog.js";
import { buildIdentifier } from "./reporter.js";

const HERE = REGRESSION_CHECKS.filter((check) => !check.notRunReason).map((check) => check.id);

function passed(id: string): RanCheck {
  return { id, passed: true, error: "", consoleErrors: [], durationMs: 10 };
}

describe("regression audit", () => {
  it("reads the check id from a test title", () => {
    expect(checkIdOf("[R28-04] keyboard input")).toBe("R28-04");
    expect(checkIdOf("no id here")).toBeNull();
  });

  it("has unique ids and gives a reason for every check run elsewhere", () => {
    expect(new Set(REGRESSION_CHECKS.map((check) => check.id)).size).toBe(REGRESSION_CHECKS.length);
    for (const check of REGRESSION_CHECKS) {
      if (check.owner !== "access-tools") expect(check.notRunReason, check.id).toBeTruthy();
      else expect(check.notRunReason, check.id).toBeUndefined();
    }
  });

  it("reports no regression only when every local check passed", () => {
    const audit = buildAudit(HERE.map(passed), "commit abc", "2026-11-14T00:00:00Z");
    expect(audit.verdict).toBe("NO REGRESSION FOUND HERE");
    expect(audit.counts).toEqual({ pass: HERE.length, fail: 0, "not run here": REGRESSION_CHECKS.length - HERE.length, "not run": 0 });
  });

  it("blocks when a local check was not run", () => {
    const audit = buildAudit(HERE.slice(1).map(passed), "commit abc", "2026-11-14T00:00:00Z");
    expect(audit.verdict).toBe("BLOCK");
    expect(audit.rows.find((row) => row.id === HERE[0])?.outcome).toBe("not run");
  });

  it("fails a passing test that logged a console error", () => {
    const ran = HERE.map(passed);
    ran[0] = { ...ran[0]!, consoleErrors: ["TypeError: x is undefined"] };
    const audit = buildAudit(ran, "commit abc", "2026-11-14T00:00:00Z");
    expect(audit.verdict).toBe("BLOCK");
    expect(audit.rows[0]).toMatchObject({ outcome: "fail", detail: "Console: TypeError: x is undefined" });
  });

  it("keeps a failure when a retry later passes", () => {
    const ran = [...HERE.map(passed), { id: HERE[0]!, passed: false, error: "Timed out", consoleErrors: [], durationMs: 5 }, passed(HERE[0]!)];
    const row = buildAudit(ran, "commit abc", "2026-11-14T00:00:00Z").rows[0]!;
    expect(row).toMatchObject({ outcome: "fail", detail: "Timed out" });
  });

  it("requires a build identifier and prints it", () => {
    expect(() => buildAudit([], " ", "2026-11-14T00:00:00Z")).toThrow(/build/);
    const markdown = auditMarkdown(buildAudit(HERE.map(passed), "build | 7", "2026-11-14T00:00:00Z"));
    expect(markdown).toContain("Build: build \\| 7");
    expect(markdown).toContain("| R28-10 |");
    expect(markdown).toContain("not run here");
    expect(markdown).toContain("This table does not cover the whole App.");
  });

  it("takes the build from the environment before git", () => {
    expect(buildIdentifier(process.cwd(), { REGRESSION_BUILD_ID: "rc-3" })).toBe("rc-3");
    expect(buildIdentifier("/", {})).toMatch(/^unrecorded|^commit /);
  });
});
