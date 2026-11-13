import { fill, type Lang } from "@access-tools/place";

export const SEARCH_COPY = {
  "search.heading": { en: "Search", fr: "Recherche" },
  "search.intro": {
    en: "Search runs on the pack loaded in this browser. It does not call a server. Sort order is not an accessibility ranking.",
    fr: "La recherche tourne sur le paquet chargé dans ce navigateur. Elle n'appelle pas de serveur. Le tri n'est pas un classement d'accessibilité.",
  },
  "search.words": { en: "Words", fr: "Mots" },
  "search.municipality": { en: "Municipality", fr: "Municipalité" },
  "search.any-feminine": { en: "Any", fr: "Toutes" },
  "search.category": { en: "Category", fr: "Catégorie" },
  "search.place-type": { en: "Place type", fr: "Type de lieu" },
  "search.any-masculine": { en: "Any", fr: "Tous" },
  "search.order": { en: "Order", fr: "Ordre" },
  "search.sort.name": { en: "Name", fr: "Nom" },
  "search.sort.source-date": { en: "Source date", fr: "Date de source" },
  "search.sort.distance": { en: "Straight-line distance", fr: "Distance à vol d'oiseau" },
  "search.latitude": { en: "Optional latitude", fr: "Latitude facultative" },
  "search.longitude": { en: "Optional longitude", fr: "Longitude facultative" },
  "search.origin-note": {
    en: "The point is used only to sort by distance. It is not a location history. This screen does not read the device location.",
    fr: "Le point sert seulement à trier par distance. Il n'est pas un historique. Cet écran ne lit pas la position de l'appareil.",
  },
  "search.filters": { en: "Filters", fr: "Filtres" },
  "search.filters-note": {
    en: "A filter hides records that do not match. Unknown is not a match. Show hidden results explains why.",
    fr: "Un filtre cache les fiches qui ne correspondent pas. Inconnu n'est pas une correspondance. Afficher les résultats cachés explique pourquoi.",
  },
  "search.filter.step-free": { en: " Entrance recorded as step-free", fr: " Entrée enregistrée comme sans marche" },
  "search.filter.change-table": { en: " Adult change table recorded", fr: " Table de change adulte enregistrée" },
  "search.filter.hoist": { en: " Hoist recorded", fr: " Lève-personne enregistré" },
  "search.filter.van": { en: " Type A bay with a recorded aisle", fr: " Place de type A avec allée enregistrée" },
  "search.filter.charging": { en: " Charging record present", fr: " Fiche de recharge présente" },
  "search.transfer-side": { en: "Transfer side", fr: "Côté de transfert" },
  "search.side.left": { en: "Left or both", fr: "Gauche ou les deux" },
  "search.side.right": { en: "Right or both", fr: "Droite ou les deux" },
  "search.side.both": { en: "Both only", fr: "Les deux seulement" },
  "search.supply": { en: "Linked supply category", fr: "Catégorie de fournitures liée" },
  "search.show-hidden": { en: " Show hidden results", fr: " Afficher les résultats cachés" },
  "search.empty.query": {
    en: "No seeded place matched “{query}”. Try a broader word, another category, or clear a filter. An empty result is a gap, not proof that no place exists.",
    fr: "Aucun lieu de la graine ne correspond à « {query} ». Essayez un mot plus large, une autre catégorie, ou retirez un filtre. Un résultat vide est un trou, pas une preuve qu'aucun lieu n'existe.",
  },
  "search.empty.hidden": {
    en: "{hidden} record(s) hidden by filters. No record is shown.",
    fr: "{hidden} fiche(s) cachée(s) par les filtres. Aucune fiche affichée.",
  },
  "search.summary": {
    en: "{shown} record(s) shown. {hidden} hidden.",
    fr: "{shown} fiche(s) affichée(s). {hidden} cachée(s).",
  },
  "search.distance.unknown": { en: " Distance unknown.", fr: " Distance inconnue." },
  "search.distance.known": { en: " Straight-line distance {metres} m.", fr: " Distance à vol d'oiseau {metres} m." },
  "search.hidden": { en: "Hidden results", fr: "Résultats cachés" },
  "search.previous": { en: "Previous page", fr: "Page précédente" },
  "search.next": { en: "Next page", fr: "Page suivante" },
  "nav.skip": { en: "Skip to content", fr: "Aller au contenu" },
  "lang.show-french": { en: "Français", fr: "Français" },
  "lang.show-english": { en: "English", fr: "English" },
  "demo.title": { en: "the application — search", fr: "l'application — recherche" },
  "demo.intro": {
    en: "Demo on the labelled fixture pack. Real places will come from access-maps.",
    fr: "Démonstration sur le jeu d'essai étiqueté. Les lieux réels viendront d'access-maps.",
  },
  "demo.choose": { en: "Choose a place from the results.", fr: "Choisissez un lieu dans les résultats." },
} as const;

export type SearchKey = keyof typeof SEARCH_COPY;

export function searchCopy(key: SearchKey, lang: Lang): string {
  const row = SEARCH_COPY[key];
  return lang === "fr" ? row.fr : row.en;
}

export function searchFill(key: SearchKey, lang: Lang, values: Record<string, string | number>): string {
  return fill(searchCopy(key, lang), values);
}
