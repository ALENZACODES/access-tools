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
  "finder.demo-data": {
    en: "Demonstration data. Every record on this list is a labelled fixture, not a real place and not a visit.",
    fr: "Données de démonstration. Chaque fiche de cette liste est un jeu d'essai étiqueté, pas un lieu réel ni une visite.",
  },
  "finder.destination": { en: "Destination", fr: "Destination" },
  "finder.destination-hint": {
    en: "Type a place name, an address, or a municipality. An empty field lists every destination in the demonstration data.",
    fr: "Saisissez un nom de lieu, une adresse ou une municipalité. Un champ vide liste toutes les destinations des données de démonstration.",
  },
  "finder.washroom.not-shown": {
    en: "This list does not show whether a washroom is available, open right now, or clean. Recorded hours are a record, not a live status.",
    fr: "Cette liste ne dit pas si des toilettes sont disponibles, ouvertes en ce moment ou propres. Les heures enregistrées sont une fiche, pas un statut en direct.",
  },
  "finder.parking.exists": {
    en: "This list shows spaces the data says exist. It does not show spaces that are free right now. No live availability feed is connected.",
    fr: "Cette liste montre les places qui existent selon les données. Elle ne montre pas les places libres en ce moment. Aucun flux de disponibilité en direct n'est branché.",
  },
  "finder.filters.heading": { en: "Filters applied", fr: "Filtres appliqués" },
  "finder.filters.none": {
    en: "No filter is on. Every record for this destination is listed.",
    fr: "Aucun filtre n'est actif. Toutes les fiches de cette destination sont listées.",
  },
  "finder.filters.profile": { en: "From your saved equipment profile.", fr: "Selon votre profil d'équipement enregistré." },
  "finder.filters.screen": { en: "Set on this screen.", fr: "Réglé sur cet écran." },
  "finder.filter.change-table": {
    en: "Only a washroom with an adult change table recorded as present is listed. Unknown is not a match.",
    fr: "Seules les toilettes dont la table à langer pour adultes est enregistrée comme présente sont listées. Inconnu n'est pas une correspondance.",
  },
  "finder.filter.width.label": { en: "Chair width: {mm} mm", fr: "Largeur du fauteuil\u00A0: {mm} mm" },
  "finder.filter.width": {
    en: "A washroom whose measured door is narrower is hidden. A washroom with no door measurement stays on the list with a note.",
    fr: "Les toilettes dont la porte mesurée est plus étroite sont cachées. Les toilettes sans mesure de porte restent dans la liste avec une note.",
  },
  "finder.filter.step-free.washroom": {
    en: "Only a washroom in a place whose entrance is recorded as step-free is listed. Unknown is not a match.",
    fr: "Seules les toilettes d'un lieu dont l'entrée est enregistrée comme sans marche sont listées. Inconnu n'est pas une correspondance.",
  },
  "finder.filter.step-free.parking": {
    en: "Only a bay whose route to the entrance is recorded as step-free is listed. Unknown is not a match.",
    fr: "Seules les places dont le chemin jusqu'à l'entrée est enregistré comme sans marche sont listées. Inconnu n'est pas une correspondance.",
  },
  "finder.filter.hoist.label": { en: "Hoist needed", fr: "Lève-personne nécessaire" },
  "finder.filter.hoist": {
    en: "Only a washroom with a hoist recorded as present is listed. Unknown is not a match.",
    fr: "Seules les toilettes dont le lève-personne est enregistré comme présent sont listées. Inconnu n'est pas une correspondance.",
  },
  "finder.filter.register": {
    en: "Only a washroom with an adult change table or a hoist recorded as present is listed.",
    fr: "Seules les toilettes dont une table à langer pour adultes ou un lève-personne est enregistré comme présent sont listées.",
  },
  "finder.filter.transfer.label": { en: "Transfer side: {side}", fr: "Côté de transfert\u00A0: {side}" },
  "finder.filter.transfer": {
    en: "Only a washroom whose recorded transfer side matches is listed. Unknown is not a match.",
    fr: "Seules les toilettes dont le côté de transfert enregistré correspond sont listées. Inconnu n'est pas une correspondance.",
  },
  "finder.filter.open-at.label": { en: "Recorded hours at the time you entered", fr: "Heures enregistrées à l'heure saisie" },
  "finder.filter.open-at": {
    en: "A washroom with unknown hours, or recorded as closed at that time, is hidden. This is not a live open status.",
    fr: "Les toilettes dont les heures sont inconnues, ou enregistrées comme fermées à cette heure, sont cachées. Ce n'est pas un statut d'ouverture en direct.",
  },
  "finder.filter.van-lift": {
    en: "Only a Type A bay with a recorded width and aisle is listed. That does not say your lift will fit.",
    fr: "Seules les places de type A dont la largeur et l'allée sont enregistrées sont listées. Cela ne dit pas que votre hayon passe.",
  },
  "finder.parking.profile-unused": {
    en: "The chair width and adult change table settings in your profile do not filter parking bays.",
    fr: "La largeur du fauteuil et la table à langer pour adultes de votre profil ne filtrent pas les places de stationnement.",
  },
  "finder.washroom.empty-title": { en: "No washroom record matches.", fr: "Aucune fiche de toilettes ne correspond." },
  "finder.parking.empty-title": { en: "No parking bay matches.", fr: "Aucune place de stationnement ne correspond." },
  "finder.empty.filters": { en: "Filters on: {list}.", fr: "Filtres actifs\u00A0: {list}." },
  "finder.empty.no-filters": { en: "No filter is on.", fr: "Aucun filtre n'est actif." },
  "finder.empty.destination": { en: "Destination searched: {text}.", fr: "Destination cherchée\u00A0: {text}." },
  "finder.empty.no-destination": { en: "No destination is typed.", fr: "Aucune destination n'est saisie." },
  "finder.washroom.seeded": {
    en: "The demonstration data holds {records} washroom record(s) in {places} place(s). {matching} match(es) this destination before the filters.",
    fr: "Les données de démonstration contiennent {records} fiche(s) de toilettes dans {places} lieu(x). {matching} correspond(ent) à cette destination avant les filtres.",
  },
  "finder.parking.seeded": {
    en: "The demonstration data holds {records} parking bay record(s) in {places} place(s). {matching} match(es) this destination before the filters.",
    fr: "Les données de démonstration contiennent {records} fiche(s) de place de stationnement dans {places} lieu(x). {matching} correspond(ent) à cette destination avant les filtres.",
  },
  "finder.empty.gap": {
    en: "A gap in the demonstration data is not proof that nothing exists.",
    fr: "Une lacune dans les données de démonstration ne prouve pas que rien n'existe.",
  },
  "finder.broaden": { en: "Broaden filters", fr: "Élargir les filtres" },
  "finder.broaden.filters-hint": {
    en: "This turns off the filters named above for this list only. Your saved profile is not changed.",
    fr: "Cela désactive les filtres nommés ci-dessus pour cette liste seulement. Votre profil enregistré ne change pas.",
  },
  "finder.broaden.destination-hint": {
    en: "No filter is on, so this clears the destination and lists every record in the demonstration data.",
    fr: "Aucun filtre n'est actif, donc cela efface la destination et liste toutes les fiches des données de démonstration.",
  },
  "finder.broadened": {
    en: "Filters turned off for this list: {list}. Your saved profile is not changed.",
    fr: "Filtres désactivés pour cette liste\u00A0: {list}. Votre profil enregistré ne change pas.",
  },
  "finder.restore": { en: "Restore my filters", fr: "Rétablir mes filtres" },
  "finder.back.journey": { en: "Back to the journey", fr: "Retour au trajet" },
  "finder.back.place": { en: "Back to the place page", fr: "Retour à la page du lieu" },
  "finder.entry.journey": {
    en: "Opened from a journey result. The destination comes from the journey, and your saved profile filters are applied.",
    fr: "Ouvert depuis un résultat de trajet. La destination vient du trajet, et les filtres de votre profil enregistré sont appliqués.",
  },
  "finder.entry.place": {
    en: "Opened from a place page. The destination is that place, and your saved profile filters are applied.",
    fr: "Ouvert depuis une page de lieu. La destination est ce lieu, et les filtres de votre profil enregistré sont appliqués.",
  },
  "finder.field.tier": { en: "Tier", fr: "Niveau" },
  "finder.field.source": { en: "Source", fr: "Source" },
  "finder.field.record-date": { en: "Record date", fr: "Date de fiche" },
  "finder.washroom.shown": {
    en: "{count} washroom record(s) listed.",
    fr: "{count} fiche(s) de toilettes listée(s).",
  },
  "finder.space-type": { en: "Space type", fr: "Type de place" },
  "finder.van": { en: "Van-accessible", fr: "Accessible aux fourgons" },
  "finder.van.yes": { en: "Recorded as van-accessible (Type A).", fr: "Enregistrée comme accessible aux fourgons (type A)." },
  "finder.van.no": { en: "Not recorded as van-accessible (Type B).", fr: "Pas enregistrée comme accessible aux fourgons (type B)." },
  "finder.van.drop-off": { en: "Drop-off point, not a parking space.", fr: "Point de dépose, pas une place de stationnement." },
  "finder.surface": { en: "Surface", fr: "Surface" },
  "finder.payment-notes": { en: "Payment notes", fr: "Notes sur le paiement" },
  "finder.parking.shown": {
    en: "{bays} bay record(s) listed at {places} destination(s).",
    fr: "{bays} fiche(s) de place listée(s) à {places} destination(s).",
  },
  "finder.parking.cluster-count": {
    en: "{count} bay(s) recorded at this destination.",
    fr: "{count} place(s) enregistrée(s) à cette destination.",
  },
  "demo.journey.heading": { en: "Demonstration journey result", fr: "Résultat de trajet de démonstration" },
  "demo.journey.note": {
    en: "A stand-in for a journey result. It is demonstration data, not a planned route.",
    fr: "Un substitut de résultat de trajet. Ce sont des données de démonstration, pas un itinéraire planifié.",
  },
  "demo.journey.washrooms": { en: "Washrooms for this destination", fr: "Toilettes pour cette destination" },
  "demo.journey.parking": { en: "Parking for this destination", fr: "Stationnement pour cette destination" },
  "demo.place.heading": { en: "Demonstration place page", fr: "Page de lieu de démonstration" },
  "demo.place.note": {
    en: "A stand-in for a place page. The place page itself is in the place package.",
    fr: "Un substitut de page de lieu. La page de lieu elle-même est dans le paquet des lieux.",
  },
  "demo.place.parking": { en: "Accessible parking at this place", fr: "Stationnement accessible à ce lieu" },
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
    fr: "Aucune table à langer pour adultes n'est enregistrée comme présente.",
  },
  "finder.reason.no-hoist": {
    en: "No hoist is recorded as present.",
    fr: "Aucun lève-personne n'est enregistré comme présent.",
  },
  "finder.reason.no-register": {
    en: "No adult change table or hoist is recorded as present.",
    fr: "Aucune table à langer pour adultes ni lève-personne n'est enregistré comme présent.",
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
