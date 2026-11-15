export type SourceId = "toronto-accessible-stalls" | "mississauga-parking-facilities" |
  "london-parking" | "waterloo-parking-lots" | "ottawa-parks-parking";
export interface ParkingSource {
  id: SourceId;
  name: { en: string; fr: string };
  publisher: string;
  datasetUrl: string;
  apiUrl: string;
  licence: string;
  licenceUrl: string;
  licenceStatus: "open" | "verify";
  attribution: string;
  cadence: string;
  sourceDate: string;
  kind: "ckan" | "arcgis";
}
const toronto = "https://open.toronto.ca/dataset/off-street-parking-surface-lots-accessible-stalls/";
const mississauga = "https://services6.arcgis.com/hM5ymMLbxIyWTjn2/arcgis/rest/services/City_Owned_Parkng_Facilities/FeatureServer/0";
const london = "https://maps.london.ca/server/rest/services/OpenData/OpenData_Transportation/MapServer/1";
const waterloo = "https://services.arcgis.com/ZpeBVw5o1kjit7LT/arcgis/rest/services/ParkingLots/FeatureServer/0";
const ottawa = "https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer/14";
export const SOURCES: readonly ParkingSource[] = [
  { id: "toronto-accessible-stalls", name: { en: "Toronto accessible stalls", fr: "Places de stationnement accessibles de Toronto" }, publisher: "City of Toronto", datasetUrl: toronto,
    apiUrl: "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search?resource_id=ca8e3fa3-3176-4f3f-96e6-a8077aa2f2d1", licence: "Open Government Licence – Toronto", licenceUrl: "https://open.toronto.ca/open-data-licence/", licenceStatus: "open", attribution: "Contains information licensed under the Open Government Licence – Toronto.", cadence: "Annually", sourceDate: "2026-07-01", kind: "ckan" },
  { id: "mississauga-parking-facilities", name: { en: "Mississauga parking facilities", fr: "Installations de stationnement de Mississauga" }, publisher: "City of Mississauga", datasetUrl: mississauga, apiUrl: mississauga,
    licence: "City of Mississauga Open Data Terms of Use", licenceUrl: "https://data.mississauga.ca/", licenceStatus: "verify", attribution: "Source: City of Mississauga open data; licence review required.", cadence: "As updated", sourceDate: "2026-11-15", kind: "arcgis" },
  { id: "london-parking", name: { en: "London parking inventory", fr: "Inventaire de stationnement de London" }, publisher: "City of London", datasetUrl: london, apiUrl: london,
    licence: "City of London Open Data licence", licenceUrl: "https://opendata.london.ca/", licenceStatus: "verify", attribution: "Source: City of London open data; licence review required.", cadence: "As updated", sourceDate: "2026-11-15", kind: "arcgis" },
  { id: "waterloo-parking-lots", name: { en: "Waterloo parking lots", fr: "Parcs de stationnement de Waterloo" }, publisher: "City of Waterloo", datasetUrl: waterloo, apiUrl: waterloo,
    licence: "City of Waterloo Open Data licence", licenceUrl: "https://data.waterloo.ca/", licenceStatus: "verify", attribution: "Source: City of Waterloo open data; licence review required.", cadence: "As updated", sourceDate: "2026-11-15", kind: "arcgis" },
  { id: "ottawa-parks-parking", name: { en: "Ottawa parks parking", fr: "Stationnement des parcs d’Ottawa" }, publisher: "City of Ottawa", datasetUrl: ottawa, apiUrl: ottawa,
    licence: "City of Ottawa Open Data Licence v2.0", licenceUrl: "https://open.ottawa.ca/", licenceStatus: "verify", attribution: "Source: City of Ottawa open data; licence review required.", cadence: "As updated", sourceDate: "2026-11-15", kind: "arcgis" },
];
export function sourceById(id: string): ParkingSource {
  const source = SOURCES.find((entry) => entry.id === id);
  if (!source) throw new Error(`Unknown source: ${id}`);
  return source;
}
