import { describe, expect, it } from "vitest";
import { EMERGENCY_PATHWAYS } from "../../timing/src/emergency.js";
import { SAFETY_COPY, safetyCopy, type SafetyCopyKey } from "../src/i18n.js";

const entries = Object.entries(SAFETY_COPY) as [SafetyCopyKey, { en: string; fr: string }][];

describe("copy catalog", () => {
  it("has non-empty EN and FR for every key", () => {
    for (const [key, row] of entries) {
      expect(row.en.trim(), key).not.toBe("");
      expect(row.fr.trim(), key).not.toBe("");
    }
  });

  it("says the App does not dispatch help, in both languages", () => {
    expect(safetyCopy("safety.boundary", "en")).toContain("The App does not dispatch help.");
    expect(safetyCopy("safety.boundary", "en")).toContain("does not call, text or alert anyone, including emergency services");
    expect(safetyCopy("safety.boundary", "en")).toContain("does not track or send your location");
    expect(safetyCopy("safety.boundary", "fr")).toContain("L'application n'envoie pas d'aide.");
    expect(safetyCopy("safety.boundary", "fr")).toContain("n'alerte personne, y compris les services d'urgence");
    expect(safetyCopy("summary.footer", "en")).toContain("The App does not dispatch help.");
  });

  it("says live outage status is not connected, in both languages", () => {
    expect(safetyCopy("disruption.unknown-copy", "en")).toContain("Live elevator or outage status is not connected here.");
    expect(safetyCopy("disruption.unknown-copy", "fr")).toContain("n'est pas connecté ici");
  });

  it("uses non-breaking spaces in French punctuation", () => {
    for (const [key, row] of entries) {
      expect(row.fr, key).not.toMatch(/[A-Za-z\u00c0-\u00ff0-9)] [:;?!]/);
      expect(row.fr, key).not.toMatch(/\u00ab[ ]|[ ]\u00bb/);
      if (row.fr.includes("\u00ab")) expect(row.fr, key).toMatch(/\u00ab\u00a0.*\u00a0\u00bb/);
    }
  });

  it("keeps template placeholders identical across languages", () => {
    const names = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const [key, row] of entries) expect(names(row.fr), key).toEqual(names(row.en));
  });

  it("claims no endorsement, no named agency and no banned names", () => {
    const all = entries.flatMap(([, row]) => [row.en, row.fr]).join("\n");
    expect(all).not.toMatch(/ttc|go transit|metrolinx|endorse|partner/i);
    expect(all).not.toMatch(/\bAI\b|\bIA\b|artificial intelligence/);
  });

  it("fills variables", () => {
    expect(safetyCopy("checkin.minutes", "en", { n: 30 })).toBe("30 minutes");
  });

  it("reuses the same three emergency pathways as timing", () => {
    expect(EMERGENCY_PATHWAYS.map((p) => p.href)).toEqual(["tel:911", "tel:988", "tel:+18665312600"]);
  });
});
