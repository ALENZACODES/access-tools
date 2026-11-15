import { describe, expect, it } from "vitest";
import { auditRecords, freshness, recordManualCheck } from "../src/audit.js";
import { demonstrationRecords } from "../src/fixtures.js";
import type { DirectoryLike } from "../src/types.js";

const today = "2026-11-15";

describe("90-day manual freshness audit", () => {
  it("distinguishes current, ageing, stale and undated demonstration records", () => {
    const statuses = auditRecords(demonstrationRecords, today).map((item) => item.status);
    expect(statuses).toEqual(["current", "stale", "missing", "ageing"]);
    expect(freshness("2026-09-16", today).status).toBe("current");
    expect(freshness("2026-08-17", today).status).toBe("ageing");
    expect(freshness("2026-08-16", today).status).toBe("stale");
    expect(freshness("2026-99-99", today).status).toBe("missing");
    expect(freshness("2026-11-16", today).status).toBe("missing");
  });
  it("hides stale and undated rates, including after a record-only manual update", () => {
    const audited = auditRecords(demonstrationRecords, today);
    expect(audited[0]?.figureVisible).toBe(true);
    expect(audited[1]?.figureVisible).toBe(false);
    expect(audited[2]?.figureVisible).toBe(false);
    const stale = demonstrationRecords[1] as DirectoryLike;
    const updated = recordManualCheck(stale, today, today);
    expect(auditRecords([updated], today)[0]?.status).toBe("current");
    expect(auditRecords([updated], today)[0]?.figureVisible).toBe(false);
    expect(stale.checkedOn).toBe("2026-06-01");
  });
  it("uses the directory source date as a fallback and refuses future manual checks", () => {
    const record = { ...demonstrationRecords[0]!, checkedOn: undefined, retrievedOn: "2026-06-01" };
    expect(auditRecords([record], today)[0]?.status).toBe("stale");
    expect(() => recordManualCheck(record, "2026-11-16", today)).toThrow();
  });
});
