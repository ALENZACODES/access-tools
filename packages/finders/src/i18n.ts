import { fill, type Lang } from "@access-tools/place";

export const FINDER_COPY = {
  "finder.distance": { en: "Straight-line distance", fr: "Distance à vol d'oiseau" },
  "finder.unknown": { en: "Unknown", fr: "Inconnu" },
  "finder.hours": { en: "Hours", fr: "Heures" },
  "finder.date": { en: "Date", fr: "Date" },
  "finder.access": { en: "Access", fr: "Accès" },
  "finder.call": { en: "Call {phone}", fr: "Appeler {phone}" },
  "finder.shown": { en: "{count} record(s) shown.", fr: "{count} fiche(s) affichée(s)." },
  "finder.hidden-records": { en: "Hidden records", fr: "Fiches cachées" },
  "finder.washroom.heading": {
    en: "Washrooms, change tables, and hoists",
    fr: "Toilettes, tables de change et lève-personnes",
  },
  "finder.washroom.empty": {
    en: "No record is shown. A gap in this pack is not proof that no place exists.",
    fr: "Aucune fiche affichée. Un trou dans ce paquet n'est pas une preuve qu'aucun lieu n'existe.",
  },
  "finder.transfer": { en: "Transfer", fr: "Transfert" },
  "finder.change-table": { en: "Change table", fr: "Table de change" },
  "finder.hoist": { en: "Hoist", fr: "Lève-personne" },
  "finder.verified": { en: "Verification date", fr: "Date de vérification" },
  "finder.parking.heading": { en: "Accessible parking", fr: "Stationnement accessible" },
  "finder.parking.note": {
    en: "A municipal privilege is quoted only when the municipality, bylaw, and date are all present. The application does not advise on permit eligibility.",
    fr: "Le privilège municipal n'est cité que si la municipalité, le règlement et la date sont tous présents. L'application ne conseille pas sur l'admissibilité au permis.",
  },
  "finder.type": { en: "Type", fr: "Type" },
  "finder.width": { en: "Width and aisle", fr: "Largeur et allée" },
  "finder.entrance-distance": { en: "Distance to the entrance", fr: "Distance jusqu'à l'entrée" },
  "finder.payment": { en: "Payment", fr: "Paiement" },
  "finder.lift": { en: "Lift", fr: "Hayon" },
  "finder.privilege": { en: "Privilege", fr: "Privilège" },
  "finder.winter": { en: "Winter", fr: "Hiver" },
  "finder.parking.empty": { en: "No bay is shown for these filters.", fr: "Aucune place affichée pour ces filtres." },
  "finder.hidden-bays": { en: "Hidden bays", fr: "Places cachées" },
  "finder.charging.heading": { en: "Wheelchair and scooter charging", fr: "Recharge des fauteuils et triporteurs" },
  "finder.charging.note": {
    en: "This screen does not read the device location. Distance uses the point you type.",
    fr: "Cet écran ne lit pas la position de l'appareil. La distance utilise le point que vous saisissez.",
  },
  "finder.seating": { en: "Seating", fr: "Siège" },
  "finder.charging.empty": { en: "No charging point is shown.", fr: "Aucun point de recharge affiché." },
  "finder.repair.heading": { en: "Repair and supply", fr: "Réparation et fournitures" },
  "finder.services": { en: "Published services", fr: "Services publiés" },
  "finder.categories": { en: "Published categories", fr: "Catégories publiées" },
  "finder.detail": { en: "Detail", fr: "Détail" },
  "finder.phone-unknown": { en: "Phone: Unknown", fr: "Téléphone : Inconnu" },
  "finder.fixture-page": { en: "Fixture page", fr: "Page du jeu d'essai" },
  "finder.repair.empty": { en: "No record is shown.", fr: "Aucune fiche affichée." },
  "nav.skip": { en: "Skip to content", fr: "Aller au contenu" },
  "lang.show-french": { en: "Français", fr: "Français" },
  "lang.show-english": { en: "English", fr: "English" },
  "demo.title": { en: "the application — finders", fr: "l'application — outils de recherche" },
  "demo.intro": {
    en: "Demo on the labelled fixture pack. This is not a map. Real places will come from access-maps.",
    fr: "Démonstration sur le jeu d'essai étiqueté. Ce n'est pas une carte. Les lieux réels viendront d'access-maps.",
  },
  "demo.filters": { en: "Demo filters", fr: "Filtres de démonstration" },
  "demo.register": { en: " Adult change table and hoist register", fr: " Registre des tables de change et lève-personnes" },
  "demo.lift": { en: " Side lift", fr: " Hayon latéral" },
  "demo.hidden": { en: " Show hidden records", fr: " Afficher les fiches cachées" },
  "demo.range": { en: "Your tested range, in metres (optional)", fr: "Votre autonomie essayée, en mètres (facultatif)" },
} as const;

export type FinderKey = keyof typeof FINDER_COPY;

export function finderCopy(key: FinderKey, lang: Lang): string {
  const row = FINDER_COPY[key];
  return lang === "fr" ? row.fr : row.en;
}

export function finderFill(key: FinderKey, lang: Lang, values: Record<string, string | number>): string {
  return fill(finderCopy(key, lang), values);
}
