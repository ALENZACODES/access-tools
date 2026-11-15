import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DirectoryLinks } from "../src/DirectoryLinks";
import { catalog } from "../src/catalog";
import { emptyProfile, exportProfileJson, exportProfileText } from "../src/profile";
import { strings } from "../src/strings";

// Synthetic example, not a real person.
const sample = { displayName: "Sample Person", mobilityNotes: "Synthetic example note", attendant: "yes" as const, transferNotes: "" };

const banned = [
  /\byou should\b/i, /\bvous devriez\b/i, /\beligib/i, /\badmissib/i, /\bdiagnos/i, /\bmedical advice\b/i,
  /\bAI\b/, /\bIA\b/, /artificial intelligence/i, /intelligence artificielle/i, /\b(claude|gpt|gemini|llm)\b/i,
];

describe("profile export", () => {
  it("has a stable JSON shape", () => {
    const o = JSON.parse(exportProfileJson(sample, "2026-11-15"));
    expect(Object.keys(o).sort()).toEqual(["exported_at", "fields", "provided_by_person", "schema", "version"]);
    expect(o.schema).toBe("access-tools.assistance-profile");
    expect(Object.keys(o.fields).sort()).toEqual(["attendant", "displayName", "mobilityNotes", "transferNotes"]);
    expect(o.fields.displayName).toBe("Sample Person");
  });
  it("renders empty fields as Unknown / Inconnu in the text sheet", () => {
    expect(exportProfileText(emptyProfile, "en", "2026-11-15")).toContain("Transfer notes: Unknown");
    expect(exportProfileText(emptyProfile, "fr", "2026-11-15")).toContain("Notes sur les transferts\u00A0: Inconnu");
  });
  it("uses the person's own words in the text sheet", () => {
    expect(exportProfileText(sample, "en", "2026-11-15")).toContain("Synthetic example note");
  });
});

describe("copy rules", () => {
  it("has no eligibility, medical-advice, model or AI wording in strings, exports or markup", () => {
    const texts: string[] = [];
    for (const lang of ["en", "fr"] as const) {
      texts.push(...Object.values(strings[lang]));
      texts.push(exportProfileText(emptyProfile, lang, "2026-11-15"));
      texts.push(renderToStaticMarkup(createElement(DirectoryLinks, { lang })));
    }
    texts.push(exportProfileJson(emptyProfile, "2026-11-15"));
    for (const l of catalog) texts.push(l.titleEn, l.titleFr, l.notesEn, l.notesFr);
    for (const t of texts) for (const re of banned) expect(t, String(re)).not.toMatch(re);
  });
  it("has matching EN and FR string keys", () => {
    expect(Object.keys(strings.fr).sort()).toEqual(Object.keys(strings.en).sort());
  });
});
