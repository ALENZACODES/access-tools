import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { auditFixtureLanguage, englishFixtureSamples, fixturePack } from "@access-tools/place";
import { emptySearchQuery } from "../search.js";
import { SearchPanel } from "./SearchPanel.js";

afterEach(() => cleanup());

describe("French search language", () => {
  it("marks every rendered English fixture string with lang=en", () => {
    const { container } = render(
      <SearchPanel
        pack={fixturePack}
        query={{ ...emptySearchQuery("fr"), showHidden: true, pageSize: 50 }}
        onQueryChange={() => undefined}
        onOpenPlace={() => undefined}
      />,
    );
    const audit = auditFixtureLanguage(container, englishFixtureSamples(fixturePack));
    expect(audit.flatMap((row) => row.unmarked)).toEqual([]);
    for (const sample of ["Fixture: Synthetic Parking Lot", "Fixture: Repair Bench Premises", "Fixture: Synthetic Trailhead"]) {
      expect(audit.find((row) => row.sample === sample)?.occurrences ?? 0, sample).toBeGreaterThan(0);
    }
  });
});
