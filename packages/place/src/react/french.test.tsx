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
    expect(text).not.toContain("open data");
    expect(text).toContain("Pas un lieu réel");
    expect(text).toContain("Largeur libre de la porte");
    expect(text).toContain("Automatique");
    expect(text).toContain("Coulissante");
    expect(text).not.toContain("entrance-blocked");
    expect(text).toContain("Entrée bloquée");
    for (const key of RAW_KEYS) {
      expect(text).not.toContain(key);
    }
    const regions = screen.getAllByRole("region").map((region) => region.getAttribute("aria-label") ?? "");
    expect(regions.some((label) => label.endsWith("fields"))).toBe(false);
    expect(regions.some((label) => label.endsWith("champs"))).toBe(true);
    for (const [key, row] of Object.entries(COPY)) {
      expect(row.fr.trim().length, key).toBeGreaterThan(0);
    }
  });
});
