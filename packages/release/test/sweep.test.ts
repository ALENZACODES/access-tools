import { describe, expect, it } from "vitest";
import * as finders from "../../finders/src/index.js";
import * as games from "../../games/src/index.js";
import * as navigator from "../../navigator/src/index.js";
import * as place from "../../place/src/index.js";
import * as search from "../../search/src/index.js";
import * as timing from "../../timing/src/index.js";
import { FINDER_COPY } from "../../finders/src/i18n.js";
import { GAME_COPY } from "../../games/src/i18n.js";
import { DIRECTORY_COPY } from "../../navigator/src/i18n.js";
import { COPY } from "../../place/src/i18n.js";
import { SEARCH_COPY } from "../../search/src/i18n.js";
import { TIMING_COPY } from "../../timing/src/i18n.js";
import { collectStrings, OVERCLAIM_RULES, sweep } from "../src/index.js";

const PACKAGES = { finders, games, navigator, place, search, timing };
const CATALOGS: Record<string, Record<string, { en: string; fr: string }>> = {
  finders: FINDER_COPY,
  games: GAME_COPY,
  navigator: DIRECTORY_COPY,
  place: COPY,
  search: SEARCH_COPY,
  timing: TIMING_COPY,
};

/**
 * Hits read by a person and kept. Each describes a program in the words of
 * its official page, as a sourced directory summary. None says the App is
 * endorsed by anyone.
 */
const REVIEWED: Array<{ where: string; rule: string; reason: string }> = [
  {
    where: "navigator.DIRECTORY[17].summary.en",
    rule: "endorsement",
    reason: "Quotes who administers the program, per its official page. Not a claim about the App.",
  },
  {
    where: "navigator.DIRECTORY[17].summary.fr",
    rule: "endorsement-fr",
    reason: "French of the same sourced summary.",
  },
];

const ALL = Object.entries(PACKAGES).flatMap(([name, module]) => collectStrings(module, name));
const CATALOG_STRINGS = Object.entries(CATALOGS).flatMap(([name, catalog]) => collectStrings(catalog, `${name}.copy`));

describe("Day 24 endorsement sweep", () => {
  it("reaches every package's copy, records, and boundary notices", () => {
    expect(ALL.length).toBeGreaterThan(1000);
    for (const name of Object.keys(PACKAGES)) {
      const reached = [...ALL, ...CATALOG_STRINGS].some(([where]) => where.startsWith(`${name}.`));
      expect(reached, name).toBe(true);
    }
    expect(CATALOG_STRINGS.length).toBeGreaterThan(400);
  });

  it("finds no endorsement, verified, guarantee, live, medical, eligibility, or AI claim", () => {
    const hits = sweep([...ALL, ...CATALOG_STRINGS]).filter(
      (hit) => !REVIEWED.some((allowed) => allowed.where === hit.where && allowed.rule === hit.rule),
    );
    expect(hits).toEqual([]);
  });

  it("keeps each reviewed exception tied to a sourced directory summary", () => {
    for (const allowed of REVIEWED) {
      const text = ALL.find(([where]) => where === allowed.where)?.[1];
      expect(text, allowed.where).toBeTypeOf("string");
      expect(sweep([[allowed.where, text ?? ""]]).map((hit) => hit.rule), allowed.where).toContain(allowed.rule);
    }
  });

  it("catches the claims it is meant to catch and leaves honest wording alone", () => {
    const bad = [
      "Endorsed by Spinal Cord Injury Ontario",
      "Application officielle de SCIO",
      "Verified accessible washroom",
      "Fiches vérifiées",
      "Lieu vérifié",
      "Fully accessible entrance",
      "Real-time elevator status",
      "This game improves memory",
      "You qualify for this program",
      "Built with AI",
      "Conçu avec l'IA",
    ];
    for (const sample of bad) expect(sweep([["sample", sample]]), sample).not.toEqual([]);
    const fine = [
      "Unverified by the App.",
      "Non vérifié par l'application.",
      "The App does not decide whether you qualify.",
      "Desk check, tier administrator_page.",
      "Verification date",
    ];
    for (const sample of fine) expect(sweep([["sample", sample]]), sample).toEqual([]);
  });
});

describe("Day 21 and Day 22 copy rules", () => {
  it("has English and French for every catalog key", () => {
    for (const [name, catalog] of Object.entries(CATALOGS)) {
      for (const [key, value] of Object.entries(catalog)) {
        expect(value.en.trim().length, `${name} ${key} en`).toBeGreaterThan(0);
        expect(value.fr.trim().length, `${name} ${key} fr`).toBeGreaterThan(0);
      }
    }
  });

  it("gives every empty or no-match message a next action in both languages", () => {
    const empties = Object.entries(CATALOGS).flatMap(([name, catalog]) =>
      Object.entries(catalog)
        .filter(([key]) => /(^|\.)empty(\.|$)/.test(key) && !key.startsWith("shape."))
        .map(([key, value]) => ({ id: `${name} ${key}`, ...value })),
    );
    expect(empties.length).toBeGreaterThanOrEqual(7);
    for (const message of empties) {
      expect(message.en, message.id).toMatch(/\b(Try|Change|Clear|Show|clear|change|show|try|type)\b/);
      expect(message.fr, message.id).toMatch(/\b(Essayez|Changez|Retirez|Affichez|effacez|retirez|affichez|saisissez|changez)\b/);
    }
  });

  it("checks every rule against something", () => {
    expect(OVERCLAIM_RULES.map((rule) => rule.id)).toContain("ai-mention");
  });
});
