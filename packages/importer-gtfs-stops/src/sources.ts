import type { Source } from "./types.js";

const cadence = "Per service change (typically every 6–12 weeks)";
const entries: Array<[string, string, string, string, string, string, string]> = [
  ["gtfs-oc-transpo", "OC Transpo (Ottawa)", "https://www.octranspo.com/en/plan-your-trip/travel-tools/developers/", "City of Ottawa / OC Transpo developer terms", "verify", "OC Transpo", "OC Transpo"],
  ["gtfs-yrt", "York Region Transit", "https://www.yrt.ca/en/about-us/open-data-licence-agreement.aspx", "YRT Open Data Licence Agreement", "verify", "York Region Transit", "York Region Transit"],
  ["gtfs-durham-drt", "Durham Region Transit", "https://opendata.durham.ca/", "Region of Durham Open Data Licence", "verify", "Durham Region Transit", "Durham Region Transit"],
  ["gtfs-kingston-transit", "Kingston Transit", "https://opendatakingston.cityofkingston.ca/", "Open Data Licence – City of Kingston 1.0", "open-recorded", "Kingston Transit", "Kingston Transit"],
  ["gtfs-barrie-transit", "Barrie Transit", "https://www.barrie.ca/services-payments/transportation-parking/barrie-transit/barrie-gtfs", "City of Barrie open data terms", "verify", "Barrie Transit", "Barrie Transit"],
  ["gtfs-burlington-transit", "Burlington Transit", "https://opendata.burlington.ca/", "City of Burlington Open Data Terms of Use", "verify", "Burlington Transit", "Burlington Transit"],
  ["gtfs-oakville-transit", "Oakville Transit", "http://www.oakville.ca/data/oakville-transit-route-information.html", "Town of Oakville open data licence", "verify", "Oakville Transit", "Oakville Transit"],
  ["gtfs-transit-windsor", "Transit Windsor", "https://opendata.citywindsor.ca/", "City of Windsor open data terms", "verify", "Transit Windsor", "Transit Windsor"],
  ["gtfs-thunder-bay", "Thunder Bay Transit", "http://api.nextlift.ca/gtfs.zip", "No licence text found with the feed", "unknown", "Thunder Bay Transit", "Thunder Bay Transit"],
  ["gtfs-sudbury-gova", "GOVA Transit (Greater Sudbury)", "https://www.greatersudbury.ca/", "Open Data Licence – City of Greater Sudbury", "open-recorded", "GOVA Transit", "GOVA Transit"],
  ["gtfs-milton-transit", "Milton Transit", "https://discover-milton.hub.arcgis.com/pages/disclaimer-and-terms-of-use", "Town of Milton terms of use", "verify", "Milton Transit", "Milton Transit"],
  ["gtfs-belleville-transit", "Belleville Transit", "https://metrolinx.tmix.se/gtfs/gtfs-belleville.zip", "No licence text found with the feed", "unknown", "Belleville Transit", "Belleville Transit"],
  ["gtfs-cornwall-transit", "Cornwall Transit", "http://metrolinx.tmix.se/gtfs/gtfs-cornwall.zip", "No licence text found with the feed", "unknown", "Cornwall Transit", "Cornwall Transit"],
];

/** Catalogue pages are discovery URLs, not automatically downloadable ZIP URLs. */
export const SOURCES: readonly Source[] = entries.map(([id, publisher, datasetUrl, licence, status, en, fr]) => ({
  id, name: { en: en!, fr: fr! }, publisher: publisher!, datasetUrl: datasetUrl!, apiUrl: datasetUrl!,
  licence: licence!, licenceUrl: datasetUrl!, licenceStatus: status as Source["licenceStatus"],
  attribution: `Data: ${publisher}`, cadence,
}));
export function sourceById(id: string): Source {
  const found = SOURCES.find((source) => source.id === id);
  if (!found) throw new Error(`Unknown feed: ${id}`);
  return found;
}
