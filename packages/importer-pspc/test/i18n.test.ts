// @vitest-environment node
import { describe, expect, it } from "vitest";
import { CATALOG, summaryLine } from "#src/i18n";
import { buildReport, createCounters } from "#src/map";
import { source } from "./helpers";

describe("EN/FR catalog", () => {
  it("renders the summary in both languages", () => {
    expect(summaryLine("en", 71, 71)).toBe("71 buildings read, 71 emitted");
    expect(summaryLine("fr", 71, 71)).toBe("71 bâtiments lus, 71 émis");
  });

  it("adds rejected and skipped counts", () => {
    expect(summaryLine("en", 5, 4, 1, 134)).toBe("5 buildings read, 4 emitted; 1 rejected; 134 skipped (outside Ontario)");
    expect(summaryLine("fr", 5, 4, 1, 134)).toContain("1 rejetés; 134 ignorés");
  });

  it("uses a no-break space before a colon in French", () => {
    expect(CATALOG.fr.held).toContain("licence\u00A0:");
    for (const s of [CATALOG.fr.held, CATALOG.fr.notice, CATALOG.fr.summary(1, 1)]) expect(s).not.toMatch(/[^\u00A0\u202F][:;?!]/);
  });

  it("puts both languages and the held note in the report", () => {
    const c = createCounters();
    const r = buildReport(source, c, { retrievedAt: "2026-11-15", held: true, partitions: [] });
    expect(r.summary.en).toContain("Held by licence");
    expect(r.summary.fr).toContain("Retenu en raison de la licence");
  });
});
