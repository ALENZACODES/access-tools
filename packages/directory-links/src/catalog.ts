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
