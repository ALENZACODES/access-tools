import { describe, expect, it } from "vitest";
import { appendChange, appendCorrection, emptyLog, readLog, writeLog } from "./corrections.js";
import { fixturePack, FIXTURE_DAY, FIXTURE_PROVENANCE, placeById } from "./fixtures.js";
import { formatMm } from "./format.js";
import { isOpenAt } from "./hours.js";
import { lintPack, lintPlace } from "./lint.js";
import { coreFieldIdList, FIELD_COUNTS, projectPlace } from "./project.js";
import { rangeNote, useLabelText, washroomUseLabel } from "./recommend.js";
import { schemaErrors, validatePlacePack } from "./schema.js";
import { evidenceComplete } from "./evidence.js";
import { COPY, assertFrenchCatalog } from "./i18n.js";
import { freshness, tierPhrase } from "./staleness.js";
import { unknown } from "./blank.js";
import type { Provenance, SurveyEvidence } from "./types.js";

const SURVEY_EVIDENCE: SurveyEvidence = {
  protocolVersion: "survey-protocol-1",
  verifierRole: "trained_verifier",
  method: "tape measure on site",
  observedAt: "2026-11-01",
  photoIds: ["photo-door"],
};

function surveyProvenance(evidence?: SurveyEvidence): Provenance {
  return {
    sourceName: "specimen survey",
    sourceId: "specimen-survey",
    licence: "specimen",
    sourceDate: "2026-11-01",
    recordDate: "2026-11-01",
    retrievedAt: "2026-11-01",
    tier: 3,
    verifierType: "surveyor",
    ...(evidence ? { evidence, prototypeLabel: "VERIFIED" as const } : {}),
  };
}

describe("field catalogue", () => {
  it("matches the section 5.2 core arithmetic", () => {
    expect(FIELD_COUNTS.entrance).toBe(12);
    expect(FIELD_COUNTS.washroom).toBe(14);
    expect(FIELD_COUNTS.interior).toBe(7);
    expect(FIELD_COUNTS.parking).toBe(8);
    expect(FIELD_COUNTS.transport).toBe(6);
    expect(FIELD_COUNTS.trust).toBe(8);
    expect(FIELD_COUNTS.identity).toBe(12);
    const core = FIELD_COUNTS.entrance + FIELD_COUNTS.washroom + FIELD_COUNTS.interior + FIELD_COUNTS.parking + FIELD_COUNTS.transport + FIELD_COUNTS.trust;
    expect(core).toBe(55);
    expect(core + FIELD_COUNTS.identity).toBe(67);
    expect(coreFieldIdList()).toHaveLength(67);
  });
});

describe("fixtures", () => {
  it("validates against the JSON schema and the honesty lint", () => {
    expect(validatePlacePack(fixturePack)).toBe(true);
    expect(schemaErrors()).toEqual([]);
    expect(lintPack(fixturePack)).toEqual([]);
  });

  it("rejects a value that has no provenance", () => {
    const place = structuredClone(placeById("fix-cafe"));
    if (!place) throw new Error("missing cafe");
    place.entrance.stepCount = { value: 4, provenance: null, photoSlotIds: [] };
    expect(lintPlace(place).some((error) => error.includes("without provenance"))).toBe(true);
  });

  it("rejects a pack record that drops the licence", () => {
    const broken = structuredClone(fixturePack);
    broken.places[0]!.recordProvenance.licence = "";
    expect(validatePlacePack(broken)).toBe(false);
  });

  it("does not name real venues", () => {
    const text = JSON.stringify(fixturePack);
    for (const banned of ["Rogers Centre", "Union Station", "Toronto General", "AccessNow", "SCIO"]) {
      expect(text).not.toContain(banned);
    }
  });
});

describe("display rules", () => {
  it("labels a null measurement Unknown and shows millimetres with inches", () => {
    expect(formatMm(null, "en")).toBe("Unknown");
    expect(formatMm(null, "fr")).toBe("Inconnu");
    expect(formatMm(900, "en")).toBe("900 mm (35.4 in)");
  });

  it("never calls a fixture verified by a surveyor", () => {
    const place = placeById("fix-community-centre");
    if (!place) throw new Error("missing");
    const view = projectPlace(place, "en", FIXTURE_DAY, fixturePack);
    const text = JSON.stringify(view);
    expect(text).toContain("PROTOTYPE-UNVERIFIED");
    expect(text).not.toContain("PROTOTYPE and UNVERIFIED");
    expect(text).not.toContain("Verified by surveyor");
    expect(text.toLowerCase()).not.toContain("open data");
    expect(text.toLowerCase()).not.toContain("open-data");
    expect(view.tierBadge).toContain("Unverified by the App");
    expect(view.tierBadge).not.toContain("Tier 0");
    const door = view.sections.find((section) => section.id === "entrance")?.rows.find((row) => row.id === "entrance.door-clear-width-mm");
    expect(door?.valueText).toBe("860 mm (33.9 in)");
    expect(door?.sourceName).toBe("access-tools labelled fixture");
    expect(door?.sourceDate).toBe(FIXTURE_DAY);
  });

  it("never shows verified wording without tier 3 evidence", () => {
    const bare = surveyProvenance();
    expect(evidenceComplete(bare.evidence)).toBe(false);
    expect(tierPhrase(bare, "access-maps", "en", "canonical")).not.toContain("Verified by surveyor");
    expect(tierPhrase(bare, "access-maps", "fr", "canonical")).not.toContain("Vérifié par un enquêteur");
    expect(tierPhrase(bare, "labelled-fixture", "en", "prototype")).toContain("PROTOTYPE-UNVERIFIED");
    const proven = surveyProvenance(SURVEY_EVIDENCE);
    expect(tierPhrase(proven, "access-maps", "en", "canonical")).toBe("Verified by surveyor");
    expect(tierPhrase(proven, "access-maps", "en", "prototype")).not.toContain("Verified by surveyor");
    expect(tierPhrase(FIXTURE_PROVENANCE, "labelled-fixture", "en")).not.toContain("open data");
    expect(tierPhrase(FIXTURE_PROVENANCE, "labelled-fixture", "fr")).not.toContain("données ouvertes");
  });

  it("rejects a nested sourced field whose provenance tier is bogus", () => {
    const broken = structuredClone(fixturePack);
    const place = broken.places[0]!;
    place.entrance.stepCount = {
      value: 1,
      provenance: { tier: "bogus" } as unknown as typeof place.entrance.stepCount.provenance,
      photoSlotIds: [],
    };
    expect(validatePlacePack(broken)).toBe(false);
    expect(schemaErrors().join(" ")).toMatch(/tier|provenance|required/i);
  });

  it("rejects a tier 3 record that has no evidence", () => {
    const broken = structuredClone(fixturePack);
    const place = broken.places[0]!;
    place.datasetStatus = "access-maps";
    place.publicationContext = "canonical";
    place.recordProvenance = surveyProvenance();
    expect(validatePlacePack(broken)).toBe(false);
    expect(schemaErrors().join(" ")).toMatch(/evidence|required/i);
    expect(lintPlace(place).some((error) => error.includes("cannot be shown as verified"))).toBe(true);
    place.recordProvenance = surveyProvenance(SURVEY_EVIDENCE);
    expect(lintPlace(place).some((error) => error.includes("cannot be shown as verified"))).toBe(false);
  });

  it("shows Unknown on the café and does not render trail fields there", () => {
    const cafe = placeById("fix-cafe");
    if (!cafe) throw new Error("missing");
    const view = projectPlace(cafe, "en", FIXTURE_DAY);
    const entrance = view.sections.find((section) => section.id === "entrance");
    expect(entrance?.rows.find((row) => row.id === "entrance.door-clear-width-mm")?.valueText).toBe("Unknown");
    expect(view.sections.some((section) => section.id === "trail")).toBe(false);
  });

  it("states the skeleton gap without a depth claim", () => {
    const seed = placeById("skel-thunder-bay");
    if (!seed) throw new Error("missing");
    const view = projectPlace(seed, "en", FIXTURE_DAY);
    expect(view.depthStatement).toContain("Skeleton seed for Thunder Bay");
    expect(view.depthStatement).toContain("absent from this seed");
    expect(view.depthStatement?.toLowerCase()).not.toContain("toronto-level");
  });

  it("shows a hoist without a sling as not provided", () => {
    const place = placeById("fix-change-hoist");
    if (!place) throw new Error("missing");
    const view = projectPlace(place, "en", FIXTURE_DAY);
    const hoist = view.washrooms[0]?.rows.find((row) => row.id === "washroom.hoist");
    expect(hoist?.valueText).toContain("Hoist recorded as present");
    expect(hoist?.valueText).toContain("not provided");
    expect(washroomUseLabel(place.datasetStatus, place.washrooms[0]!)).toBe("not-a-recommendation");
    expect(useLabelText("not-a-recommendation", "en")).toContain("call ahead");
  });

  it("does not state a parking privilege without a bylaw", () => {
    const place = placeById("fix-community-centre");
    if (!place) throw new Error("missing");
    const view = projectPlace(place, "en", FIXTURE_DAY);
    const bay = view.bays[0];
    expect(bay?.privilegeText).toContain("unknown");
    expect(bay?.privilegeText.toLowerCase()).not.toContain("free parking");
  });
});

describe("freshness and hours", () => {
  it("marks a year-old surveyor field stale and still describable", () => {
    const provenance: Provenance = {
      sourceName: "specimen",
      sourceId: "specimen",
      licence: "specimen",
      sourceDate: "2024-01-01",
      recordDate: "2024-01-01",
      retrievedAt: "2024-01-01",
      tier: 3,
      verifierType: "surveyor",
      evidence: { ...SURVEY_EVIDENCE, observedAt: "2024-01-01" },
    };
    const result = freshness(provenance, "2026-11-13", "venue", "en");
    expect(result.state).toBe("stale");
    expect(result.text).toContain("stays visible");
  });

  it("treats open-now as unknown when hours are missing", () => {
    expect(isOpenAt(null, { day: 1, minutes: 10 * 60 })).toBe("unknown");
    expect(isOpenAt([{ day: 1, open: "09:00", close: "17:00" }], { day: 1, minutes: 10 * 60 })).toBe("open");
    expect(isOpenAt([{ day: 1, open: "09:00", close: "17:00" }], { day: 1, minutes: 18 * 60 })).toBe("closed");
  });

  it("turns an old live feed into unknown", () => {
    const provenance: Provenance = {
      sourceName: "specimen feed",
      sourceId: "specimen-feed",
      licence: "specimen",
      sourceDate: "2026-01-01",
      recordDate: "2026-01-01",
      retrievedAt: "2026-01-01",
      tier: 4,
      verifierType: "operator-feed",
      observedAt: "2026-01-01T12:00:00Z",
    };
    const result = freshness(provenance, "2026-11-13T12:00:00Z", "charging", "en");
    expect(result.state).toBe("live-age-unknown");
    expect(result.text.toLowerCase()).toContain("unknown");
    expect(result.text).not.toContain("30-day");
    expect(result.text.toLowerCase()).not.toContain("within");
  });

  it("keeps a live feed only inside a two-hour window with an expiry", () => {
    const provenance: Provenance = {
      sourceName: "specimen feed",
      sourceId: "specimen-feed",
      licence: "specimen",
      sourceDate: "2026-11-13",
      recordDate: "2026-11-13",
      retrievedAt: "2026-11-13",
      tier: 4,
      verifierType: "operator-feed",
      observedAt: "2026-11-13T10:00:00Z",
      expiresAt: "2026-11-13T12:00:00Z",
    };
    const fresh = freshness(provenance, "2026-11-13T11:00:00Z", "charging", "en");
    expect(fresh.state).toBe("within-estimate");
    expect(fresh.text).toContain("2-hour");
    expect(fresh.text.toLowerCase()).not.toContain("unknown");
    const stale = freshness(provenance, "2026-11-13T13:00:00Z", "charging", "en");
    expect(stale.state).toBe("live-age-unknown");
    expect(stale.text.toLowerCase()).toContain("unknown");
    expect(stale.text).not.toContain("30-day");
    const french = freshness({ ...provenance, observedAt: "2026-10-01T12:00:00Z" }, "2026-11-13T12:00:00Z", "charging", "fr");
    expect(french.text).toContain("inconnu");
    expect(french.text).not.toContain("30 jours");
  });

  it("refuses a generic in-range claim", () => {
    const note = rangeNote(1200, 5000, "en");
    expect(note).toContain("not a guarantee");
    expect(note?.toLowerCase()).not.toContain("in range");
  });
});

describe("corrections", () => {
  it("stores a pending correction without changing the place", () => {
    const place = placeById("fix-cafe");
    if (!place) throw new Error("missing");
    const before = JSON.stringify(place);
    const log = appendCorrection(
      emptyLog(),
      { placeId: place.id, fieldId: "entrance.door-clear-width-mm", suggestedCorrection: "920 mm", note: "" },
      "2026-11-13T15:00:00.000Z",
      "c1",
    );
    expect(JSON.stringify(place)).toBe(before);
    expect(log.corrections[0]?.status).toBe("pending");
    expect(log.corrections[0]?.moderation).toBe("not-running");
    expect(log.corrections[0]?.suggestedCorrection).toBe("920 mm");
  });

  it("round-trips the log through a storage object", () => {
    const memory = new Map<string, string>();
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
    };
    const log = appendChange(
      emptyLog(),
      { placeId: "fix-cafe", targetId: "fix-cafe", problem: "entrance-blocked", note: "fixture" },
      "2026-11-13T15:00:00.000Z",
      "r1",
    );
    writeLog(storage, log);
    expect(readLog(storage).changes[0]?.problem).toBe("entrance-blocked");
  });
});

describe("French catalogue", () => {
  it("has a French string for every copy key", () => {
    expect(() => assertFrenchCatalog(COPY)).not.toThrow();
  });

  it("fails when a French key is blank", () => {
    expect(() => assertFrenchCatalog({ "door.operator.manual": { en: "Manual", fr: " " } })).toThrow(/missing translation keys/);
  });
});

describe("unknown helper", () => {
  it("starts empty", () => {
    expect(unknown<number>()).toEqual({ value: null, provenance: null, photoSlotIds: [] });
  });
});
