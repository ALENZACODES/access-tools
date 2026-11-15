export const API_URL = "https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer";

export const source = {
  id: "ottawa-parks-inventory",
  name: { en: "Ottawa parks inventory", fr: "Inventaire des parcs d’Ottawa" },
  publisher: "City of Ottawa",
  datasetUrl: API_URL,
  apiUrl: API_URL,
  licence: "City of Ottawa Open Data Licence v2.0",
  licenceUrl: "https://open.ottawa.ca/pages/open-data-licence-version-2-0",
  licenceStatus: "verify" as const,
  attribution: "Source: City of Ottawa / Source : Ville d’Ottawa",
  cadence: "As updated by the city (MODIFIED_DATE per feature)",
};

// Names preserve the service's original spacing and Unicode, not normalized translations.
export const layers = [
  [0, "Beaches / Plages"],
  [1, "Ball Diamonds / Terrains de balle"],
  [2, "Ball Diamonds School / Terrains de balle sur le terrain de l'école"],
  [3, "Basketball Courts / Terrains de basketball"],
  [4, "Boat Launches / Rampes de mise à l'eau"],
  [5, "Parks and Recreation Facilities / Installations récréatives"],
  [7, "Infrastructure / Infrastructure"],
  [8, "Dogs-in-Parks Designation / Politique sur les chiens dans les parcs "],
  [9, "Lawn Bowling / Boulingrin"],
  [10, "Outdoor Pools / Piscines extérieure"],
  [11, "Outdoor Wading Pools / Pataugeoires extérieure"],
  [12, "Other Park Features / Autre caractéristiques du parc"],
  [13, "Outdoor Rinks / Patinoires extérieure"],
  [15, "Play Area - Structures / Aires - Structures de jeux"],
  [16, "Skateboard Parks / Planchodromes"],
  [17, "Sledding Hills / Pente de traîneau"],
  [18, "Splash Pads / Aire de jeux d’eau"],
  [19, "Sports Fields / Terrains de sport "],
  [20, "Sports Fields on School Property / Terrains de sport sur le terrain de l'école"],
  [21, "Tennis Courts / Courts de tennis"],
  [22, "Volleyball Courts / Terrains de Volleyball"],
  [23, "Pathway Links / Liens de la voie"],
  [24, "Parks and Greenspace / Parcs et espaces vert"],
  [27, "Pickleball Courts / Terrains de pickleball"],
  [28, "Benches / Bancs"],
] as const;

export function layerNames(name: string): { en: string; fr: string | null } {
  const cleaned = name.replaceAll("\u200B", "").replaceAll("\u200C", "").replaceAll("\u200D", "");
  const separator = cleaned.indexOf(" / ");
  return separator < 0 ? { en: cleaned, fr: null } : {
    en: cleaned.slice(0, separator), fr: cleaned.slice(separator + 3),
  };
}
