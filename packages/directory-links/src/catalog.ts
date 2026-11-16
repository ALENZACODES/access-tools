import type { OfficialLink } from "./types";

const TBC = "To be confirmed";
const phEn = "Placeholder. The official address has not been verified yet, so no link is shown.";
const phFr = "Espace réservé. L’adresse officielle n’a pas encore été vérifiée ; aucun lien n’est affiché.";

function placeholder(
  id: string,
  group: OfficialLink["group"],
  titleEn: string,
  titleFr: string,
  publisher = TBC,
): OfficialLink {
  return {
    id, group, titleEn, titleFr, url: null, status: "needs-verification",
    publisher, retrieved_at: null, licence: "link-out", notesEn: phEn, notesFr: phFr,
  };
}

const READ_2026_11_16 = "2026-11-16";
const linkEn = "Link-out only. Opens the publisher’s own page. The page is in English.";
const linkFr = "Lien externe seulement. Ouvre la page de l’éditeur. La page est en anglais.";

/** A page on the publisher's own site that was read on the date given. Nothing from the page is copied. */
function listed(
  id: string,
  group: OfficialLink["group"],
  titleEn: string,
  titleFr: string,
  url: string,
  publisher: string,
  retrieved_at: string = READ_2026_11_16,
): OfficialLink {
  return {
    id, group, titleEn, titleFr, url, status: "listed",
    publisher, retrieved_at, licence: "link-out", notesEn: linkEn, notesFr: linkFr,
  };
}

export const catalog: OfficialLink[] = [
  {
    id: "211-ontario",
    group: "directory",
    titleEn: "211 Ontario",
    titleFr: "211 Ontario",
    url: "https://211ontario.ca/",
    status: "listed",
    publisher: "211 Ontario",
    retrieved_at: null,
    licence: "link-out",
    notesEn: "Link-out only. This App does not copy or redistribute 211 data.",
    notesFr: "Lien externe seulement. L’App ne copie ni ne redistribue les données de 211.",
  },
  {
    id: "benefits-wayfinder",
    group: "benefits",
    titleEn: "Benefits Wayfinder",
    titleFr: "Benefits Wayfinder",
    url: "https://benefitswayfinder.org/",
    status: "listed",
    publisher: "Benefits Wayfinder",
    retrieved_at: null,
    licence: "link-out",
    notesEn: "Link-out only. Opens the publisher’s own site.",
    notesFr: "Lien externe seulement. Ouvre le site de l’éditeur.",
  },
  // Read on 2026-11-16 (UTC). Each address is the agency's own booking page. Link-out only.
  {
    id: "para-transpo-ottawa",
    group: "transit",
    titleEn: "Para Transpo (Ottawa)",
    titleFr: "Para Transpo (Ottawa)",
    url: "https://octranspo.com/en/para-transpo/",
    status: "listed",
    publisher: "OC Transpo",
    retrieved_at: "2026-11-16",
    licence: "link-out",
    notesEn: "Link-out only. Opens the publisher’s own page. The page is in English.",
    notesFr: "Lien externe seulement. Ouvre la page de l’éditeur. La page est en anglais.",
  },
  {
    id: "mobilityplus-waterloo-region",
    group: "transit",
    titleEn: "MobilityPLUS trip booking",
    titleFr: "Réservation de trajets MobilityPLUS",
    url: "https://www.grt.ca/mobilityplus/mobilityplus-booking-riding-and-notifications/booking-mobilityplus-trips/",
    status: "listed",
    publisher: "Grand River Transit",
    retrieved_at: "2026-11-16",
    licence: "link-out",
    notesEn: "Link-out only. Opens the publisher’s own page. The page is in English.",
    notesFr: "Lien externe seulement. Ouvre la page de l’éditeur. La page est en anglais.",
  },
  {
    id: "gova-plus-sudbury",
    group: "transit",
    titleEn: "GOVA Plus trip booking",
    titleFr: "Réservation de trajets GOVA Plus",
    url: "https://www.greatersudbury.ca/live/transit/gova-plus-specialized-transit/riding-gova-plus/booking-your-trip/",
    status: "listed",
    publisher: "City of Greater Sudbury",
    retrieved_at: "2026-11-16",
    licence: "link-out",
    notesEn: "Link-out only. Opens the publisher’s own page. The page is in English.",
    notesFr: "Lien externe seulement. Ouvre la page de l’éditeur. La page est en anglais.",
  },
  // Read on 2026-11-16 (UTC). Each address is the specialized transit page on the publisher's own site. Link-out only.
  listed("care-a-van-oakville", "transit", "care-A-van (Oakville)", "care-A-van (Oakville)", "https://www.oakvilletransit.ca/accessibility/care-a-van/", "Oakville Transit"),
  listed("specialized-transit-barrie", "transit", "Specialized Transit (Barrie)", "Specialized Transit (Barrie)", "https://www.barrie.ca/services-payments/transportation-parking/barrie-transit/specialized-transit", "City of Barrie"),
  listed("mobility-services-guelph", "transit", "Mobility Services (Guelph)", "Mobility Services (Guelph)", "https://guelph.ca/living/getting-around/bus/mobility-service/", "City of Guelph"),
  listed("lift-plus-thunder-bay", "transit", "Lift+ Specialized Transit (Thunder Bay)", "Lift+ Specialized Transit (Thunder Bay)", "https://www.thunderbay.ca/city-services/transit/liftplus-specialized-transit/", "City of Thunder Bay"),
  listed("brantford-lift", "transit", "Brantford Lift", "Brantford Lift", "https://www.brantford.ca/transportation/brantford-lift/", "City of Brantford"),
  listed("specialized-transit-niagara", "transit", "Specialized Transit (Niagara)", "Specialized Transit (Niagara)", "https://nrtransit.ca/specialized-transit/", "Niagara Region Transit"),
  listed("milton-access-plus", "transit", "Milton access+", "Milton access+", "https://www.milton.ca/parking-transportation/transit/schedules/milton-accessplus/", "Town of Milton"),
  listed("specialized-transit-burlington", "transit", "Specialized Transit (Burlington)", "Specialized Transit (Burlington)", "https://www.burlington.ca/transit/specialized-transit/", "Burlington Transit"),
  listed("kingston-access-bus", "transit", "Kingston Access Bus", "Kingston Access Bus", "https://www.kingstonaccessbus.net/", "Kingston Access Bus Services"),
  listed("accessible-van-peterborough", "transit", "Accessible Van Service (Peterborough)", "Accessible Van Service (Peterborough)", "https://www.peterborough.ca/living-in-peterborough/transit/accessible-van-service/", "City of Peterborough"),
  listed("limo-kawartha-lakes", "transit", "LIMO Specialized Transit (Kawartha Lakes)", "LIMO Specialized Transit (Kawartha Lakes)", "https://www.kawarthalakes.ca/property-environment/transportation-and-transit/accessible-and-specialized-transit/", "City of Kawartha Lakes"),
  listed("care-a-van-sarnia", "transit", "Care-A-Van (Sarnia)", "Care-A-Van (Sarnia)", "https://www.sarnia.ca/living-here/getting-around/sarnia-transit/care-a-van-3/", "City of Sarnia"),
  listed("parabus-sault-ste-marie", "transit", "Parabus (Sault Ste. Marie)", "Parabus (Sault Ste. Marie)", "https://saultstemarie.ca/live/transit/parabus-transit/", "City of Sault Ste. Marie"),
  listed("activan-halton-hills", "transit", "ActiVan (Halton Hills)", "ActiVan (Halton Hills)", "https://www.haltonhills.ca/ActiVan", "Town of Halton Hills"),
  listed("parabus-north-bay", "transit", "ParaBus (North Bay)", "ParaBus (North Bay)", "https://northbay.ca/city-services/north-bay-transit/accessibility/", "City of North Bay"),
  listed("mobility-bus-belleville", "transit", "Mobility Bus (Belleville)", "Mobility Bus (Belleville)", "https://www.belleville.ca/walk-ride-and-drive/transit/mobility-bus/", "City of Belleville"),
  listed("specialized-services-quinte-transit", "transit", "Specialized services bookings (Quinte Transit)", "Réservations des services spécialisés (Quinte Transit)", "https://quintetransit.ca/bookings", "Quinte Transit"),
  listed("paratransit-timmins", "transit", "Paratransit Service (Timmins)", "Paratransit Service (Timmins)", "https://www.timmins.ca/our_services/timmins_transit/paratransit_service", "City of Timmins"),
  listed("specialized-transit-woodstock", "transit", "Specialized Transit (Woodstock)", "Specialized Transit (Woodstock)", "https://www.cityofwoodstock.ca/parking-roads-transit/woodstock-transit/specialized-transit/", "City of Woodstock"),
  listed("parallel-transit-st-thomas", "transit", "Parallel Transit Services (St. Thomas)", "Parallel Transit Services (St. Thomas)", "https://www.stthomas.ca/living-in-st-thomas/transit/accessible-transit/parallel-transit-services/", "City of St. Thomas"),
  // Read on 2026-11-16 (UTC). These two pages print no phone for the service, so they are links only and have no directory entry.
  listed("specialized-service-cornwall", "transit", "Accessible Transit (Cornwall)", "Accessible Transit (Cornwall)", "https://www.cornwall.ca/en/public-safety-transportation/transit/accessible-transit/", "City of Cornwall"),
  listed("specialized-transit-chatham-kent", "transit", "Specialized Transit Service Information (Chatham-Kent)", "Specialized Transit Service Information (Chatham-Kent)", "https://www.chatham-kent.ca/transit/specialized/Pages/Specialized-Service-FAQ.aspx", "Municipality of Chatham-Kent"),
  // Read on 2026-11-16 (UTC). Each page is a municipal or regional page that says how to reach an accessible taxi
  // or names taxi companies with accessible vehicles. Nothing from the page is copied and no availability is claimed.
  listed("wav-vaughan-accessible-taxis", "wav", "Accessible Taxis (City of Vaughan page)", "Taxis accessibles (page de la Ville de Vaughan)", "https://www.vaughan.ca/business/business-licensing-and-permits/accessible-taxis", "City of Vaughan"),
  listed("wav-waterloo-region-accessible-taxi-services", "wav", "Accessible Taxi Services (Region of Waterloo page)", "Services de taxi accessible (page de la Région de Waterloo)", "https://www.regionofwaterloo.ca/programs-and-services/accessibility-supports/accessible-taxi-services/", "Region of Waterloo"),
  listed("wav-hamilton-taxi-services", "wav", "Taxi Services in Hamilton (City of Hamilton page)", "Services de taxi à Hamilton (page de la Ville de Hamilton)", "https://www.hamilton.ca/home-neighbourhood/getting-around/driving-traffic/taxi-services-hamilton", "City of Hamilton"),
  listed("wav-kingston-taking-a-taxi", "wav", "Taking a Taxi (City of Kingston page)", "Prendre un taxi (page de la Ville de Kingston)", "https://www.cityofkingston.ca/roads-parking-and-transportation/taking-a-taxi/", "City of Kingston"),
  listed("wav-halton-hills-taxi-programs", "wav", "Taxi Programs (Town of Halton Hills page)", "Programmes de taxi (page de la Ville de Halton Hills)", "https://www.haltonhills.ca/Taxi-Programs", "Town of Halton Hills"),
  listed("wav-guelph-taxiscrip", "wav", "Mobility Services taxiSCRIP program (City of Guelph page)", "Programme taxiSCRIP des Mobility Services (page de la Ville de Guelph)", "https://guelph.ca/living/getting-around/bus/mobility-service/taxiscrip/", "City of Guelph"),
  listed("wav-peel-transhelp-taxi-vouchers", "wav", "TransHelp taxi vouchers (Peel Region page)", "Bons de taxi TransHelp (page de la Région de Peel)", "https://peelregion.ca/transhelp/fares-payments/taxi-vouchers", "Peel Region"),
  placeholder("disability-benefits-compass", "benefits", "Disability Benefits Compass", "Boussole des prestations d’invalidité"),
  placeholder("canada-benefits-finder", "benefits", "Canada Benefits Finder", "Chercheur de prestations du Canada"),
  placeholder("go-passenger-assistance", "transit", "GO passenger assistance", "Aide aux passagers GO", "GO Transit (Metrolinx)"),
  placeholder("via-assistance", "transit", "VIA assistance", "Assistance VIA", "VIA Rail Canada"),
  placeholder("wheel-trans", "transit", "Wheel-Trans", "Wheel-Trans", "Toronto Transit Commission"),
  placeholder("wav-official-info", "wav", "Official wheelchair-accessible vehicle information", "Information officielle sur les véhicules adaptés aux fauteuils roulants"),
  placeholder("help-line-official", "help", "Official help-line page", "Page officielle de ligne d’aide"),
];

/** A link is clickable only when verified and holding an https address. */
export function isLive(link: OfficialLink): boolean {
  return link.status === "listed" && typeof link.url === "string" && /^https:\/\//.test(link.url);
}
