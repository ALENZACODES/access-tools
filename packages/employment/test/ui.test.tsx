import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmploymentView } from "../src/ui.js";

describe("employment view", () => {
  it("shows unknown accessibility and commute in English", () => {
    render(<EmploymentView/>);
    expect(screen.getByText(/door-to-door journey engine is not available/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Workplace access summary" })).toBeInTheDocument();
    expect(screen.getByText(/No workplace place record is linked/)).toBeInTheDocument();
  });
  it("switches to French and keeps the hand-off disclaimer", () => {
    render(<EmploymentView/>);
    fireEvent.change(screen.getByLabelText("Language"), { target: { value: "fr" } });
    expect(screen.getByRole("heading", { name: "Orientation vers un programme d’emploi" })).toBeInTheDocument();
    expect(screen.getByText(/moteur de trajet porte-à-porte n’est pas disponible/)).toBeInTheDocument();
    expect(screen.getAllByText(/n’envoie aucune demande/).length).toBeGreaterThan(0);
  });
});
