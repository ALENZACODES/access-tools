import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { a11yCss, fixturePack } from "@access-tools/place";
import { emptySearchQuery, type SearchQuery } from "../search.js";
import { SearchPanel } from "./SearchPanel.js";

function Harness() {
  const [query, setQuery] = useState<SearchQuery>(emptySearchQuery("en"));
  const [opened, setOpened] = useState("");
  return (
    <div>
      <h1>the App — search</h1>
      <SearchPanel pack={fixturePack} query={query} onQueryChange={setQuery} onOpenPlace={setOpened} />
      <p>{opened}</p>
    </div>
  );
}

describe("search panel", () => {
  it("has no axe violations and an honest empty state", async () => {
    document.documentElement.lang = "en";
    document.title = "the App";
    const view = render(<Harness />);
    const results = await axe.run(view.container, { rules: { region: { enabled: false } } });
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Words"), "zzzz-no-match");
    expect(screen.getByRole("status").textContent).toContain("zzzz-no-match");
    expect(screen.getByRole("status").textContent).toContain("No seeded place matched");
    const box = screen.getAllByRole("checkbox")[0];
    if (!box) throw new Error("missing checkbox");
    expect(a11yCss).toContain('input[type="checkbox"]');
    expect(a11yCss).toContain("min-width: 24px");
    expect(a11yCss).toContain("min-height: 24px");
    expect(box).toBeInstanceOf(HTMLInputElement);
  });

  it("labels French filters instead of showing raw keys", () => {
    render(
      <SearchPanel
        pack={fixturePack}
        query={emptySearchQuery("fr")}
        onQueryChange={() => undefined}
        onOpenPlace={() => undefined}
      />,
    );
    const text = document.body.textContent ?? "";
    expect(text).toContain("Centre communautaire");
    expect(text).toContain("Lieu complexe");
    expect(text).toContain("Fournitures pour sondes");
    expect(text).not.toContain("community-centre");
    expect(text).not.toContain("simple-venue");
    expect(text).not.toContain("catheter-supplies");
    expect(text).not.toContain("not-seeded");
    expect(screen.getByRole("option", { name: "Pas encore semé" })).toBeTruthy();
  });
});
