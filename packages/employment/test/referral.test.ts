import { describe, expect, it, vi } from "vitest";
import { EMPTY_COMMUTE_INPUTS, checkCommute } from "../src/commute.js";
import { DEMONSTRATION_LISTING_RECORDS } from "../src/data.js";
import { NOTE_LIMIT, buildReferralSummary, referralText } from "../src/referral.js";
import type { ReferralConsent } from "../src/referral.js";

const record = DEMONSTRATION_LISTING_RECORDS[2]!;
const all: ReferralConsent = { include: { listing: true, accessFacts: true, commute: true, note: true }, confirmed: true };
const none = { listing: false, accessFacts: false, commute: false, note: false };
const createdOn = "2026-11-16";

describe("referral hand-off summary", () => {
  it("produces nothing without explicit consent", () => {
    expect(buildReferralSummary({ record, createdOn, consent: { ...all, confirmed: false } })).toEqual({ ok: false, reason: "consent-not-confirmed" });
    expect(buildReferralSummary({ record, createdOn, consent: { ...all, confirmed: "yes" as unknown as boolean } })).toEqual({ ok: false, reason: "consent-not-confirmed" });
  });

  it("needs at least one chosen item, and an empty note is not an item", () => {
    expect(buildReferralSummary({ record, createdOn, consent: { include: none, confirmed: true } })).toEqual({ ok: false, reason: "nothing-selected" });
    expect(buildReferralSummary({ record, createdOn, note: "   ", consent: { include: { ...none, note: true }, confirmed: true } })).toEqual({ ok: false, reason: "nothing-selected" });
  });

  it("rejects an over-long note and an unreadable date", () => {
    expect(buildReferralSummary({ record, createdOn, note: "x".repeat(NOTE_LIMIT + 1), consent: all })).toEqual({ ok: false, reason: "note-too-long" });
    expect(buildReferralSummary({ record, createdOn: "16/11/2026", consent: all })).toEqual({ ok: false, reason: "invalid-date" });
  });

  it("includes only the sections the person chose", () => {
    const result = buildReferralSummary({ record, createdOn, note: "Private note", consent: { include: { ...none, listing: true }, confirmed: true } });
    if (!result.ok) throw new Error(result.reason);
    expect(Object.keys(result.summary.sections)).toEqual(["listing"]);
    expect(result.summary.omitted).toEqual(["accessFacts", "commute", "note"]);
    expect(JSON.stringify(result.summary)).not.toContain("Private note");
    expect(referralText(result.summary, "en")).not.toContain("Private note");
  });

  it("states that the App sent nothing and assessed no eligibility", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const commute = checkCommute({ ...EMPTY_COMMUTE_INPUTS, travelMinutes: 50, maxMinutes: 60 }, record);
    const result = buildReferralSummary({ record, createdOn, commute, note: " Available weekdays. ", consent: all });
    vi.unstubAllGlobals();
    if (!result.ok) throw new Error(result.reason);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.summary).toMatchObject({ sentByApp: false, eligibilityAssessed: false, createdOn, omitted: [] });
    expect(result.summary.sections.note).toBe("Available weekdays.");
    expect(result.summary.sections.accessFacts).toMatchObject({ verified: false, label: "unverified-record-attached" });
    expect(result.summary.sections.commute).toMatchObject({ completed: true, routeConfirmed: false });
    const en = referralText(result.summary, "en");
    expect(en).toContain("a partner organisation’s employment programme");
    expect(en).toContain("The App sent nothing");
    expect(en).toContain("Accessible washroom: Unknown");
    expect(en).toContain("Step-free entry: Yes (Source: Demonstration fixture");
    expect(en).toContain("Demonstration listing — not a verified vacancy.");
    expect(en).toContain("Available weekdays.");
    const fr = referralText(result.summary, "fr");
    expect(fr).toContain("le programme d’emploi d’un organisme partenaire");
    expect(fr).toContain("Toilettes accessibles : Inconnu");
  });

  it("keeps a listing without an access record Unknown and says a commute check was not done", () => {
    const result = buildReferralSummary({ record: DEMONSTRATION_LISTING_RECORDS[0]!, createdOn, consent: { include: { ...none, accessFacts: true, commute: true }, confirmed: true } });
    if (!result.ok) throw new Error(result.reason);
    const text = referralText(result.summary, "en");
    expect(text).toContain("Unverified — no workplace access record. Access is Unknown.");
    expect(text).toContain("Step-free entry: Unknown (No source: there is no access record for this workplace.)");
    expect(text).toContain("No commute check was completed.");
    expect(text).toContain("Left out by the person’s choice: listing, note");
  });

  it("does not alias the source record", () => {
    const result = buildReferralSummary({ record, createdOn, consent: all, note: "n" });
    if (!result.ok) throw new Error(result.reason);
    result.summary.sections.listing!.title.en = "changed";
    result.summary.sections.accessFacts!.facts[0]!.provenance!.source = "changed";
    expect(record.listing.title.en).not.toBe("changed");
    expect(record.accessRecord!.stepFreeEntry.source).not.toBe("changed");
  });
});
