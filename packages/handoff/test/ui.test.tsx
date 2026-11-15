import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HandoffAudit } from "../src/ui.js";
import { demonstrationHandoff, demonstrationRecords } from "../src/fixtures.js";

function setup() {
  return render(<HandoffAudit initialRecords={demonstrationRecords} handoff={demonstrationHandoff} asOf="2026-11-15" />);
}

describe("hand-off and audit UI", () => {
  afterEach(cleanup);
  it("never renders stale or undated demonstration dollar values", () => {
    setup();
    expect(screen.queryByText(/\$123|\$456/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Figure hidden until/)).toHaveLength(2);
    const cards = screen.getAllByRole("article");
    expect(within(cards[1]!).getAllByText(/2026-06-01/).length).toBeGreaterThan(0);
  });
  it("supports French, link/checklist actions and manual recording without refreshing an old figure", () => {
    setup();
    fireEvent.change(screen.getByLabelText("Language"), { target: { value: "fr" } });
    expect(screen.getByRole("heading", { name: "Audit trimestriel de fraîcheur" })).toBeInTheDocument();
    const checks = screen.getAllByRole("checkbox");
    fireEvent.click(checks[0]!);
    expect(checks[0]).toBeChecked();
    const card = screen.getAllByRole("article")[1]!;
    fireEvent.change(within(card).getByLabelText("Date de vérification manuelle"), { target: { value: "2026-11-15" } });
    fireEvent.click(within(card).getByRole("button", { name: "Enregistrer la date" }));
    expect(within(card).getByText("À jour")).toBeInTheDocument();
    expect(within(card).getByText(/Chiffre masqué en attendant/)).toBeInTheDocument();
    expect(screen.queryByText(/123 \$/)).not.toBeInTheDocument();
  });
});
