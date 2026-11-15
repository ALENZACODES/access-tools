export type SourceId =
  | "brampton-sidewalks" | "toronto-pedestrian-network" | "toronto-topo-sidewalks"
  | "ottawa-pedestrian-network" | "london-sidewalks" | "london-walkways"
  | "kitchener-sidewalks" | "waterloo-sidewalks";
export type LicenceStatus = "open" | "verify";
export interface Source {
  id: SourceId;
  name: { en: string; fr: string };
  publisher: string;
  datasetUrl: string;
  apiUrl: string;
  licence: string;
  licenceUrl: string;
  licenceStatus: LicenceStatus;
  attribution: string;
  cadence: string;
  reader: "arcgis" | "ckan";
  resourceId?: string;
}
const arc = (url: string) => url;
export const SOURCES: readonly Source[] = [
  { id: "brampton-sidewalks", name: { en: "Sidewalks", fr: "Trottoirs" }, publisher: "City of Brampton", datasetUrl: "https://services3.arcgis.com/rl7ACuZkiFsmDA2g/arcgis/rest/services/Sidewalks/FeatureServer/0", apiUrl: arc("https://services3.arcgis.com/rl7ACuZkiFsmDA2g/arcgis/rest/services/Sidewalks/FeatureServer/0/query"), licence: "Creative Commons Attribution 4.0", licenceUrl: "https://creativecommons.org/licenses/by/4.0/", licenceStatus: "open", attribution: "City of Brampton, Sidewalks, CC BY 4.0", cadence: "As updated", reader: "arcgis" },
  { id: "toronto-pedestrian-network", name: { en: "Pedestrian network", fr: "Réseau piétonnier" }, publisher: "City of Toronto", datasetUrl: "https://open.toronto.ca/dataset/pedestrian-network/", apiUrl: "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search", resourceId: "93b36f84-4a25-4b22-9812-44912ca34e02", licence: "Open Government Licence – Toronto", licenceUrl: "https://open.toronto.ca/open-data-licence/", licenceStatus: "open", attribution: "Contains information licensed under the Open Government Licence – Toronto.", cadence: "As available", reader: "ckan" },
  { id: "toronto-topo-sidewalks", name: { en: "Sidewalk areas", fr: "Surfaces de trottoirs" }, publisher: "City of Toronto", datasetUrl: "https://open.toronto.ca/dataset/topographic-mapping-physical-area-of-sidewalks/", apiUrl: "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search", licence: "Open Government Licence – Toronto", licenceUrl: "https://open.toronto.ca/open-data-licence/", licenceStatus: "open", attribution: "Contains information licensed under the Open Government Licence – Toronto.", cadence: "Quarterly", reader: "ckan" },
  { id: "ottawa-pedestrian-network", name: { en: "Pedestrian plan", fr: "Plan piétonnier" }, publisher: "City of Ottawa", datasetUrl: "https://maps.ottawa.ca/arcgis/rest/services/Pedestrian_Plan/MapServer/0", apiUrl: arc("https://maps.ottawa.ca/arcgis/rest/services/Pedestrian_Plan/MapServer/0/query"), licence: "City of Ottawa Open Data Licence v2.0", licenceUrl: "https://open.ottawa.ca/", licenceStatus: "verify", attribution: "City of Ottawa, Pedestrian Plan", cadence: "As updated", reader: "arcgis" },
  { id: "london-sidewalks", name: { en: "Sidewalks", fr: "Trottoirs" }, publisher: "City of London", datasetUrl: "https://maps.london.ca/server/rest/services/OpenData/OpenData_Transportation/MapServer/4", apiUrl: arc("https://maps.london.ca/server/rest/services/OpenData/OpenData_Transportation/MapServer/4/query"), licence: "City of London Open Data licence", licenceUrl: "https://opendata.london.ca/", licenceStatus: "verify", attribution: "City of London, Sidewalks", cadence: "As updated", reader: "arcgis" },
  { id: "london-walkways", name: { en: "Walkways", fr: "Voies piétonnes" }, publisher: "City of London", datasetUrl: "https://maps.london.ca/server/rest/services/OpenData/OpenData_Transportation/MapServer/6", apiUrl: arc("https://maps.london.ca/server/rest/services/OpenData/OpenData_Transportation/MapServer/6/query"), licence: "City of London Open Data licence", licenceUrl: "https://opendata.london.ca/", licenceStatus: "verify", attribution: "City of London, Walkways", cadence: "As updated", reader: "arcgis" },
  { id: "kitchener-sidewalks", name: { en: "Sidewalks", fr: "Trottoirs" }, publisher: "City of Kitchener", datasetUrl: "https://services1.arcgis.com/qAo1OsXi67t7XgmS/arcgis/rest/services/Sidewalks/FeatureServer/0", apiUrl: arc("https://services1.arcgis.com/qAo1OsXi67t7XgmS/arcgis/rest/services/Sidewalks/FeatureServer/0/query"), licence: "City of Kitchener Open Data licence", licenceUrl: "https://open-kitchenergis.opendata.arcgis.com/", licenceStatus: "verify", attribution: "City of Kitchener, Sidewalks", cadence: "As updated", reader: "arcgis" },
  { id: "waterloo-sidewalks", name: { en: "Sidewalks", fr: "Trottoirs" }, publisher: "City of Waterloo", datasetUrl: "https://services.arcgis.com/ZpeBVw5o1kjit7LT/arcgis/rest/services/Sidewalks/FeatureServer/0", apiUrl: arc("https://services.arcgis.com/ZpeBVw5o1kjit7LT/arcgis/rest/services/Sidewalks/FeatureServer/0/query"), licence: "City of Waterloo Open Data licence", licenceUrl: "https://data.waterloo.ca/", licenceStatus: "verify", attribution: "City of Waterloo, Sidewalks", cadence: "As updated", reader: "arcgis" },
];
export function sourceById(id: string): Source {
  const source = SOURCES.find((entry) => entry.id === id);
  if (!source) throw new Error(`Unknown source: ${id}`);
  return source;
}
