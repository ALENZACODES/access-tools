// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EVIDENCE_STORAGE_KEY } from "../src/evidence.js";
import { DepthFinder } from "../src/DepthFinder.js";
import { EvidenceForm } from "../src/EvidenceForm.js";
import { HousingFinder } from "../src/HousingFinder.js";

afterEach(() => { cleanup(); window.localStorage.clear(); vi.unstubAllGlobals(); });

const results = () => document.getElementById("depth-results-heading")!.closest("section")!;
const card = (name: string) => screen.getByText(name, { selector: "h3" }).closest("article")!;

describe("unit and room finder", () => {
  it("shows every unit with Unknown fields, provenance and an unverified label", () => {
    render(<DepthFinder lang="en" />);
    const section = results();
    expect(within(section).getByText("5 matching units")).toBeInTheDocument();
    expect(within(section).getAllByText("Demonstration record — not verified")).toHaveLength(5);
    const empty = card("Demonstration guest room E-1");
    expect(within(empty).getByText("0 of 16 fields in this record are recorded; the rest are Unknown.")).toBeInTheDocument();
    expect(within(empty).getAllByText("Unknown", { selector: "strong" })).toHaveLength(16);
    expect(within(empty).getByText("The App does not book rooms and does not guarantee availability.")).toBeInTheDocument();
    const roomA = card("Demonstration guest room D-1");
    expect(within(roomA).getByText("Bathroom", { selector: "h4" })).toBeInTheDocument();
    expect(within(roomA).getAllByText(/Tier: 0 \(PROTOTYPE-UNVERIFIED\)/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Verified by/i)).not.toBeInTheDocument();
  });

  it("keeps Unknown out of filtered results and says why units are not listed", () => {
    render(<DepthFinder lang="en" />);
    fireEvent.click(document.getElementById("depth-requireRollInShower")!);
    const section = results();
    expect(within(section).getByText("2 matching units")).toBeInTheDocument();
    expect(within(section).getByText("Not listed because a fact these filters need is Unknown: 2.")).toBeInTheDocument();
    expect(within(section).getByText("Not listed because a recorded fact does not meet these filters: 1.")).toBeInTheDocument();
    expect(within(section).queryByText("Demonstration guest room E-1")).not.toBeInTheDocument();
    fireEvent.click(document.getElementById("depth-requireHoist")!);
    expect(within(results()).getByText("No unit meets every filter.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Clear these filters", { selector: "button" }));
    expect(within(results()).getByText("5 matching units")).toBeInTheDocument();
  }, 20_000);

  it("offers the finder in French", () => {
    render(<DepthFinder lang="fr" />);
    expect(document.getElementById("depth-results-heading")).toHaveTextContent("Fiches par logement et par pièce");
    fireEvent.change(document.getElementById("depth-kind")!, { target: { value: "overnight" } });
    expect(screen.getByText("3 logements ou chambres correspondants")).toBeInTheDocument();
    expect(screen.getAllByText("Fiche de démonstration — non vérifiée")).toHaveLength(3);
    expect(screen.getAllByText("Inconnu", { selector: "strong" }).length).toBeGreaterThan(0);
  }, 20_000);

  it("is part of the housing page together with the report form", () => {
    render(<HousingFinder />);
    expect(document.getElementById("depth-results-heading")).toHaveTextContent("Unit and room records");
    expect(document.getElementById("barriers-heading")).toHaveTextContent("On-device barrier and wait report");
    expect(document.querySelectorAll(".unit-card")).toHaveLength(5);
    expect(document.querySelectorAll(".room")).toHaveLength(2);
  }, 20_000);
});

describe("barrier and wait report form", () => {
  it("saves a structured report on the device only after agreement, and sends nothing", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<EvidenceForm lang="en" />);
    fireEvent.change(screen.getByLabelText("What happened"), { target: { value: "waited" } });
    fireEvent.change(screen.getByLabelText("How long you waited"), { target: { value: "over-2-years" } });
    fireEvent.click(screen.getByLabelText("No roll-in shower"));
    fireEvent.click(screen.getByText("Save report", { selector: "button" }));
    expect(screen.getByText("Tick the box to save the report.")).toBeInTheDocument();
    expect(window.localStorage.getItem(EVIDENCE_STORAGE_KEY)).toBeNull();

    fireEvent.click(screen.getByLabelText("Save this anonymous report on this device."));
    fireEvent.click(screen.getByText("Save report", { selector: "button" }));
    expect(screen.getByText("Report saved on this device. Nothing was sent.")).toBeInTheDocument();
    const stored = JSON.parse(window.localStorage.getItem(EVIDENCE_STORAGE_KEY) ?? "[]") as Array<Record<string, unknown>>;
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ category: "waited", setting: "unknown", waitBand: "over-2-years", barriers: ["no-roll-in-shower"] });
    expect(String(stored[0]!.period)).toMatch(/^\d{4}-Q[1-4]$/);
    expect(Object.keys(stored[0]!).sort()).toEqual(["barriers", "category", "period", "schemaVersion", "setting", "waitBand"]);
    expect(fetchSpy).not.toHaveBeenCalled();

    // One report is far under the threshold: no count is shown.
    const preview = screen.getByText("Local aggregate preview (not transmitted)").closest("section")!;
    expect(within(preview).queryByText(/^[0-9]+$/, { selector: "dd" })).not.toBeInTheDocument();
    const link = screen.getByText("Download aggregate counts (JSON file)");
    const exported = JSON.parse(decodeURIComponent(link.getAttribute("href")!.split(",")[1]!)) as { total: number | null };
    expect(exported.total).toBeNull();

    fireEvent.click(screen.getByText("Delete my local reports", { selector: "button" }));
    expect(window.localStorage.getItem(EVIDENCE_STORAGE_KEY)).toBeNull();
    expect(screen.getByText("Local reports deleted.")).toBeInTheDocument();
  });

  it("rejects a city entry that is not a place name", () => {
    render(<EvidenceForm lang="en" />);
    fireEvent.change(screen.getByLabelText("City (optional)"), { target: { value: "phone 555 0100" } });
    fireEvent.click(screen.getByLabelText("Save this anonymous report on this device."));
    fireEvent.click(screen.getByText("Save report", { selector: "button" }));
    expect(screen.getByText("Use letters and basic punctuation only (up to 60 characters).")).toBeInTheDocument();
    expect(window.localStorage.getItem(EVIDENCE_STORAGE_KEY)).toBeNull();
  });
});
