import type { ParatransitEntry } from "./types.js";

/** tel: link built only from the digits in the published phone string. */
export function publishedPhoneHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (/^[2-9]\d{9}$/.test(digits)) return `tel:+1${digits}`;
  if (/^1[2-9]\d{9}$/.test(digits)) return `tel:+${digits}`;
  throw new Error(`Refusing to guess a phone link for ${JSON.stringify(phone)}`);
}

const LICENCE: ParatransitEntry["licenceNote"] = {
  en: "Link only. The agency page is not copied here and is not claimed as open data.",
  fr: "Lien seulement. La page de l'organisme n'est pas copiée ici et n'est pas présentée comme des données ouvertes.",
};

const RETRIEVED_ON = "2026-11-14";

function entry(partial: Omit<ParatransitEntry, "schemaVersion" | "retrievedOn" | "verificationTier" | "licenceNote" | "notEligibilityAdvice">): ParatransitEntry {
  return {
    schemaVersion: "paratransit-entry-1.0.0",
    retrievedOn: RETRIEVED_ON,
    verificationTier: "administrator_page",
    licenceNote: LICENCE,
    notEligibilityAdvice: true,
    ...partial,
  };
}

/**
 * Read from each agency's own site on 14 November 2026 (UTC).
 * OC Transpo Para Transpo stays out. A retry of https://www.octranspo.com/en/para-transpo/ on that UTC date returned HTTP 403, so the phone and booking link were not read.
 * No booking window is stored.
 */
export const PARATRANSIT: readonly ParatransitEntry[] = [
  entry({
    id: "wheel-trans",
    agencyName: "Wheel-Trans",
    publisher: "TTC",
    serviceArea: { en: "City of Toronto", fr: "Ville de Toronto" },
    websiteUrl: "https://www.ttc.ca/wheel-trans",
    bookingUrl: "https://mywheel-trans.ttc.ca",
    phone: "416-393-4222",
    sourceUrl: "https://www.ttc.ca/wheel-trans/contact-us",
    sourceName: "TTC Wheel-Trans contact page",
  }),
  entry({
    id: "transhelp",
    agencyName: "TransHelp",
    publisher: "Peel Region",
    serviceArea: { en: "Brampton, Caledon, and Mississauga", fr: "Brampton, Caledon et Mississauga" },
    websiteUrl: "https://peelregion.ca/transhelp",
    bookingUrl: "https://peelregion.ca/services/book-or-change-transhelp-trip",
    phone: "905-791-1015",
    sourceUrl: "https://peelregion.ca/services/book-or-change-transhelp-trip",
    sourceName: "Peel Region TransHelp booking page",
  }),
  entry({
    id: "york-mobility-on-request",
    agencyName: "Mobility On-Request Paratransit",
    publisher: "York Region Transit",
    serviceArea: { en: "York Region", fr: "Région de York" },
    websiteUrl: "https://www.yrt.ca/en/schedules-and-maps/mobility-on-request.aspx",
    bookingUrl: "https://www.yrt.ca/en/schedules-and-maps/booking-your-trip.aspx",
    phone: "1-888-762-2950",
    sourceUrl: "https://www.yrt.ca/en/schedules-and-maps/booking-your-trip.aspx",
    sourceName: "York Region Transit booking page",
  }),
  entry({
    id: "durham-specialized",
    agencyName: "Specialized Services",
    publisher: "Durham Region Transit",
    serviceArea: { en: "Durham Region", fr: "Région de Durham" },
    websiteUrl: "https://www.durhamregiontransit.com/routes-and-schedules/specialized-services/",
    bookingUrl: "https://www.durhamregiontransit.com/routes-and-schedules/on-demand-and-specialized-services/",
    phone: "1-866-247-0055",
    sourceUrl: "https://www.durhamregiontransit.com/routes-and-schedules/on-demand-and-specialized-services/",
    sourceName: "Durham Region Transit On Demand and Specialized Services page",
  }),
  entry({
    id: "hamilton-darts",
    agencyName: "DARTS",
    publisher: "City of Hamilton",
    serviceArea: { en: "Hamilton", fr: "Hamilton" },
    websiteUrl: "https://www.hamilton.ca/home-neighbourhood/hsr/accessible-transit/darts",
    bookingUrl: "https://www.dartstransit.com",
    phone: "905-529-1717",
    sourceUrl: "https://www.hamilton.ca/home-neighbourhood/hsr/accessible-transit/darts",
    sourceName: "City of Hamilton DARTS page",
  }),
  entry({
    id: "london-specialized",
    agencyName: "Specialized Transit",
    publisher: "London Transit Commission",
    serviceArea: { en: "London", fr: "London" },
    websiteUrl: "https://www.londontransit.ca/our-services/specialized-transit/",
    bookingUrl: "https://www.londontransit.ca/booking-specialized-transit-services/",
    phone: "519-453-3444",
    sourceUrl: "https://www.londontransit.ca/booking-specialized-transit-services/",
    sourceName: "London Transit Commission booking page",
  }),
];
