import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { appendCorrection, correctionsFor, emptyLog } from "../corrections.js";
import { fixturePack, FIXTURE_DAY, placeById } from "../fixtures.js";
import type { ReportLog } from "../types.js";
import { PlacePage } from "./PlacePage.js";

async function expectClean(container: HTMLElement) {
  document.documentElement.lang = "en";
  document.title = "the App";
  const results = await axe.run(container, {
    rules: {
      region: { enabled: false },
    },
  });
  const summary = results.violations.map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length})`);
  expect(summary).toEqual([]);
}

function Harness({ placeId, lang }: { placeId: string; lang: "en" | "fr" }) {
  const place = placeById(placeId);
  const [log, setLog] = useState<ReportLog>(emptyLog());
  if (!place) return null;
  return (
    <PlacePage
      place={place}
      pack={fixturePack}
      lang={lang}
      today={FIXTURE_DAY}
      corrections={correctionsFor(log, place.id)}
      changes={[]}
      onCorrection={(input) => {
        setLog((current) =>
          appendCorrection(current, { ...input, placeId: place.id }, "2026-11-13T15:00:00.000Z", "c-test"),
        );
      }}
      onChange={() => undefined}
    />
  );
}

afterEach(() => cleanup());

describe("place page accessibility", () => {
  it("has no axe violations in English or French", async () => {
    const english = render(<Harness placeId="fix-community-centre" lang="en" />);
    await expectClean(english.container);
    english.unmount();
    const french = render(<Harness placeId="fix-community-centre" lang="fr" />);
    document.documentElement.lang = "fr";
    await expectClean(french.container);
  });

  it("keeps one heading, the prototype notice, and an unchanged record after a correction", async () => {
    const user = userEvent.setup();
    render(<Harness placeId="fix-cafe" lang="en" />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("note").textContent).toContain("PROTOTYPE");
    expect(screen.getByRole("note").textContent).toContain("UNVERIFIED");
    const before = screen.getByRole("row", { name: /Door clear width/i }).textContent;
    await user.type(screen.getByLabelText("Suggested correction"), "A fixture suggestion");
    await user.click(screen.getByRole("button", { name: "Save correction on this device" }));
    expect(screen.getByRole("status").textContent).toContain("1 pending correction");
    expect(screen.getByRole("row", { name: /Door clear width/i }).textContent).toBe(before);
    expect(screen.getByText(/Pending correction/)).toBeTruthy();
  });

  it("labels the skeleton page honestly", () => {
    render(<Harness placeId="skel-ottawa" lang="en" />);
    const status = screen.getAllByRole("status").map((element) => element.textContent ?? "").join(" ");
    expect(status).toContain("Skeleton seed for Ottawa");
    expect(status).toContain("absent from this seed");
  });
});
