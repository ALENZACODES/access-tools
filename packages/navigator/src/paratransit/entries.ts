import type { ParatransitEntry } from "./types.js";

/** A printed extension after the number: "ext. 2510", "Ext 5309", "extension 2801" or "x240". */
const PRINTED_EXTENSION = /^(.*\d)\s*,?\s*(?:ext(?:ension)?\.?|x)\s*(\d{1,6})$/i;

/**
 * tel: link built only from the digits in the published phone string.
 * A printed extension is kept as the RFC 3966 `;ext=` parameter and is never dialled as part of the number.
 */
export function publishedPhoneHref(phone: string): string {
  const printed = PRINTED_EXTENSION.exec(phone.trim());
  const main = printed?.[1] ?? phone;
  const extension = printed?.[2] ? `;ext=${printed[2]}` : "";
  const digits = main.replace(/\D/g, "");
  if (/^[2-9]\d{9}$/.test(digits)) return `tel:+1${digits}${extension}`;
  if (/^1[2-9]\d{9}$/.test(digits)) return `tel:+${digits}${extension}`;
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

/** "As the page describes it" marks wording taken from the page rather than a boundary checked by the App. */
function asDescribed(en: string, fr: string): ParatransitEntry["serviceArea"] {
  return { en: `${en}, as the page describes it`, fr: `${fr}, selon la page` };
}

/**
 * The first six entries were read from each agency's own site on 14 November 2026 (UTC).
 * Every other entry was read on 16 November 2026 (UTC) and carries that date.
 * The Para Transpo page names an online booking system and does not print its address, so the booking link is the page itself.
 * The same is done wherever a page gives no booking address on the publisher's own site or on a booking system it names.
 * Where a page does not describe a service area, none is stored. Nothing is inferred from the agency's name.
 * The phone is the number the page prints for the service. A printed extension is kept; menu choices such as "press 1" are not stored.
 * A service is left out when its page prints no phone for it or when no official page could be read.
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
  entry({
    id: "oakville-care-a-van",
    agencyName: "care-A-van",
    publisher: "Oakville Transit",
    serviceArea: asDescribed("Within the municipal boundary of Oakville", "À l'intérieur des limites municipales d'Oakville"),
    websiteUrl: "https://www.oakvilletransit.ca/accessibility/care-a-van/",
    bookingUrl: "https://www.oakvilletransit.ca/accessibility/care-a-van/",
    phone: "905-337-9222",
    sourceUrl: "https://www.oakvilletransit.ca/accessibility/care-a-van/",
    sourceName: "Oakville Transit care-A-van page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "barrie-specialized",
    agencyName: "Specialized Transit",
    publisher: "City of Barrie",
    serviceArea: asDescribed("Within the City of Barrie limits", "Dans les limites de la ville de Barrie"),
    websiteUrl: "https://www.barrie.ca/services-payments/transportation-parking/barrie-transit/specialized-transit",
    bookingUrl: "https://portal.myridebarrie.ca",
    phone: "705-792-5033",
    sourceUrl: "https://www.barrie.ca/services-payments/transportation-parking/barrie-transit/specialized-transit",
    sourceName: "City of Barrie Specialized Transit page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "guelph-mobility-services",
    agencyName: "Mobility Services",
    publisher: "City of Guelph",
    serviceArea: asDescribed("Within the city limits of Guelph", "Dans les limites de la ville de Guelph"),
    websiteUrl: "https://guelph.ca/living/getting-around/bus/mobility-service/",
    bookingUrl: "https://guelph.ca/living/getting-around/bus/mobility-service/scheduling-ride/",
    phone: "519-822-1811 extension 2801",
    sourceUrl: "https://guelph.ca/living/getting-around/bus/mobility-service/",
    sourceName: "City of Guelph Mobility Services page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "thunder-bay-lift-plus",
    agencyName: "Lift+ Specialized Transit",
    publisher: "City of Thunder Bay",
    serviceArea: asDescribed("Most locations within city limits", "La plupart des endroits dans les limites de la ville"),
    websiteUrl: "https://www.thunderbay.ca/city-services/transit/liftplus-specialized-transit/",
    bookingUrl: "https://www.thunderbay.ca/city-services/transit/liftplus-specialized-transit/",
    phone: "807-345-0777",
    sourceUrl: "https://www.thunderbay.ca/city-services/transit/liftplus-specialized-transit/",
    sourceName: "City of Thunder Bay Lift+ Specialized Transit page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "brantford-lift",
    agencyName: "Brantford Lift",
    publisher: "City of Brantford",
    serviceArea: AREA_NOT_STATED,
    websiteUrl: "https://www.brantford.ca/transportation/brantford-lift/",
    bookingUrl: "https://www.brantford.ca/transportation/brantford-lift/book-your-ride/",
    phone: "519-752-4444",
    sourceUrl: "https://www.brantford.ca/transportation/brantford-lift/book-your-ride/",
    sourceName: "City of Brantford Book Your Ride page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "niagara-specialized",
    agencyName: "Specialized Transit",
    publisher: "Niagara Region Transit",
    serviceArea: {
      en: "Fort Erie, Grimsby, Lincoln, Niagara Falls, Niagara-on-the-Lake, Pelham, Port Colborne, St. Catharines, Thorold, Wainfleet, Welland, and West Lincoln, as the page lists them. The page says the service differs by area.",
      fr: "Fort Erie, Grimsby, Lincoln, Niagara Falls, Niagara-on-the-Lake, Pelham, Port Colborne, St. Catharines, Thorold, Wainfleet, Welland et West Lincoln, selon la liste de la page. La page indique que le service varie selon le secteur.",
    },
    websiteUrl: "https://nrtransit.ca/specialized-transit/",
    bookingUrl: "https://book.niagaratransitplus.rideco.com/login",
    phone: "1-833-678-5463",
    sourceUrl: "https://nrtransit.ca/specialized-transit/",
    sourceName: "Niagara Region Transit Specialized Transit page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "milton-access-plus",
    agencyName: "Milton access+",
    publisher: "Town of Milton",
    serviceArea: asDescribed("The urban areas of Milton", "Les secteurs urbains de Milton"),
    websiteUrl: "https://www.milton.ca/parking-transportation/transit/schedules/milton-accessplus/",
    bookingUrl: "https://www.milton.ca/parking-transportation/transit/schedules/milton-accessplus/",
    phone: "905-875-5417",
    sourceUrl: "https://www.milton.ca/parking-transportation/transit/schedules/milton-accessplus/",
    sourceName: "Town of Milton access+ page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "burlington-specialized",
    agencyName: "Burlington Specialized Transit",
    publisher: "Burlington Transit",
    serviceArea: asDescribed("Any location in Burlington", "Tout endroit à Burlington"),
    websiteUrl: "https://www.burlington.ca/transit/specialized-transit/",
    bookingUrl: "https://hvbooking.burlington.ca/Account/Login",
    phone: "905-639-5158",
    sourceUrl: "https://www.burlington.ca/transit/specialized-transit/",
    sourceName: "Burlington Transit Specialized Transit page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "kingston-access-bus",
    agencyName: "Kingston Access Bus",
    publisher: "Kingston Access Bus Services",
    serviceArea: asDescribed("The City of Kingston boundaries", "Les limites de la ville de Kingston"),
    websiteUrl: "https://www.kingstonaccessbus.net/",
    bookingUrl: "https://www.kingstonaccessbus.net/information",
    phone: "613-542-2512",
    sourceUrl: "https://www.kingstonaccessbus.net/information",
    sourceName: "Kingston Access Bus Services information page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "peterborough-accessible-van",
    agencyName: "Accessible Van Service",
    publisher: "City of Peterborough",
    serviceArea: AREA_NOT_STATED,
    websiteUrl: "https://www.peterborough.ca/living-in-peterborough/transit/accessible-van-service/",
    bookingUrl: "https://www.peterborough.ca/living-in-peterborough/transit/accessible-van-service/",
    phone: "705-745-5801",
    sourceUrl: "https://www.peterborough.ca/living-in-peterborough/transit/accessible-van-service/",
    sourceName: "City of Peterborough Accessible Van Service page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "kawartha-lakes-limo",
    agencyName: "LIMO Specialized Transit",
    publisher: "City of Kawartha Lakes",
    serviceArea: asDescribed("Lindsay", "Lindsay"),
    websiteUrl: "https://www.kawarthalakes.ca/property-environment/transportation-and-transit/accessible-and-specialized-transit/",
    bookingUrl: "https://portal.kawarthalakes.ca/",
    phone: "705-324-3331",
    sourceUrl: "https://www.kawarthalakes.ca/property-environment/transportation-and-transit/accessible-and-specialized-transit/",
    sourceName: "City of Kawartha Lakes Accessible and Specialized Transit page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "sarnia-care-a-van",
    agencyName: "Care-A-Van",
    publisher: "City of Sarnia",
    serviceArea: asDescribed("The Sarnia and Point Edward areas", "Les secteurs de Sarnia et de Point Edward"),
    websiteUrl: "https://www.sarnia.ca/living-here/getting-around/sarnia-transit/care-a-van-3/",
    bookingUrl: "https://booksarniacareavan.tripsparkhost.com/",
    phone: "519-332-0330 Ext 5309",
    sourceUrl: "https://www.sarnia.ca/care-a-van-booking-requests/",
    sourceName: "City of Sarnia Care-A-Van Booking Requests page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "sault-ste-marie-parabus",
    agencyName: "Parabus",
    publisher: "City of Sault Ste. Marie",
    serviceArea: AREA_NOT_STATED,
    websiteUrl: "https://saultstemarie.ca/live/transit/parabus-transit/",
    bookingUrl: "https://saultstemarie.ca/live/transit/parabus-transit/",
    phone: "705-942-1404",
    sourceUrl: "https://saultstemarie.ca/live/transit/parabus-transit/",
    sourceName: "City of Sault Ste. Marie Parabus page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "halton-hills-activan",
    agencyName: "ActiVan",
    publisher: "Town of Halton Hills",
    serviceArea: AREA_NOT_STATED,
    websiteUrl: "https://www.haltonhills.ca/ActiVan",
    bookingUrl: "https://hhtransit.tripsparkhost.com/Account/Login",
    phone: "905-702-6435",
    sourceUrl: "https://www.haltonhills.ca/ActiVan",
    sourceName: "Town of Halton Hills ActiVan page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "north-bay-parabus",
    agencyName: "ParaBus",
    publisher: "City of North Bay",
    serviceArea: AREA_NOT_STATED,
    websiteUrl: "https://northbay.ca/city-services/north-bay-transit/accessibility/",
    bookingUrl: "https://northbay.ca/city-services/north-bay-transit/accessibility/",
    phone: "705-476-5530",
    sourceUrl: "https://northbay.ca/city-services/north-bay-transit/accessibility/",
    sourceName: "City of North Bay transit accessibility page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "belleville-mobility-bus",
    agencyName: "Mobility Bus",
    publisher: "City of Belleville",
    serviceArea: asDescribed("Within the boundaries of Belleville (Ward 1 and Ward 2)", "Dans les limites de Belleville (quartiers 1 et 2)"),
    websiteUrl: "https://www.belleville.ca/walk-ride-and-drive/transit/mobility-bus/",
    bookingUrl: "https://book.btletsgo.rideco.com/login",
    phone: "613-962-1925",
    sourceUrl: "https://www.belleville.ca/walk-ride-and-drive/transit/mobility-bus/",
    sourceName: "City of Belleville Mobility Bus page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "quinte-transit-specialized",
    agencyName: "Specialized Services",
    publisher: "Quinte Transit",
    serviceArea: asDescribed(
      "All wards within the City of Quinte West and the Municipality of Brighton",
      "Tous les quartiers de la ville de Quinte West et de la municipalité de Brighton",
    ),
    websiteUrl: "https://quintetransit.ca/specialized-service-faqs",
    bookingUrl: "https://quintetransit.ca/bookings",
    phone: "613-392-9640",
    sourceUrl: "https://quintetransit.ca/bookings",
    sourceName: "Quinte Transit specialized services bookings page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "timmins-paratransit",
    agencyName: "Paratransit Service",
    publisher: "City of Timmins",
    serviceArea: AREA_NOT_STATED,
    websiteUrl: "https://www.timmins.ca/our_services/timmins_transit/paratransit_service",
    bookingUrl: "https://www.timmins.ca/our_services/timmins_transit/paratransit_service",
    phone: "705-360-2600 ext. 3504",
    sourceUrl: "https://www.timmins.ca/our_services/timmins_transit/paratransit_service",
    sourceName: "City of Timmins Paratransit Service page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "woodstock-specialized",
    agencyName: "Specialized Transit",
    publisher: "City of Woodstock",
    serviceArea: AREA_NOT_STATED,
    websiteUrl: "https://www.cityofwoodstock.ca/parking-roads-transit/woodstock-transit/specialized-transit/",
    bookingUrl: "https://forms.cityofwoodstock.ca/Clerks/Para-Transit-Form/Para-Transit-Electronic-Booking-Request-Form",
    phone: "519-539-2382 ext. 2510",
    sourceUrl: "https://www.cityofwoodstock.ca/parking-roads-transit/woodstock-transit/specialized-transit/",
    sourceName: "City of Woodstock Specialized Transit page",
  }, RETRIEVED_ON_2026_11_16),
  entry({
    id: "st-thomas-parallel-transit",
    agencyName: "Parallel Transit Services",
    publisher: "City of St. Thomas",
    serviceArea: AREA_NOT_STATED,
    websiteUrl: "https://www.stthomas.ca/living-in-st-thomas/transit/accessible-transit/parallel-transit-services/",
    bookingUrl: "https://www.stthomas.ca/living-in-st-thomas/transit/accessible-transit/parallel-transit-services/",
    phone: "519-631-0001",
    sourceUrl: "https://www.stthomas.ca/living-in-st-thomas/transit/accessible-transit/parallel-transit-services/",
    sourceName: "City of St. Thomas Parallel Transit Services page",
  }, RETRIEVED_ON_2026_11_16),
];
