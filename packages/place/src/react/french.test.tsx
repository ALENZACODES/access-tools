import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { fixturePack, FIXTURE_DAY, placeById } from "../fixtures.js";
import { COPY } from "../i18n.js";
import { PlacePage } from "./PlacePage.js";

const RAW_KEYS = [
  "community-centre",
  "complex-venue",
  "simple-venue",
  "catheter-supplies",
  "tier-0-open-data",
  "labelled-fixture",
  "bounded-seed",
  "all-gender",
  "type-a-van",
  "staff-assisted",
  "power-assist",
];

afterEach(() => cleanup());

describe("French place page", () => {
  it("does not leak English chrome or raw keys", () => {
    const place = placeById("fix-community-centre");
    if (!place) throw new Error("missing");
    render(
      <PlacePage
        place={place}
        pack={fixturePack}
        lang="fr"
        today={FIXTURE_DAY}
        corrections={[
          {
            id: "c1",
            placeId: place.id,
            fieldId: "entrance.door-clear-width-mm",
            suggestedCorrection: "900 mm",
            note: "",
            submittedAt: "2026-11-13T15:00:00.000Z",
            status: "pending",
            moderation: "not-running",
          },
        ]}
        changes={[
          {
            id: "r1",
            placeId: place.id,
            targetId: place.id,
            problem: "entrance-blocked",
            note: "",
            submittedAt: "2026-11-13T15:00:00.000Z",
            status: "pending",
            moderation: "not-running",
          },
        ]}
        onCorrection={() => undefined}
        onChange={() => undefined}
      />,
    );
    const text = document.body.textContent ?? "";
    expect(text).toContain("PROTOTYPE-UNVERIFIED");
    expect(text).not.toContain("PROTOTYPE and UNVERIFIED");
    expect(text).not.toContain("Not a real place");
    expect(text).not.toContain("Not a data licence");
    expect(text).not.toContain("access-tools labelled fixture");
    expect(text).toContain("Pas une licence de données");
    expect(text).toContain("Anglais seulement");
    expect(text).toContain("English only");
    expect(text).not.toContain("open data");
    const english = [...document.querySelectorAll('[lang="en"]')].map((node) => node.textContent ?? "");
    for (const sample of [
      "Fixture: Synthetic Community Centre",
      "1 Fixture Lane (not a real address)",
      "Not a surveyed entrance",
      "Fixture washroom B, nothing measured",
      "Fixture hours: weekdays 09:00–17:00",
    ]) {
      expect(english.some((item) => item.includes(sample)), sample).toBe(true);
    }
    expect(text).toContain("Pas un lieu réel");
    expect(text).toContain("Largeur libre de la porte");
    expect(text).toContain("Automatique");
    expect(text).toContain("Coulissante");
    expect(text).not.toContain("entrance-blocked");
    expect(text).toContain("Entrée bloquée");
    for (const key of RAW_KEYS) {
      expect(text).not.toContain(key);
    }
    const captions = [...document.querySelectorAll("caption")].map((node) => node.textContent?.replace(/\s+/g, " ").trim() ?? "");
    expect(captions).toEqual(expect.arrayContaining([
      "Champs d'identité",
      "Champs d'entrée",
      "Champs pour s'y rendre",
      "Champs de l'intérieur",
      "Champs de stationnement",
      "Champs de sièges et comptoirs",
      "Champs de politiques",
      "Champs de recharge",
      "Champs de réparation et fournitures",
      "Champs de photographies",
      "Champs de signalements",
      "Champs de source et fraîcheur",
    ]));
    expect(captions.some((label) => label.startsWith("Champs : "))).toBe(true);
    const rawCaptions = [...document.querySelectorAll("caption")].map((node) => node.textContent ?? "");
    expect(rawCaptions.some((label) => label.includes("Champs\u00A0:"))).toBe(true);
    expect(captions.some((label) => label.includes("Identité champs") || label.endsWith(" champs"))).toBe(false);
    expect(document.querySelectorAll(".table-scroll[role='region']")).toHaveLength(0);
    const regions = screen.getAllByRole("region");
    expect(regions.length).toBeGreaterThan(0);
    expect(regions.every((region) => !region.classList.contains("table-scroll"))).toBe(true);
    cleanup();
    const hoist = placeById("fix-change-hoist");
    if (!hoist) throw new Error("missing hoist");
    render(<PlacePage place={hoist} pack={fixturePack} lang="fr" today={FIXTURE_DAY} corrections={[]} changes={[]} onCorrection={() => undefined} onChange={() => undefined} />);
    const hoistEnglish = [...document.querySelectorAll('[lang="en"]')].map((node) => node.textContent ?? "");
    expect(hoistEnglish.some((item) => item.includes("Ceiling track, fixture text"))).toBe(true);
    for (const [key, row] of Object.entries(COPY)) {
      expect(row.fr.trim().length, key).toBeGreaterThan(0);
    }
  });

  it("names every focusable field scroll container in English and French", () => {
    const place = placeById("fix-community-centre");
    if (!place) throw new Error("missing");
    for (const lang of ["en", "fr"] as const) {
      cleanup();
      render(
        <PlacePage
          place={place}
          pack={fixturePack}
          lang={lang}
          today={FIXTURE_DAY}
          corrections={[]}
          changes={[]}
          onCorrection={() => undefined}
          onChange={() => undefined}
        />,
      );
      const scrolls = [...document.querySelectorAll<HTMLElement>(".table-scroll")];
      expect(scrolls.length, lang).toBeGreaterThan(0);
      for (const scroll of scrolls) {
        expect(scroll.tabIndex, lang).toBe(0);
        expect(scroll.getAttribute("role"), lang).toBe("group");
        const labelledBy = scroll.getAttribute("aria-labelledby");
        expect(labelledBy, lang).toBeTruthy();
        const caption = labelledBy ? document.getElementById(labelledBy) : null;
        expect(caption?.tagName, lang).toBe("CAPTION");
        const name = caption?.textContent?.replace(/\s+/g, " ").trim() ?? "";
        expect(name.length, lang).toBeGreaterThan(0);
        const namePattern = new RegExp(
          `^${name
            .split(" ")
            .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join("\\s+")}$`,
        );
        expect(screen.getAllByRole("group", { name: namePattern }), lang).toContain(scroll);
      }
      const expected = lang === "fr" ? /^Champs d'identité$/ : /^Identity fields$/;
      expect(screen.getByRole("group", { name: expected }).classList.contains("table-scroll")).toBe(true);
      expect(document.querySelectorAll(".table-scroll[role='region']")).toHaveLength(0);
    }
    const css = document.querySelector("style")?.textContent ?? "";
    expect(css).toContain(".table-scroll:focus-visible");
    expect(css).toContain("outline: 3px solid #0b3a82");
  });
});
