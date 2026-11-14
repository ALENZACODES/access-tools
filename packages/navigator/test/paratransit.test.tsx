import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { PARATRANSIT, ParatransitDirectory, paratransitErrors, publishedPhoneHref } from "../src/index.js";
import schema from "../src/paratransit/schema/paratransit-entry.schema.json";

const FORBIDDEN = [
  /you qualify/i,
  /you are eligible/i,
  /vous êtes admissible/i,
  /the app recommends/i,
  /endors/i,
  /catheter/i,
  /washroom/i,
  /days in advance/i,
  /\b\d+\s*days\b/i,
  /\b\d{1,2}:\d{2}\b/,
  /\b[ap]\.m\./i,
];

const VERIFIED = [
  {
    id: "wheel-trans",
    agencyName: "Wheel-Trans",
    phone: "416-393-4222",
    websiteUrl: "https://www.ttc.ca/wheel-trans",
    bookingUrl: "https://mywheel-trans.ttc.ca",
    sourceUrl: "https://www.ttc.ca/wheel-trans/contact-us",
  },
  {
    id: "transhelp",
    agencyName: "TransHelp",
    phone: "905-791-1015",
    websiteUrl: "https://peelregion.ca/transhelp",
    bookingUrl: "https://peelregion.ca/services/book-or-change-transhelp-trip",
    sourceUrl: "https://peelregion.ca/services/book-or-change-transhelp-trip",
  },
  {
    id: "york-mobility-on-request",
    agencyName: "Mobility On-Request Paratransit",
    phone: "1-888-762-2950",
    websiteUrl: "https://www.yrt.ca/en/schedules-and-maps/mobility-on-request.aspx",
    bookingUrl: "https://www.yrt.ca/en/schedules-and-maps/booking-your-trip.aspx",
    sourceUrl: "https://www.yrt.ca/en/schedules-and-maps/booking-your-trip.aspx",
  },
  {
    id: "durham-specialized",
    agencyName: "Specialized Services",
    phone: "1-866-247-0055",
    websiteUrl: "https://www.durhamregiontransit.com/routes-and-schedules/specialized-services/",
    bookingUrl: "https://www.durhamregiontransit.com/routes-and-schedules/on-demand-and-specialized-services/",
    sourceUrl: "https://www.durhamregiontransit.com/routes-and-schedules/on-demand-and-specialized-services/",
  },
  {
    id: "hamilton-darts",
    agencyName: "DARTS",
    phone: "905-529-1717",
    websiteUrl: "https://www.hamilton.ca/home-neighbourhood/hsr/accessible-transit/darts",
    bookingUrl: "https://www.dartstransit.com",
    sourceUrl: "https://www.hamilton.ca/home-neighbourhood/hsr/accessible-transit/darts",
  },
  {
    id: "london-specialized",
    agencyName: "Specialized Transit",
    phone: "519-453-3444",
    websiteUrl: "https://www.londontransit.ca/our-services/specialized-transit/",
    bookingUrl: "https://www.londontransit.ca/booking-specialized-transit-services/",
    sourceUrl: "https://www.londontransit.ca/booking-specialized-transit-services/",
  },
] as const;

describe("paratransit directory", () => {
  it("keeps a source, a retrieval date, and a tier on every verified entry", () => {
    expect(PARATRANSIT.map((entry) => entry.id)).toEqual(VERIFIED.map((entry) => entry.id));
    const blob = JSON.stringify(PARATRANSIT);
    for (const pattern of FORBIDDEN) expect(blob).not.toMatch(pattern);
    expect(blob).not.toMatch(/OC Transpo|Para Transpo|Mobility Plus/i);
    for (const expected of VERIFIED) {
      const entry = PARATRANSIT.find((item) => item.id === expected.id);
      expect(entry).toMatchObject({
        ...expected,
        retrievedOn: "2026-11-14",
        verificationTier: "administrator_page",
        notEligibilityAdvice: true,
      });
      expect(entry?.sourceUrl).toMatch(/^https:\/\//);
      expect(entry?.licenceNote.en.length).toBeGreaterThan(0);
      expect(entry?.licenceNote.fr.length).toBeGreaterThan(0);
      expect(paratransitErrors(entry)).toEqual([]);
      const digits = expected.phone.replace(/\D/g, "");
      expect(publishedPhoneHref(expected.phone)).toBe(digits.length === 10 ? `tel:+1${digits}` : `tel:+${digits}`);
    }
  });

  it("fails when a source, a date, or a tier is removed", () => {
    const entry = PARATRANSIT[0];
    expect(entry).toBeDefined();
    if (!entry) return;
    const withoutSource = { ...entry } as Record<string, unknown>;
    const withoutDate = { ...entry } as Record<string, unknown>;
    const withoutTier = { ...entry } as Record<string, unknown>;
    delete withoutSource.sourceUrl;
    delete withoutDate.retrievedOn;
    delete withoutTier.verificationTier;
    expect(paratransitErrors(withoutSource).join(" ")).toMatch(/sourceUrl/);
    expect(paratransitErrors(withoutDate).join(" ")).toMatch(/retrievedOn/);
    expect(paratransitErrors(withoutTier).join(" ")).toMatch(/verificationTier/);
    expect(paratransitErrors({ ...entry, verificationTier: "guess" }).join(" ")).toMatch(/verificationTier/);
    expect(() => publishedPhoneHref("555")).toThrow(/Refusing to guess/);
  });

  it("links each agency in English and French without eligibility copy", async () => {
    const { container } = render(<ParatransitDirectory />);
    expect(screen.getByRole("note").textContent).toMatch(/not eligibility advice/i);
    expect(screen.getAllByText(/Desk check, tier administrator_page\. Unverified by the App\./)).toHaveLength(PARATRANSIT.length);
    expect(schema.properties.retrievedOn.description).toMatch(/UTC calendar date/);
    const readme = readFileSync("README.md", "utf8");
    expect(readme).toMatch(/retrievedOn` is a UTC calendar date/);
    expect(screen.getByRole("link", { name: "Wheel-Trans website" })).toHaveAttribute("href", "https://www.ttc.ca/wheel-trans");
    expect(screen.getByRole("link", { name: "Wheel-Trans booking page" })).toHaveAttribute("href", "https://mywheel-trans.ttc.ca");
    expect(screen.getByRole("link", { name: "Call 416-393-4222" })).toHaveAttribute("href", "tel:+14163934222");
    expect(screen.getByRole("link", { name: "Call 905-529-1717" })).toHaveAttribute("href", "tel:+19055291717");
    expect(screen.queryByText(/you qualify|days in advance|OC Transpo/i)).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Search agencies"), "DARTS");
    expect(screen.getByRole("link", { name: "DARTS website" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Wheel-Trans website" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Français" }));
    expect(screen.getByRole("note").textContent).toMatch(/avis d'admissibilité/);
    expect(screen.getByText(/Vérification au bureau, niveau administrator_page\. Non vérifié par l'application\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Site web de DARTS" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Appeler le 905-529-1717" })).toHaveAttribute("href", "tel:+19055291717");
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
