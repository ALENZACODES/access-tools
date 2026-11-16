import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmploymentView } from "../src/ui.js";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("listing access labels", () => {
  it("shows every listing, each with an explicit unverified label", () => {
    render(<EmploymentView/>);
    const list = screen.getByRole("heading", { name: "Listings" }).closest("section")!;
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(within(items[0]!).getByText("Unverified — no workplace access record. Access is Unknown.")).toBeInTheDocument();
    expect(within(items[2]!).getByText(/an access record is attached\. Its values are not checked by the App/)).toBeInTheDocument();
    expect(screen.queryByText(/Verified by/i)).not.toBeInTheDocument();
  });

  it("shows recorded values, Unknown values and provenance for an attached record", async () => {
    const user = userEvent.setup();
    render(<EmploymentView/>);
    await user.click(screen.getByRole("button", { name: /Desk-work example/ }));
    expect(screen.getByText("Step-free entry: Yes")).toBeInTheDocument();
    expect(screen.getByText("Accessible washroom: Unknown")).toBeInTheDocument();
    expect(screen.getByText("Knee clearance under the desk (mm): 700")).toBeInTheDocument();
    expect(screen.getAllByText("PROTOTYPE-UNVERIFIED").length).toBe(6);
    expect(screen.queryByText(/No workplace place record is linked/)).not.toBeInTheDocument();
  });
});

describe("own commute check", () => {
  it("keeps blanks Unknown and compares only what was typed", async () => {
    const user = userEvent.setup();
    render(<EmploymentView/>);
    await user.type(screen.getByLabelText(/Your estimate of the door-to-door travel time/), "50");
    await user.type(screen.getByLabelText(/Longest one-way travel time/), "45");
    await user.click(screen.getByRole("button", { name: "Show what is known" }));
    expect(screen.getByText(/1 known, 8 Unknown\. This check does not say whether you can get to this workplace\./)).toBeInTheDocument();
    expect(screen.getByText(/the 50 minutes you entered is over the 45-minute limit you entered/)).toBeInTheDocument();
    expect(screen.getByText("Workplace entry: Unknown — there is no access record for this workplace.")).toBeInTheDocument();
    expect(screen.getByText("Journey plan result: route: Unknown — no journey plan result was supplied.")).toBeInTheDocument();
  });

  it("is available in French", async () => {
    const user = userEvent.setup();
    render(<EmploymentView initialLanguage="fr"/>);
    await user.click(screen.getByRole("button", { name: "Afficher ce qui est connu" }));
    expect(screen.getByText(/0 élément\(s\) connu\(s\), 9 inconnu\(s\)/)).toBeInTheDocument();
  });
});

describe("referral summary export", () => {
  it("refuses without consent, then builds an on-device summary with only the chosen items", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<EmploymentView/>);
    await user.click(screen.getByLabelText("The listing title, organisation and city"));
    await user.click(screen.getByRole("button", { name: "Create summary" }));
    expect(screen.getByText("Tick the consent box to create the summary.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Your summary")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText(/I understand that this summary is created on my device/));
    await user.click(screen.getByRole("button", { name: "Create summary" }));
    expect(screen.getByText("Summary created on this device. Nothing was sent.")).toBeInTheDocument();
    const output = screen.getByLabelText<HTMLTextAreaElement>("Your summary");
    expect(output.value).toContain("Employment support exploration (demonstration)");
    expect(output.value).toContain("Left out by the person’s choice: workplace access facts, commute check, note");
    expect(output.value).not.toContain("Step-free entry");
    const link = screen.getByRole("link", { name: "Download summary (text file)" });
    expect(link.getAttribute("href")).toMatch(/^data:text\/plain;charset=utf-8,/);
    expect(link).toHaveAttribute("download");
    expect(fetchSpy).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete this summary" }));
    expect(screen.queryByLabelText("Your summary")).not.toBeInTheDocument();
  });
});
