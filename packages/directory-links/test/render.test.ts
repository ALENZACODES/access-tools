import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { catalog, isLive } from "../src/catalog";
import { DirectoryLinks, LinkList, WavSection } from "../src/DirectoryLinks";

const anchors = (html: string) => (html.match(/<a /g) ?? []).length;

describe("rendering", () => {
  it("renders only verified links as anchors", () => {
    for (const lang of ["en", "fr"] as const) {
      const html = renderToStaticMarkup(createElement(LinkList, { links: catalog, lang }));
      expect(anchors(html)).toBe(catalog.filter(isLive).length);
      expect(html).not.toContain('href="null"');
      expect(html).not.toContain('href=""');
    }
  });
  it("does not render a needs-verification link as clickable even with bad data", () => {
    const pendingRow = catalog.find((l) => l.status === "needs-verification");
    expect(pendingRow).toBeDefined();
    const bad = [{ ...pendingRow!, url: "https://example.invalid/" }];
    expect(anchors(renderToStaticMarkup(createElement(LinkList, { links: bad, lang: "en" })))).toBe(0);
  });
  it("shows Unknown / Inconnu for WAV availability and no availability claim", () => {
    const en = renderToStaticMarkup(createElement(WavSection, { lang: "en", links: catalog }));
    const fr = renderToStaticMarkup(createElement(WavSection, { lang: "fr", links: catalog }));
    expect(en).toContain("Unknown");
    expect(fr).toContain("Inconnu");
    expect(en).not.toMatch(/\b(is|are) available\b/i);
    expect(fr).not.toMatch(/est disponible|sont disponibles/i);
  });
  it("never shows a tier 0 WAV fact, and shows source details for a sourced one", () => {
    const base = { text: "Synthetic example text", source_id: "synthetic-1", licence: "CC0", retrieved_at: "2026-01-01" };
    const t0 = renderToStaticMarkup(createElement(WavSection, { lang: "en", links: catalog, wavFact: { ...base, tier: 0 } }));
    expect(t0).not.toContain("Synthetic example text");
    const t1 = renderToStaticMarkup(createElement(WavSection, { lang: "en", links: catalog, wavFact: { ...base, tier: 1 } }));
    expect(t1).toContain("Synthetic example text");
    expect(t1).toContain("synthetic-1");
    expect(t1).toContain("CC0");
    expect(t1).toContain("2026-01-01");
  });
  it("labels every form control", () => {
    const html = renderToStaticMarkup(createElement(DirectoryLinks, { lang: "en" }));
    for (const id of ["dl-name", "dl-mobility", "dl-transfer"]) expect(html).toContain(`for="${id}"`);
  });
});
