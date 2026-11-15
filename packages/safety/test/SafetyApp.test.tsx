import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SafetyApp } from "../src/index.js";

let clockMs = new Date("2026-11-20T14:00:00.000Z").getTime();
const clock = () => new Date(clockMs);

afterEach(cleanup);

beforeEach(() => {
  clockMs = new Date("2026-11-20T14:00:00.000Z").getTime();
  window.localStorage.clear();
});

const axeOptions = { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } };

describe("SafetyApp", () => {
  it("shows the no-dispatch boundary and an unknown outage by default", () => {
    render(<SafetyApp now={clock} />);
    expect(screen.getByRole("note").textContent).toContain("The App does not dispatch help.");
    expect(screen.getByTestId("outage-status")).toHaveTextContent("Outage status: Unknown");
    expect(screen.getByText(/Live elevator or outage status is not connected here/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Call 911 now" })).not.toBeInTheDocument();
  });

  it("reveals emergency links and a local summary only after the help choice", async () => {
    const user = userEvent.setup();
    render(<SafetyApp now={clock} />);
    await user.click(screen.getByRole("button", { name: "Start check-in window" }));
    expect(screen.getByTestId("checkin-status")).toHaveTextContent("Check-in window open until");
    expect(screen.queryByTestId("help-panel")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "I need help contacting someone" }));
    const panel = screen.getByTestId("help-panel");
    expect(within(panel).getByRole("link", { name: "Call 911 now" })).toHaveAttribute("href", "tel:911");
    expect(within(panel).getByRole("link", { name: "Call 9-8-8" })).toHaveAttribute("href", "tel:988");
    expect(within(panel).getByRole("link", { name: "Text CONNEX to 247247" })).toHaveAttribute("href", "sms:247247?&body=CONNEX");
    expect((within(panel).getByLabelText("Summary you can copy") as HTMLTextAreaElement).value).toContain("Not sent to anyone");
    expect(screen.getByTestId("checkin-status")).toHaveTextContent("The App has not contacted anyone.");
  });

  it("marks OK without revealing links", async () => {
    const user = userEvent.setup();
    render(<SafetyApp now={clock} />);
    await user.click(screen.getByRole("button", { name: "Start check-in window" }));
    await user.click(screen.getByRole("button", { name: "I'm OK" }));
    expect(screen.getByTestId("checkin-status")).toHaveTextContent("Nobody was told.");
    expect(screen.queryByTestId("help-panel")).not.toBeInTheDocument();
  });

  it("says nothing was alerted when the window passes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SafetyApp now={clock} />);
    await user.click(screen.getByRole("button", { name: "Start check-in window" }));
    clockMs += 61 * 60_000;
    rerender(<SafetyApp now={clock} />);
    expect(screen.getByTestId("checkin-status")).toHaveTextContent("The App has not alerted anyone.");
  });

  it("creates a trip share, expires it, and revokes it", async () => {
    const user = userEvent.setup();
    render(<SafetyApp now={clock} />);
    await user.click(screen.getByRole("button", { name: "Create trip share" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter an origin label.");
    await user.type(screen.getByLabelText("Origin label"), "Home");
    await user.type(screen.getByLabelText("Destination label"), "Clinic");
    await user.click(screen.getByRole("button", { name: "Create trip share" }));
    const payload = screen.getByLabelText("Trip share text") as HTMLTextAreaElement;
    expect(payload.value).toContain("ACCESS-TRIP-SHARE/1");
    const text = payload.value;

    await user.click(screen.getByRole("button", { name: "Revoke on this device" }));
    expect(screen.queryByLabelText("Trip share text")).not.toBeInTheDocument();
    expect(screen.getByText(/was revoked on this device/)).toBeInTheDocument();

    await user.click(screen.getByLabelText("Pasted trip share text"));
    await user.paste(text);
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByTestId("check-result")).toHaveTextContent("Revoked on this device. Nothing is shown.");
  });

  it("shows an expired share as dead", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SafetyApp now={clock} />);
    await user.type(screen.getByLabelText("Origin label"), "Home");
    await user.type(screen.getByLabelText("Destination label"), "Clinic");
    await user.click(screen.getByRole("button", { name: "Create trip share" }));
    const text = (screen.getByLabelText("Trip share text") as HTMLTextAreaElement).value;
    clockMs += 3 * 60 * 60_000;
    rerender(<SafetyApp now={clock} />);
    expect(screen.queryByLabelText("Trip share text")).not.toBeInTheDocument();
    expect(screen.getByText(/The text is dead/)).toBeInTheDocument();
    await user.click(screen.getByLabelText("Pasted trip share text"));
    await user.paste(text);
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByTestId("check-result")).toHaveTextContent(/Expired at .* Nothing is shown\./);
    expect(screen.getByTestId("check-result")).not.toHaveTextContent("Clinic");
  });

  it("switches to French and passes axe in both languages with every panel open", async () => {
    const user = userEvent.setup();
    const { container } = render(<SafetyApp now={clock} />);
    await user.click(screen.getByRole("button", { name: "Start check-in window" }));
    await user.click(screen.getByRole("button", { name: "I need help contacting someone" }));
    await user.type(screen.getByLabelText("Origin label"), "Home");
    await user.type(screen.getByLabelText("Destination label"), "Clinic");
    await user.click(screen.getByRole("button", { name: "Create trip share" }));
    expect((await axe.run(container, axeOptions)).violations).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Français" }));
    expect(document.documentElement.lang).toBe("fr");
    expect(screen.getByRole("note").textContent).toContain("L'application n'envoie pas d'aide.");
    expect(screen.getByRole("link", { name: "Composer le 911 maintenant" })).toBeInTheDocument();
    expect(screen.getByTestId("outage-status").textContent).toBe("\u00c9tat des pannes\u00a0: Inconnu");
    expect((await axe.run(container, axeOptions)).violations).toEqual([]);
  });
});
