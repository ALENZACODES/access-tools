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

/** Entries read on a later UTC date carry that date. */
const RETRIEVED_ON_2026_11_16 = "2026-11-16";

/** Used when the page that was read does not describe the service area. Nothing is inferred from the agency's name. */
const AREA_NOT_STATED: ParatransitEntry["serviceArea"] = {
  en: "Not stated on the page that was read",
  fr: "Non précisé sur la page consultée",
};

function entry(
  partial: Omit<ParatransitEntry, "schemaVersion" | "retrievedOn" | "verificationTier" | "licenceNote" | "notEligibilityAdvice">,
  retrievedOn: string = RETRIEVED_ON,
): ParatransitEntry {
  return {
    schemaVersion: "paratransit-entry-1.0.0",
    retrievedOn,
    verificationTier: "administrator_page",
    licenceNote: LICENCE,
    notEligibilityAdvice: true,
    ...partial,
  };
}

/**
 * The first six entries were read from each agency's own site on 14 November 2026 (UTC).
 * Para Transpo, MobilityPLUS and GOVA Plus were read on 16 November 2026 (UTC) and carry that date.
 * The Para Transpo page names an online booking system and does not print its address, so the booking link is the page itself.
 * The MobilityPLUS and GOVA Plus pages do not describe a service area, so none is stored.
 * Kingston Access Bus stays out: the Kingston Transit accessibility page read on 16 November 2026 gives no booking phone for it.
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
  entry({
    id: "ottawa-para-transpo",
    agencyName: "Para Transpo",
    publisher: "OC Transpo",
    serviceArea: {
      en: "Ottawa's urban communities, as the page describes it",
      fr: "Les collectivités urbaines d'Ottawa, selon la page",
    },
    websiteUrl: "https://octranspo.com/en/para-transpo/",
    bookingUrl: "https://octranspo.com/en/para-transpo/",
    phone: "613-560-5000",
    sourceUrl: "https://octranspo.com/en/para-transpo/",
    sourceName: "OC Transpo Para Transpo page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "waterloo-mobilityplus",
    agencyName: "MobilityPLUS",
    publisher: "Grand River Transit",
    serviceArea: AREA_NOT_STATED,
    websiteUrl: "https://www.grt.ca/mobilityplus/mobilityplus-booking-riding-and-notifications/booking-mobilityplus-trips/",
    bookingUrl: "https://mplus.grt.ca/Account/Login",
    phone: "519-744-2241",
    sourceUrl: "https://www.grt.ca/mobilityplus/mobilityplus-booking-riding-and-notifications/booking-mobilityplus-trips/",
    sourceName: "Grand River Transit MobilityPLUS booking page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "sudbury-gova-plus",
    agencyName: "GOVA Plus Specialized Transit",
    publisher: "City of Greater Sudbury",
    serviceArea: AREA_NOT_STATED,
    websiteUrl: "https://www.greatersudbury.ca/live/transit/gova-plus-specialized-transit/riding-gova-plus/booking-your-trip/",
    bookingUrl: "https://book.govaplus.rideco.com/",
    phone: "705-670-2300",
    sourceUrl: "https://www.greatersudbury.ca/live/transit/gova-plus-specialized-transit/riding-gova-plus/booking-your-trip/",
    sourceName: "City of Greater Sudbury GOVA Plus booking page",
  }, RETRIEVED_ON_2026_11_16),
];
