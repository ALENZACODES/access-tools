export const ATTRIBUTION = "Contains information licensed under the Open Government Licence – Toronto.";
export const API = "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action";
export const LICENCE_URL = "https://open.toronto.ca/open-data-license/";
export const LICENCE = "Open Government Licence – Toronto";

export interface Source {
  id: string;
  name: { en: string; fr: string };
  publisher: string;
  datasetUrl: string;
  apiUrl: string;
  packageId: string;
  resources: readonly string[];
  kind: "traffic-signal" | "pedestrian-crossover" | "pops" | "park-facility";
  licence: string;
  licenceUrl: string;
  licenceStatus: "open" | "open-recorded" | "verify";
  attribution: string;
  cadence: string;
}

const trafficUrl = "https://open.toronto.ca/dataset/traffic-signals-tabular/";
const popsUrl = "https://open.toronto.ca/dataset/privately-owned-publicly-available-spaces/";
const parksUrl = "https://open.toronto.ca/dataset/parks-and-recreation-facilities/";
const common = { publisher: "City of Toronto", apiUrl: API, licence: LICENCE, licenceUrl: LICENCE_URL, attribution: ATTRIBUTION };

export const SOURCES: readonly Source[] = [
  { ...common, id: "toronto-traffic-signals-aps", name: { en: "Traffic signals (APS)", fr: "Feux de circulation (signaux sonores)" }, datasetUrl: trafficUrl, packageId: "traffic-signals-tabular", resources: ["Traffic Signal"], kind: "traffic-signal", licenceStatus: "open", cadence: "As available" },
  { ...common, id: "toronto-pedestrian-crossovers", name: { en: "Pedestrian crossovers", fr: "Passages pour piétons" }, datasetUrl: trafficUrl, packageId: "traffic-signals-tabular", resources: ["Pedestrian Crossover"], kind: "pedestrian-crossover", licenceStatus: "open", cadence: "As available" },
  { ...common, id: "toronto-pops", name: { en: "Publicly available private spaces", fr: "Espaces privés accessibles au public" }, datasetUrl: popsUrl, packageId: "privately-owned-publicly-available-spaces", resources: ["POPS - points", "POPS - polygons"], kind: "pops", licenceStatus: "open", cadence: "As available" },
  { ...common, id: "toronto-parks-rec-facilities", name: { en: "Parks and recreation facilities", fr: "Installations de parcs et de loisirs" }, datasetUrl: parksUrl, packageId: "parks-and-recreation-facilities", resources: ["Parks and Recreation Facilities"], kind: "park-facility", licenceStatus: "verify", cadence: "Monthly" },
];

export function sourceById(id: string): Source {
  const found = SOURCES.find((source) => source.id === id);
  if (!found) throw new Error(`Unknown source: ${id}`);
  return found;
}
