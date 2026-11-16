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
  {
    id: "ottawa-para-transpo",
    agencyName: "Para Transpo",
    phone: "613-560-5000",
    websiteUrl: "https://octranspo.com/en/para-transpo/",
    bookingUrl: "https://octranspo.com/en/para-transpo/",
    sourceUrl: "https://octranspo.com/en/para-transpo/",
    retrievedOn: "2026-11-16",
  },
  {
    id: "waterloo-mobilityplus",
    agencyName: "MobilityPLUS",
    phone: "519-744-2241",
    websiteUrl: "https://www.grt.ca/mobilityplus/mobilityplus-booking-riding-and-notifications/booking-mobilityplus-trips/",
    bookingUrl: "https://mplus.grt.ca/Account/Login",
    sourceUrl: "https://www.grt.ca/mobilityplus/mobilityplus-booking-riding-and-notifications/booking-mobilityplus-trips/",
    retrievedOn: "2026-11-16",
  },
  {
    id: "sudbury-gova-plus",
    agencyName: "GOVA Plus Specialized Transit",
    phone: "705-670-2300",
    websiteUrl: "https://www.greatersudbury.ca/live/transit/gova-plus-specialized-transit/riding-gova-plus/booking-your-trip/",
    bookingUrl: "https://book.govaplus.rideco.com/",
    sourceUrl: "https://www.greatersudbury.ca/live/transit/gova-plus-specialized-transit/riding-gova-plus/booking-your-trip/",
    retrievedOn: "2026-11-16",
  },
  {
    id: "oakville-care-a-van",
    agencyName: "care-A-van",
    phone: "905-337-9222",
    tel: "tel:+19053379222",
    websiteUrl: "https://www.oakvilletransit.ca/accessibility/care-a-van/",
    bookingUrl: "https://www.oakvilletransit.ca/accessibility/care-a-van/",
    sourceUrl: "https://www.oakvilletransit.ca/accessibility/care-a-van/",
    retrievedOn: "2026-11-16",
  },
  {
    id: "barrie-specialized",
    agencyName: "Specialized Transit",
    phone: "705-792-5033",
    tel: "tel:+17057925033",
    websiteUrl: "https://www.barrie.ca/services-payments/transportation-parking/barrie-transit/specialized-transit",
    bookingUrl: "https://portal.myridebarrie.ca",
    sourceUrl: "https://www.barrie.ca/services-payments/transportation-parking/barrie-transit/specialized-transit",
    retrievedOn: "2026-11-16",
  },
  {
    id: "guelph-mobility-services",
    agencyName: "Mobility Services",
    phone: "519-822-1811 extension 2801",
    tel: "tel:+15198221811;ext=2801",
    websiteUrl: "https://guelph.ca/living/getting-around/bus/mobility-service/",
    bookingUrl: "https://guelph.ca/living/getting-around/bus/mobility-service/scheduling-ride/",
    sourceUrl: "https://guelph.ca/living/getting-around/bus/mobility-service/",
    retrievedOn: "2026-11-16",
  },
  {
    id: "thunder-bay-lift-plus",
    agencyName: "Lift+ Specialized Transit",
    phone: "807-345-0777",
    tel: "tel:+18073450777",
    websiteUrl: "https://www.thunderbay.ca/city-services/transit/liftplus-specialized-transit/",
    bookingUrl: "https://www.thunderbay.ca/city-services/transit/liftplus-specialized-transit/",
    sourceUrl: "https://www.thunderbay.ca/city-services/transit/liftplus-specialized-transit/",
    retrievedOn: "2026-11-16",
  },
  {
    id: "brantford-lift",
    agencyName: "Brantford Lift",
    phone: "519-752-4444",
    tel: "tel:+15197524444",
    websiteUrl: "https://www.brantford.ca/transportation/brantford-lift/",
    bookingUrl: "https://www.brantford.ca/transportation/brantford-lift/book-your-ride/",
    sourceUrl: "https://www.brantford.ca/transportation/brantford-lift/book-your-ride/",
    retrievedOn: "2026-11-16",
  },
  {
    id: "niagara-specialized",
    agencyName: "Specialized Transit",
    phone: "1-833-678-5463",
    tel: "tel:+18336785463",
    websiteUrl: "https://nrtransit.ca/specialized-transit/",
    bookingUrl: "https://book.niagaratransitplus.rideco.com/login",
    sourceUrl: "https://nrtransit.ca/specialized-transit/",
    retrievedOn: "2026-11-16",
  },
  {
    id: "milton-access-plus",
    agencyName: "Milton access+",
    phone: "905-875-5417",
    tel: "tel:+19058755417",
    websiteUrl: "https://www.milton.ca/parking-transportation/transit/schedules/milton-accessplus/",
    bookingUrl: "https://www.milton.ca/parking-transportation/transit/schedules/milton-accessplus/",
    sourceUrl: "https://www.milton.ca/parking-transportation/transit/schedules/milton-accessplus/",
    retrievedOn: "2026-11-16",
  },
  {
    id: "burlington-specialized",
    agencyName: "Burlington Specialized Transit",
    phone: "905-639-5158",
    tel: "tel:+19056395158",
    websiteUrl: "https://www.burlington.ca/transit/specialized-transit/",
    bookingUrl: "https://hvbooking.burlington.ca/Account/Login",
    sourceUrl: "https://www.burlington.ca/transit/specialized-transit/",
    retrievedOn: "2026-11-16",
  },
  {
    id: "kingston-access-bus",
    agencyName: "Kingston Access Bus",
    phone: "613-542-2512",
    tel: "tel:+16135422512",
    websiteUrl: "https://www.kingstonaccessbus.net/",
    bookingUrl: "https://www.kingstonaccessbus.net/information",
    sourceUrl: "https://www.kingstonaccessbus.net/information",
    retrievedOn: "2026-11-16",
  },
  {
    id: "peterborough-accessible-van",
    agencyName: "Accessible Van Service",
    phone: "705-745-5801",
    tel: "tel:+17057455801",
    websiteUrl: "https://www.peterborough.ca/living-in-peterborough/transit/accessible-van-service/",
    bookingUrl: "https://www.peterborough.ca/living-in-peterborough/transit/accessible-van-service/",
    sourceUrl: "https://www.peterborough.ca/living-in-peterborough/transit/accessible-van-service/",
    retrievedOn: "2026-11-16",
  },
  {
    id: "kawartha-lakes-limo",
    agencyName: "LIMO Specialized Transit",
    phone: "705-324-3331",
    tel: "tel:+17053243331",
    websiteUrl: "https://www.kawarthalakes.ca/property-environment/transportation-and-transit/accessible-and-specialized-transit/",
    bookingUrl: "https://portal.kawarthalakes.ca/",
    sourceUrl: "https://www.kawarthalakes.ca/property-environment/transportation-and-transit/accessible-and-specialized-transit/",
    retrievedOn: "2026-11-16",
  },
  {
    id: "sarnia-care-a-van",
    agencyName: "Care-A-Van",
    phone: "519-332-0330 Ext 5309",
    tel: "tel:+15193320330;ext=5309",
    websiteUrl: "https://www.sarnia.ca/living-here/getting-around/sarnia-transit/care-a-van-3/",
    bookingUrl: "https://booksarniacareavan.tripsparkhost.com/",
    sourceUrl: "https://www.sarnia.ca/care-a-van-booking-requests/",
    retrievedOn: "2026-11-16",
  },
  {
    id: "sault-ste-marie-parabus",
    agencyName: "Parabus",
    phone: "705-942-1404",
    tel: "tel:+17059421404",
    websiteUrl: "https://saultstemarie.ca/live/transit/parabus-transit/",
    bookingUrl: "https://saultstemarie.ca/live/transit/parabus-transit/",
    sourceUrl: "https://saultstemarie.ca/live/transit/parabus-transit/",
    retrievedOn: "2026-11-16",
  },
  {
    id: "halton-hills-activan",
    agencyName: "ActiVan",
    phone: "905-702-6435",
    tel: "tel:+19057026435",
    websiteUrl: "https://www.haltonhills.ca/ActiVan",
    bookingUrl: "https://hhtransit.tripsparkhost.com/Account/Login",
    sourceUrl: "https://www.haltonhills.ca/ActiVan",
    retrievedOn: "2026-11-16",
  },
  {
    id: "north-bay-parabus",
    agencyName: "ParaBus",
    phone: "705-476-5530",
    tel: "tel:+17054765530",
    websiteUrl: "https://northbay.ca/city-services/north-bay-transit/accessibility/",
    bookingUrl: "https://northbay.ca/city-services/north-bay-transit/accessibility/",
    sourceUrl: "https://northbay.ca/city-services/north-bay-transit/accessibility/",
    retrievedOn: "2026-11-16",
  },
  {
    id: "belleville-mobility-bus",
    agencyName: "Mobility Bus",
    phone: "613-962-1925",
    tel: "tel:+16139621925",
    websiteUrl: "https://www.belleville.ca/walk-ride-and-drive/transit/mobility-bus/",
    bookingUrl: "https://book.btletsgo.rideco.com/login",
    sourceUrl: "https://www.belleville.ca/walk-ride-and-drive/transit/mobility-bus/",
    retrievedOn: "2026-11-16",
  },
  {
    id: "quinte-transit-specialized",
    agencyName: "Specialized Services",
    phone: "613-392-9640",
    tel: "tel:+16133929640",
    websiteUrl: "https://quintetransit.ca/specialized-service-faqs",
    bookingUrl: "https://quintetransit.ca/bookings",
    sourceUrl: "https://quintetransit.ca/bookings",
    retrievedOn: "2026-11-16",
  },
  {
    id: "timmins-paratransit",
    agencyName: "Paratransit Service",
    phone: "705-360-2600 ext. 3504",
    tel: "tel:+17053602600;ext=3504",
    websiteUrl: "https://www.timmins.ca/our_services/timmins_transit/paratransit_service",
    bookingUrl: "https://www.timmins.ca/our_services/timmins_transit/paratransit_service",
    sourceUrl: "https://www.timmins.ca/our_services/timmins_transit/paratransit_service",
    retrievedOn: "2026-11-16",
  },
  {
    id: "woodstock-specialized",
    agencyName: "Specialized Transit",
    phone: "519-539-2382 ext. 2510",
    tel: "tel:+15195392382;ext=2510",
    websiteUrl: "https://www.cityofwoodstock.ca/parking-roads-transit/woodstock-transit/specialized-transit/",
    bookingUrl: "https://forms.cityofwoodstock.ca/Clerks/Para-Transit-Form/Para-Transit-Electronic-Booking-Request-Form",
    sourceUrl: "https://www.cityofwoodstock.ca/parking-roads-transit/woodstock-transit/specialized-transit/",
    retrievedOn: "2026-11-16",
  },
  {
    id: "st-thomas-parallel-transit",
    agencyName: "Parallel Transit Services",
    phone: "519-631-0001",
    tel: "tel:+15196310001",
    websiteUrl: "https://www.stthomas.ca/living-in-st-thomas/transit/accessible-transit/parallel-transit-services/",
    bookingUrl: "https://www.stthomas.ca/living-in-st-thomas/transit/accessible-transit/parallel-transit-services/",
    sourceUrl: "https://www.stthomas.ca/living-in-st-thomas/transit/accessible-transit/parallel-transit-services/",
    retrievedOn: "2026-11-16",
  },
] as const;

describe("paratransit directory", () => {
  it("keeps a source, a retrieval date, and a tier on every verified entry", () => {
    expect(PARATRANSIT.map((entry) => entry.id)).toEqual(VERIFIED.map((entry) => entry.id));
    const blob = JSON.stringify(PARATRANSIT);
    for (const pattern of FORBIDDEN) expect(blob).not.toMatch(pattern);
    // York Region's former service name was never read from a page and stays out.
    expect(blob).not.toMatch(/Mobility Plus/);
    for (const expected of VERIFIED) {
      const entry = PARATRANSIT.find((item) => item.id === expected.id);
      const { tel: _tel, ...facts } = { tel: "", ...expected };
      expect(entry).toMatchObject({
        retrievedOn: "2026-11-14",
        ...facts,
        verificationTier: "administrator_page",
        notEligibilityAdvice: true,
      });
      expect(entry?.sourceUrl).toMatch(/^https:\/\//);
      expect(entry?.licenceNote.en.length).toBeGreaterThan(0);
      expect(entry?.licenceNote.fr.length).toBeGreaterThan(0);
      expect(paratransitErrors(entry)).toEqual([]);
      const digits = expected.phone.replace(/\D/g, "");
      const plain = digits.length === 10 ? `tel:+1${digits}` : `tel:+${digits}`;
      expect(publishedPhoneHref(expected.phone)).toBe("tel" in expected ? expected.tel : plain);
    }
  });

  it("keeps a printed extension out of the dialled number", () => {
    expect(publishedPhoneHref("519-539-2382 ext. 2510")).toBe("tel:+15195392382;ext=2510");
    expect(publishedPhoneHref("519-332-0330 Ext 5309")).toBe("tel:+15193320330;ext=5309");
    expect(publishedPhoneHref("519-822-1811 extension 2801")).toBe("tel:+15198221811;ext=2801");
    expect(publishedPhoneHref("1-833-678-5463")).toBe("tel:+18336785463");
    expect(() => publishedPhoneHref("555 ext. 12")).toThrow(/Refusing to guess/);
    expect(() => publishedPhoneHref("519-539-2382 option 2")).toThrow(/Refusing to guess/);
    const published = PARATRANSIT.filter((entry) => /ext/i.test(entry.phone)).map((entry) => entry.id);
    expect(published).toEqual(["guelph-mobility-services", "sarnia-care-a-van", "timmins-paratransit", "woodstock-specialized"]);
  });

  it("lists each service once and keeps the stored facts unique", () => {
    expect(PARATRANSIT).toHaveLength(29);
    expect(new Set(PARATRANSIT.map((entry) => entry.id)).size).toBe(PARATRANSIT.length);
    expect(new Set(PARATRANSIT.map((entry) => entry.sourceUrl)).size).toBe(PARATRANSIT.length);
    expect(PARATRANSIT.filter((entry) => entry.retrievedOn === "2026-11-14")).toHaveLength(6);
    expect(PARATRANSIT.filter((entry) => entry.retrievedOn === "2026-11-16")).toHaveLength(23);
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
    expect(screen.queryByText(/you qualify|days in advance/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Call 613-560-5000" })).toHaveAttribute("href", "tel:+16135605000");
    expect(screen.getAllByText(/Not stated on the page that was read/)).toHaveLength(10);
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
