import type { Language, RoomFacts } from "./types.js";
export const FIELD_KEYS: (keyof RoomFacts)[] = [
  "entranceStepHeightMm", "doorClearWidthMm", "turningDiameterMm", "bathroomTransferSide",
  "bathroomTransferSpaceMm", "showerBathNotes", "bedHeightMm", "bedClearanceMm", "elevator", "parking", "washroom",
];
const en = {
  title: "Housing and overnight room finder", language: "Language", demo: "Demonstration data only. These are imaginary rooms, not real addresses or surveyed measurements.",
  boundary: "Listings are not vacancies and this is not a housing application. Confirm details independently before making plans.",
  filters: "Filters", city: "City", allCities: "All cities", width: "Minimum known clear door width (mm)",
  elevator: "Require a known elevator (yes)", explanation: "Unknown never passes a minimum-width or elevator filter. These filters describe reported facts, not suitability or availability.",
  results: "Room records", found: "Matching demonstrations", noResults: "No results for these filters:",
  broaden: "Broaden filters", unknown: "Unknown", tier: "Tier", source: "Source", date: "Date", licence: "Licence", type: "Type", room: "Room details",
  fields: {
    entranceStepHeightMm: "Entrance step height (mm)", doorClearWidthMm: "Door clear width (mm)", turningDiameterMm: "Turning diameter (mm)",
    bathroomTransferSide: "Bathroom transfer side", bathroomTransferSpaceMm: "Bathroom transfer space (mm)", showerBathNotes: "Shower / bath notes",
    bedHeightMm: "Bed height (mm)", bedClearanceMm: "Bed clearance (mm)", elevator: "Elevator", parking: "Parking", washroom: "Washroom",
  },
  types: { dwelling: "Dwelling", "hotel-room": "Hotel room" },
  sides: { left: "Left", right: "Right", both: "Both", yes: "Yes", no: "No" },
  barriers: "On-device barrier report", privacy: "Optional, anonymous category only. No name, contact information or medical details. Saved on this device; nothing is sent.",
  category: "Experience", categories: { applied: "Applied", waited: "Waited", refused: "Refused", unsuitable: "Unsuitable" },
  optionalCity: "City (optional)", save: "Save on this device", saved: "Report saved on this device.", invalidCity: "Use letters and basic punctuation only (up to 60 characters).",
  publish: "Local aggregate preview (not transmitted)", suppressed: "Suppressed (fewer than 5)", aggregateNote: "Cells with 1–4 reports are suppressed; zero is also not displayed. No public data service is connected.",
  clear: "Delete my local reports", cleared: "Local reports deleted.",
};
const fr: typeof en = {
  title: "Recherche de logements et de chambres pour la nuit", language: "Langue", demo: "Données de démonstration seulement. Chambres fictives, sans adresses réelles ni mesures vérifiées.",
  boundary: "Ces fiches ne sont pas des logements vacants et ne constituent pas une demande de logement. Confirmez les détails avant tout projet.",
  filters: "Filtres", city: "Ville", allCities: "Toutes les villes", width: "Largeur libre minimale connue de la porte (mm)",
  elevator: "Exiger un ascenseur connu (oui)", explanation: "Une valeur inconnue ne satisfait jamais un filtre de largeur minimale ou d’ascenseur. Les filtres décrivent des données, pas la convenance ni la disponibilité.",
  results: "Fiches des chambres", found: "Démonstrations correspondantes", noResults: "Aucun résultat pour ces filtres :",
  broaden: "Élargir les filtres", unknown: "Inconnu", tier: "Niveau", source: "Source", date: "Date", licence: "Licence", type: "Type", room: "Détails de la chambre",
  fields: {
    entranceStepHeightMm: "Hauteur de marche à l’entrée (mm)", doorClearWidthMm: "Largeur libre de la porte (mm)", turningDiameterMm: "Diamètre de rotation (mm)",
    bathroomTransferSide: "Côté de transfert dans la salle de bain", bathroomTransferSpaceMm: "Espace de transfert (mm)", showerBathNotes: "Notes sur la douche ou le bain",
    bedHeightMm: "Hauteur du lit (mm)", bedClearanceMm: "Dégagement sous le lit (mm)", elevator: "Ascenseur", parking: "Stationnement", washroom: "Toilettes",
  },
  types: { dwelling: "Logement", "hotel-room": "Chambre d’hôtel" },
  sides: { left: "Gauche", right: "Droite", both: "Les deux", yes: "Oui", no: "Non" },
  barriers: "Signalement d’obstacle sur l’appareil", privacy: "Catégorie anonyme facultative seulement. Aucun nom, contact ou détail médical. Enregistré sur cet appareil, sans envoi.",
  category: "Expérience", categories: { applied: "Demande déposée", waited: "Attente", refused: "Refus", unsuitable: "Inadapté" },
  optionalCity: "Ville (facultatif)", save: "Enregistrer sur cet appareil", saved: "Signalement enregistré sur cet appareil.", invalidCity: "Utilisez des lettres et une ponctuation simple (60 caractères au plus).",
  publish: "Aperçu agrégé local (non transmis)", suppressed: "Masqué (moins de 5)", aggregateNote: "Les cellules de 1 à 4 signalements sont masquées; zéro n’est pas affiché non plus. Aucun service public de données n’est connecté.",
  clear: "Supprimer mes signalements locaux", cleared: "Signalements locaux supprimés.",
};
export const CATALOG: Record<Language, typeof en> = { en, fr };
