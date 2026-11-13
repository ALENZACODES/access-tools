import { fill, type Lang } from "@access-tools/place";

export const FINDER_COPY = {
  "finder.distance": { en: "Straight-line distance", fr: "Distance à vol d'oiseau" },
  "finder.unknown": { en: "Unknown", fr: "Inconnu" },
  "finder.hours": { en: "Opening hours", fr: "Heures d'ouverture" },
  "finder.date": { en: "Date", fr: "Date" },
  "finder.access": { en: "Access", fr: "Accès" },
  "finder.call": { en: "Call {phone}", fr: "Appeler {phone}" },
  "finder.shown": { en: "{count} record(s) shown.", fr: "{count} fiche(s) affichée(s)." },
  "finder.hidden-records": { en: "Hidden records", fr: "Fiches cachées" },
  "finder.washroom.heading": {
    en: "Washrooms, change tables, and hoists",
    fr: "Toilettes, tables à langer pour adultes et lève-personnes",
  },
  "finder.washroom.empty": {
    en: "No record is shown. A gap in this pack is not proof that no place exists.",
    fr: "Aucune fiche affichée. Une lacune dans ce paquet ne prouve pas qu'aucun lieu n'existe.",
  },
  "finder.transfer": { en: "Transfer", fr: "Transfert" },
  "finder.change-table": { en: "Change table", fr: "Table à langer pour adultes" },
  "finder.hoist": { en: "Hoist", fr: "Lève-personne" },
  "finder.verified": { en: "Verification date", fr: "Date de vérification" },
  "finder.parking.heading": { en: "Accessible parking", fr: "Stationnement accessible" },
  "finder.parking.note": {
    en: "A municipal privilege is quoted only when the municipality, bylaw, and date are all present. The application does not advise on permit eligibility.",
    fr: "Le privilège municipal n'est cité que si la municipalité, le règlement et la date sont tous présents. L'application ne donne pas de conseils sur l'admissibilité au permis.",
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
  "finder.charging.heading": { en: "Wheelchair and scooter charging", fr: "Recharge des fauteuils, triporteurs et quadriporteurs" },
  "finder.charging.note": {
    en: "This screen does not read the device location. Distance uses the point you type.",
    fr: "Cet écran ne lit pas la position de l'appareil. La distance utilise le point que vous saisissez.",
  },
  "finder.seating": { en: "Seating", fr: "Places assises" },
  "finder.charging.empty": { en: "No charging point is shown.", fr: "Aucun point de recharge affiché." },
  "finder.repair.heading": { en: "Repair and supply", fr: "Réparation et fournitures" },
  "finder.services": { en: "Published services", fr: "Services publiés" },
  "finder.categories": { en: "Published categories", fr: "Catégories publiées" },
  "finder.detail": { en: "Detail", fr: "Détail" },
  "finder.phone-unknown": { en: "Phone: Unknown", fr: "Téléphone\u00A0: Inconnu" },
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
  "demo.register": { en: "Adult change table and hoist register", fr: "Registre des tables à langer pour adultes et lève-personnes" },
  "demo.lift": { en: "Side lift", fr: "Hayon latéral" },
  "demo.hidden": { en: "Show hidden records", fr: "Afficher les fiches cachées" },
  "demo.range": { en: "Your tested range, in metres (optional)", fr: "Votre autonomie testée, en mètres (facultatif)" },
  "finder.reason.not-mobile": {
    en: "Mobile repair is not in the published list.",
    fr: "La réparation mobile n'est pas dans la liste publiée.",
  },
  "finder.reason.not-after-hours": {
    en: "Out-of-hours service is not in the published list.",
    fr: "Le service hors heures n'est pas dans la liste publiée.",
  },
  "finder.reason.not-open": {
    en: "Not shown as open at the time you entered.",
    fr: "Pas affiché comme ouvert à l'heure saisie.",
  },
  "finder.reason.category": {
    en: "That category is not in the published list.",
    fr: "Cette catégorie n'est pas dans la liste publiée.",
  },
  "finder.reason.not-mobile-repair": {
    en: "This is not a mobile-repair record.",
    fr: "Ce n'est pas une fiche de réparation mobile.",
  },
  "finder.coverage": { en: "Coverage: {note}", fr: "Couverture\u00A0: {note}" },
  "finder.radius": {
    en: "Recorded mobile radius: {km} km. {note}",
    fr: "Rayon mobile enregistré\u00A0: {km} km. {note}",
  },
  "finder.delivery": { en: "Delivery: {delivery}. {stock}", fr: "Livraison\u00A0: {delivery}. {stock}" },
  "finder.hours-unknown-open": {
    en: "Hours are unknown, so this point is not shown as open.",
    fr: "Les heures sont inconnues, donc ce point n'est pas affiché comme ouvert.",
  },
  "finder.closed": { en: "Closed at the time you entered.", fr: "Fermé à l'heure que vous avez saisie." },
  "finder.range-reminder": {
    en: "The application does not use a generic chair range. A straight-line distance is not a journey.",
    fr: "L'application n'utilise pas d'autonomie générique de fauteuil. Une distance à vol d'oiseau n'est pas un trajet.",
  },
  "finder.lift-hidden": {
    en: "Lift space is unknown, so this bay is not shown for a side lift.",
    fr: "L'espace de hayon est inconnu, donc cette place n'est pas affichée pour un hayon latéral.",
  },
  "finder.reason.transfer": {
    en: "Transfer side does not match. Unknown is not a match.",
    fr: "Le côté de transfert ne correspond pas. Inconnu n'est pas une correspondance.",
  },
  "finder.reason.no-table": {
    en: "No adult change table is recorded as present.",
    fr: "Aucune table de change adulte n'est enregistrée comme présente.",
  },
  "finder.reason.no-hoist": {
    en: "No hoist is recorded as present.",
    fr: "Aucun lève-personne n'est enregistré comme présent.",
  },
  "finder.reason.no-register": {
    en: "No adult change table or hoist is recorded as present.",
    fr: "Aucune table de change adulte ni lève-personne n'est enregistré comme présent.",
  },
  "finder.reason.hours-unknown": {
    en: "Hours are unknown, so this record is not shown as open.",
    fr: "Les heures sont inconnues, donc cette fiche n'est pas affichée comme ouverte.",
  },
  "finder.coverage-sentence": {
    en: "This pack names {count} municipalities: {list}. Ontario has 444 municipalities. This pack does not describe provincial coverage.",
    fr: "Ce paquet nomme {count} municipalité(s)\u00A0: {list}. L'Ontario compte 444 municipalités. Ce paquet ne décrit pas la couverture provinciale.",
  },
} as const;

export type FinderKey = keyof typeof FINDER_COPY;

export function finderCopy(key: FinderKey, lang: Lang): string {
  const row = FINDER_COPY[key];
  return lang === "fr" ? row.fr : row.en;
}

export function finderFill(key: FinderKey, lang: Lang, values: Record<string, string | number>): string {
  return fill(finderCopy(key, lang), values);
}
