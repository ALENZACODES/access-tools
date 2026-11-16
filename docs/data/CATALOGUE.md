# Open-data catalogue for the App

Counted on 2026-11-15 (America/Toronto). Machine-readable copy: [`data/catalogue.json`](../../data/catalogue.json).

This is a survey of free, openly licensed data that can add real records to the App. It is not an import. Nothing here is a verified accessibility fact, and a record count is not a coverage claim.

## Rules every importer follows

- **Open licences only:** ODbL, OGL-Ontario, OGL-Canada, OGL-Toronto and other OGL-style municipal licences, CC BY or CC0. A source whose licence status is `verify` or `unknown` is imported only into local, git-ignored output until a person records the licence text and date. `held` means access-maps #1 already holds it for licence review. `excluded` means it is outside the allowed list.
- **Unknown stays UNKNOWN:** a field is filled only from an explicit value in the source. Empty, 0, -1, `unknown` or free text is never turned into yes or no. No words like "accessible" in a description are parsed into a wheelchair fact.
- **Provenance on every fact:** `Provenance.sourceName`, `sourceId` (plus the upstream feature id), `sourceUrl`, `licence`, `sourceDate` (upstream last-modified), `retrievedAt` (run date), `tier: 0`, `prototypeLabel: SEEDED-OPEN-DATA`, `verifierType: open-data-import`. An import never writes tier 2, 3 or 4.
- **Live status is never stored:** elevator outages and similar real-time feeds are shown with an expiry, not written into place records.
- **Big outputs stay out of git:** importers stream input, write gzip NDJSON partitions of at most 20 MB each, and publish them as release assets. Git holds only code, schemas and fixtures of a few KB.
- **ODbL share-alike:** any public database derived from OpenStreetMap must be offered under ODbL with "© OpenStreetMap contributors" attribution. OSM-derived records stay in their own partition and are never merged into a non-ODbL file. Rendered maps need attribution only.

## Totals

- **Total counted records across all sources: 2,200,917.** Every number in this total was counted, not estimated. Sources are not deduplicated against each other; at least 12,208 OSM places appear in both OSM rows.
- Already imported or in progress in access-maps #1: 1,564,101.
- Counted and not yet imported anywhere: 636,816.
- Left out of the total: StatCan datapoints (118,764), OSM building footprints (3,128,244), Wikidata items without P2846 (85,284), and not-counted sources.

## Imports recorded on 2026-11-16

Real records live in access-maps, not in this repository. This list records what access-maps imported from the publishers on 2026-11-16. Every record is tier 0 (open-data import). None is verified. The totals above are the 2026-11-15 survey and were not recounted.

Pull request: https://github.com/ALENZACODES/access-maps/pull/48

| access-maps source | Publisher | Source | Licence | Retrieved | Records | Tier |
| --- | --- | --- | --- | --- | ---: | ---: |
| `toronto-accessible-parking-stalls` | City of Toronto | [open.toronto.ca](https://open.toronto.ca/dataset/off-street-parking-surface-lots-accessible-stalls/) | Open Government Licence – Toronto | 2026-11-16 | 669 | 0 |
| `toronto-traffic-signals` | City of Toronto | [open.toronto.ca](https://open.toronto.ca/dataset/traffic-signals-tabular/) | Open Government Licence – Toronto | 2026-11-16 | 2,563 | 0 |
| `toronto-library-branches` | City of Toronto (Toronto Public Library) | [open.toronto.ca](https://open.toronto.ca/dataset/library-branch-general-information/) | Open Government Licence – Toronto | 2026-11-16 | 182 | 0 |
| `toronto-drinking-fountains` | City of Toronto | [open.toronto.ca](https://open.toronto.ca/dataset/parks-drinking-fountains/) | Open Government Licence – Toronto | 2026-11-16 | 802 | 0 |
| `toronto-parks-recreation-facilities` | City of Toronto | [open.toronto.ca](https://open.toronto.ca/dataset/parks-and-recreation-facilities/) | Open Government Licence – Toronto | 2026-11-16 | 1,801 | 0 |
| `toronto-community-centre-washrooms` | City of Toronto | [open.toronto.ca](https://open.toronto.ca/dataset/association-of-community-centres/) | Open Government Licence – Toronto | 2026-11-16 | 9 | 0 |
| `toronto-pedestrian-network` | City of Toronto | [open.toronto.ca](https://open.toronto.ca/dataset/pedestrian-network/) | Open Government Licence – Toronto | 2026-11-16 | 70,749 | 0 |
| `toronto-park-washrooms` | City of Toronto | [open.toronto.ca](https://open.toronto.ca/dataset/washroom-facilities/) | Open Government Licence – Toronto | 2026-11-16 | 355 | 0 |
| `toronto-street-washrooms` | City of Toronto | [ckan0.cf.opendata.inter.prod-toronto.ca](https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/street-furniture-public-washroom) | Open Government Licence – Toronto | 2026-11-16 | 4 | 0 |
| `toronto-crem-washrooms` | City of Toronto | [open.toronto.ca](https://open.toronto.ca/dataset/corporate-real-estate-management-portfolio-washrooms/) | Open Government Licence – Toronto | 2026-11-16 | 119 | 0 |
| `ottawa-public-washrooms` | City of Ottawa | [maps.ottawa.ca](https://maps.ottawa.ca/arcgis/rest/services/PublicWashrooms/MapServer/0) | Open Data Licence Version 2.0 (Open Government Licence – City of Ottawa) | 2026-11-16 | 186 | 0 |
| `ottawa-parks-inventory` | City of Ottawa | [maps.ottawa.ca](https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer) | Open Data Licence Version 2.0 (Open Government Licence – City of Ottawa) | 2026-11-16 | 7,916 | 0 |
| `ottawa-park-parking` | City of Ottawa | [maps.ottawa.ca](https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer/14) | Open Data Licence Version 2.0 (Open Government Licence – City of Ottawa) | 2026-11-16 | 408 | 0 |

Records in this list: 85,763. The three washroom rows marked as a refresh replace files first imported on 2026-11-13.

Not imported on 2026-11-16:

- [Kaggle datasets on Ontario accessibility](https://www.kaggle.com/datasets/johnnykhan1/toronto-accessibility-and-disability-data): The relevant dataset repackages City of Toronto open data. The same files were imported from the publisher instead. Nothing was taken from Kaggle.
- [City of Toronto Museums and Cultural Centres washrooms](https://open.toronto.ca/dataset/museums-and-cultural-centres/): The file has no coordinates and the pipeline does not geocode.
- [City of Toronto Traffic Beacon and Pedestrian Crossover resources](https://open.toronto.ca/dataset/traffic-signals-tabular/): No accessibility column.
- [OC Transpo static GTFS](https://www.octranspo.com/files/google_transit.zip): The zip returned HTTP 403 on 2026-11-16.
- [City of Ottawa Pedestrian Network, Sidewalks, parks layers 5, 7, 8, 23 and 24, drinking fountains, recreation facilities](https://maps.ottawa.ca/arcgis/rest/services/): Licence read on 2026-11-16. Not mapped in this pass.
- [Other sources in this catalogue](https://github.com/ALENZACODES/access-maps/blob/main/sources/gaps.json): Not retrieved on 2026-11-16. access-maps sources/gaps.json gives the reason for each.

## Sources

| Source | Licence (status) | Counted | Count kind | Lane or owner | Cadence |
| --- | --- | ---: | --- | --- | --- |
| [OpenStreetMap Ontario: objects with accessibility tags](https://download.geofabrik.de/north-america/canada/ontario.html) | Open Database License 1.0 (open) | 162,066  | counted | access-maps #1 | Daily extract (Geofabrik); upstream continuous |
| [OpenStreetMap Ontario: base places and pedestrian network (accessibility UNKNOWN unless tagged)](https://download.geofabrik.de/north-america/canada/ontario.html) | Open Database License 1.0 (open) | 1,378,279  | counted | access-maps #1 | Daily extract |
| [OC Transpo (Ottawa) GTFS stops](https://www.octranspo.com/en/plan-your-trip/travel-tools/developers/) | City of Ottawa / OC Transpo developer terms (verify) | 5,842 (stops.txt rows) | counted | H1 | Per service change (typically every 6–12 weeks) |
| [York Region Transit GTFS stops](https://www.yrt.ca/en/about-us/open-data-licence-agreement.aspx) | YRT Open Data Licence Agreement (verify) | 4,827 (stops.txt rows) | counted | H1 | Per service change (typically every 6–12 weeks) |
| [Durham Region Transit GTFS stops](https://opendata.durham.ca/) | Region of Durham Open Data Licence (verify) | 1,912 (stops.txt rows) | counted | H1 | Per service change (typically every 6–12 weeks) |
| [Kingston Transit GTFS stops](https://opendatakingston.cityofkingston.ca/) | Open Data Licence – City of Kingston 1.0 (open-recorded) | 770 (stops.txt rows) | counted | H1 | Per service change (typically every 6–12 weeks) |
| [Barrie Transit GTFS stops](https://www.barrie.ca/services-payments/transportation-parking/barrie-transit/barrie-gtfs) | City of Barrie open data terms (verify) | 559 (stops.txt rows) | counted | H1 | Per service change (typically every 6–12 weeks) |
| [Burlington Transit GTFS stops](https://opendata.burlington.ca/) | City of Burlington Open Data Terms of Use (verify) | 787 (stops.txt rows) | counted | H1 | Per service change (typically every 6–12 weeks) |
| [Oakville Transit GTFS stops](http://www.oakville.ca/data/oakville-transit-route-information.html) | Town of Oakville open data licence (verify) | 1,163 (stops.txt rows) | counted | H1 | Per service change (typically every 6–12 weeks) |
| [Transit Windsor GTFS stops](https://opendata.citywindsor.ca/) | City of Windsor open data terms (verify) | 1,464 (stops.txt rows) | counted | H1 | Per service change (typically every 6–12 weeks) |
| [Thunder Bay Transit GTFS stops](http://api.nextlift.ca/gtfs.zip) | No licence text found with the feed (unknown) | 732 (stops.txt rows) | counted | H1 | Per service change (typically every 6–12 weeks) |
| [GOVA Transit (Greater Sudbury) GTFS stops](https://www.greatersudbury.ca/) | Open Data Licence – City of Greater Sudbury (open-recorded) | 1,121 (stops.txt rows) | counted | H1 | Per service change (typically every 6–12 weeks) |
| [Milton Transit GTFS stops](https://discover-milton.hub.arcgis.com/pages/disclaimer-and-terms-of-use) | Town of Milton terms of use (verify) | 414 (stops.txt rows) | counted | H1 | Per service change (typically every 6–12 weeks) |
| [Belleville Transit GTFS stops](https://metrolinx.tmix.se/gtfs/gtfs-belleville.zip) | No licence text found with the feed (unknown) | 245 (stops.txt rows) | counted | H1 | Per service change (typically every 6–12 weeks) |
| [Cornwall Transit GTFS stops](http://metrolinx.tmix.se/gtfs/gtfs-cornwall.zip) | No licence text found with the feed (unknown) | 308 (stops.txt rows) | counted | H1 | Per service change (typically every 6–12 weeks) |
| [TTC GTFS stops](https://open.toronto.ca/dataset/ttc-routes-and-schedules/) | Open Government Licence – Toronto (open-recorded) | 9,368 (stops.txt rows) | counted | access-maps #1 | Per service change (typically every 6–12 weeks) |
| [GO Transit GTFS stops](https://www.metrolinx.com/en/about-us/open-data) | Open Government Licence – Ontario – Metrolinx (held in access-maps #1 as revocable) (held) | 889 (stops.txt rows) | counted | access-maps #1 | Per service change (typically every 6–12 weeks) |
| [UP Express GTFS stops](https://www.metrolinx.com/en/about-us/open-data) | Open Government Licence – Ontario – Metrolinx (held in access-maps #1) (held) | 5 (stops.txt rows) | counted | access-maps #1 | Per service change (typically every 6–12 weeks) |
| [MiWay GTFS stops](https://www.mississauga.ca/miway-transit/developer-download/) | City of Mississauga Terms of Use (held in access-maps #1) (held) | 4,066 (stops.txt rows) | counted | access-maps #1 | Per service change (typically every 6–12 weeks) |
| [Brampton Transit GTFS stops](https://www.arcgis.com/home/item.html?id=a355aabd5a8c490186bdce559c9c75fb) | CC BY (open-recorded) | 2,872 (stops.txt rows) | counted | access-maps #1 | Per service change (typically every 6–12 weeks) |
| [Grand River Transit (bus) GTFS stops](https://www.grt.ca/about-grt/open-data/) | Region of Waterloo Open Data Licence 2.0 (open-recorded) | 2,265 (stops.txt rows) | counted | access-maps #1 | Per service change (typically every 6–12 weeks) |
| [London Transit Commission GTFS stops](https://www.londontransit.ca/open-data/) | LTC Open Data Terms of Use (held in access-maps #1) (held) | 1,938 (stops.txt rows) | counted | access-maps #1 | Per service change (typically every 6–12 weeks) |
| [Hamilton Street Railway GTFS stops](https://www.hamilton.ca/city-council/data-maps/open-data/open-data-licence-terms-and-conditions) | City of Hamilton Open Data Licence (open-recorded) | 2,353 (stops.txt rows) | counted | access-maps #1 | Per service change (typically every 6–12 weeks) |
| [GTFS-RT elevator / accessibility alerts (TTC, GO, OC Transpo)](https://open.toronto.ca/dataset/ttc-gtfs-realtime-gtfs-rt/) | Per agency; GO and OC Transpo real-time need a registered key (keyed-or-held) | —  | not-counted | access-maps #1 | Real-time |
| [Traffic signals with accessible pedestrian signal (APS) flag](https://open.toronto.ca/dataset/traffic-signals-tabular/) | Open Government Licence – Toronto (open) | 2,563  | counted | H2 | As available |
| [Pedestrian crossovers](https://open.toronto.ca/dataset/traffic-signals-tabular/) | Open Government Licence – Toronto (open) | 496  | counted | H2 | As available |
| [Privately owned publicly-accessible spaces (POPS)](https://open.toronto.ca/dataset/privately-owned-publicly-available-spaces/) | Open Government Licence – Toronto (open) | 308  | counted | H2 | As available |
| [Parks and recreation facilities](https://open.toronto.ca/dataset/parks-and-recreation-facilities/) | Open Government Licence – Toronto (open-recorded) | 1,801  | counted | H2 | Monthly |
| [Off-street surface lots: accessible stalls](https://open.toronto.ca/dataset/off-street-parking-surface-lots-accessible-stalls/) | Open Government Licence – Toronto (open) | 669  | counted | H5 | Annually |
| [Pedestrian network (sidewalk and crosswalk segments)](https://open.toronto.ca/dataset/pedestrian-network/) | Open Government Licence – Toronto (open) | 87,105  | counted | H4 | As available |
| [Topographic mapping: physical area of sidewalks](https://open.toronto.ca/dataset/topographic-mapping-physical-area-of-sidewalks/) | Open Government Licence – Toronto (open) | 14,116  | counted | H4 | Quarterly |
| [Parks inventory layers with a bilingual ACCESSIBLE field (benches, play structures, sports fields, rinks, splash pads, parks and greenspace and more)](https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer) | City of Ottawa Open Data Licence v2.0 (open-recorded) | 11,391  | counted | H3 | As updated by the city (MODIFIED_DATE per feature) |
| [Pedestrian network (Pedestrian Plan)](https://maps.ottawa.ca/arcgis/rest/services/Pedestrian_Plan/MapServer/0) | City of Ottawa Open Data Licence v2.0 (open-recorded) | 20,298  | counted | H4 | As updated |
| [City-owned parking facilities (Accessible space count)](https://services6.arcgis.com/hM5ymMLbxIyWTjn2/arcgis/rest/services/City_Owned_Parkng_Facilities/FeatureServer/0) | City of Mississauga Open Data Terms of Use (verify) | 282  | counted | H5 | As updated |
| [City public washrooms](https://services6.arcgis.com/hM5ymMLbxIyWTjn2/arcgis/rest/services/City_Public_Washrooms/FeatureServer/1) | City of Mississauga Open Data Terms of Use (verify) | 48  | counted | deferred | As updated |
| [Sidewalk segments](https://services3.arcgis.com/rl7ACuZkiFsmDA2g/arcgis/rest/services/Sidewalks/FeatureServer/0) | Creative Commons Attribution 4.0 (per Brampton GeoHub item) (open) | 429,007  | counted | H4 | As updated |
| [Parks](https://services3.arcgis.com/rl7ACuZkiFsmDA2g/arcgis/rest/services/Planning_Parks/FeatureServer/1) | Creative Commons Attribution 4.0 (per Brampton GeoHub item) (open) | 869  | counted | deferred | As updated |
| [Sidewalks (Width, Material)](https://maps.london.ca/server/rest/services/OpenData/OpenData_Transportation/MapServer/4) | City of London Open Data licence (verify) | 11,196  | counted | H4 | As updated |
| [Walkways](https://maps.london.ca/server/rest/services/OpenData/OpenData_Transportation/MapServer/6) | City of London Open Data licence (verify) | 465  | counted | H4 | As updated |
| [Parking inventory (CountDisabledSpaces)](https://maps.london.ca/server/rest/services/OpenData/OpenData_Transportation/MapServer/1) | City of London Open Data licence (verify) | 170  | counted | H5 | As updated |
| [Signalized intersections](https://maps.london.ca/server/rest/services/OpenData/OpenData_Transportation/MapServer/14) | City of London Open Data licence (verify) | 448  | counted | deferred | As updated |
| [Parks](https://maps.london.ca/server/rest/services/OpenData/OpenData_Recreation/MapServer/3) | City of London Open Data licence (verify) | 609  | counted | deferred | As updated |
| [Kitchener sidewalks and active-transport segments (WIDTH_M, GRADE, CURBCUT, SURFACE_CONDITION)](https://services1.arcgis.com/qAo1OsXi67t7XgmS/arcgis/rest/services/Sidewalks/FeatureServer/0) | City of Kitchener Open Data licence (verify) | 17,111  | counted | H4 | As updated (STATUS_DATE, CONDITION_DATE per feature) |
| [City of Waterloo sidewalks](https://services.arcgis.com/ZpeBVw5o1kjit7LT/arcgis/rest/services/Sidewalks/FeatureServer/0) | City of Waterloo Open Data licence (verify) | 5,262  | counted | H4 | As updated |
| [City of Waterloo city-operated parking lots (ACCESSIBLE)](https://services.arcgis.com/ZpeBVw5o1kjit7LT/arcgis/rest/services/ParkingLots/FeatureServer/0) | City of Waterloo Open Data licence (verify) | 31  | counted | H5 | As updated |
| [Parks inventory: parking (ACCESSIBLE_PARKING_CAPACITY)](https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer/14) | City of Ottawa Open Data Licence v2.0 (open-recorded) | 409  | counted | H5 | As updated |
| [Hamilton, York Region, Vaughan, Durham hubs](https://open.hamilton.ca/) | Not checked (unknown) | —  | not-counted | deferred | Unknown |
| [Ministry of Health service provider locations (MOHSERLO)](https://data.ontario.ca/dataset/ministry-of-health-service-provider-locations-mohserlo) | Open Government Licence – Ontario (open) | 11,625  | counted | deferred | Yearly |
| [Approved functional assessment centres for drivers](https://data.ontario.ca/dataset/approved-functional-assessment-centres-for-drivers) | Open Government Licence – Ontario (open) | 46  | counted | deferred | Yearly |
| [Catalogue search for accessibility place data](https://data.ontario.ca/) | Open Government Licence – Ontario (open) | —  | not-counted | access-maps #1 | n/a |
| [Total Accessibility Score of PSPC owned and lease-purchased buildings (CSA B651-18)](https://open.canada.ca/data/en/dataset/aaf6462d-eab9-4165-9329-24095451121d) | Open Government Licence – Canada 2.0 (open) | 71  | counted | D1 | Not planned (one-off; assessed 2020–2021) |
| [Canadian Survey on Disability 2022 tables 13-10-0374, 13-10-0376, 13-10-0377, 13-10-0750](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1310037401) | Statistics Canada Open Licence (open) | 118,764 (statistical datapoints (not place records)) | counted | deferred | Every 5 years (released 2024-12-03 and 2025-03-25) |
| [CMHC Housing Market Information Portal](https://open.canada.ca/data/en/dataset/c2a1fdbf-d9b7-4c84-b7eb-c845b6ffd5e6) | Open Government Licence – Canada 2.0 (open) | —  | not-counted | deferred | Monthly |
| [Accessibility Standards Canada](https://open.canada.ca/data/en/dataset/15c31fd7-3bcf-40f8-bd91-af6a315a83cc) | Open Government Licence – Canada 2.0 (open) | —  | not-counted | deferred | Every 3 years |
| [Wikidata items in Ontario with wheelchair accessibility (P2846)](https://query.wikidata.org/) | CC0 1.0 (open) | 276  | counted | D2 | Continuous |
| [Overture Maps places theme](https://docs.overturemaps.org/attribution/) | CDLA Permissive 2.0 (places theme) (excluded) | —  | not-counted | deferred | Monthly releases |

## Source details

### OpenStreetMap Ontario: objects with accessibility tags

- **ID:** `osm-ontario-a11y-tags` · **Publisher:** OpenStreetMap contributors (Geofabrik Ontario extract) · **URL:** https://download.geofabrik.de/north-america/canada/ontario.html
- **Licence:** Open Database License 1.0 (https://opendatacommons.org/licenses/odbl/1-0/) · status `open`
- **Share-alike:** ODbL share-alike: any public derived database built from OSM (including tiles' underlying data) must be offered under ODbL; keep OSM-derived records in their own partition with attribution; produced works (rendered maps) need attribution only.
- **Count:** 162,066 records (counted, 2026-11-15). Method: pyosmium 4 KeyFilter stream over ontario-261114.osm.pbf (1,017,668,533 bytes, Last-Modified 2026-11-15 05:34 UTC); object counted once if it has any of wheelchair, toilets:wheelchair, kerb, tactile_paving, ramp:wheelchair, highway=elevator, parking_space=disabled, capacity:disabled, automatic_door. File deleted after counting.
- **Breakdown:** wheelchair=*: 46,835; wheelchair values: {'yes': 39566, 'no': 4931, 'limited': 2157, 'designated': 148, '2': 8, 'bad': 8, '3': 5, 'ramp': 3}; toilets:wheelchair=*: 1,346; amenity=toilets: 4,086; entrance=*: 17,649; kerb=*: 63,530; kerb values: {'lowered': 48141, 'flush': 9831, 'raised': 4117, 'yes': 1190, 'no': 156, 'rolled': 83, 'regular': 4, 'height=*': 3}; tactile_paving=*: 101,546; parking_space=disabled: 11,516; capacity:disabled=*: 3,511; highway=elevator: 517; step_count=*: 2,046; ramp:wheelchair=*: 137; automatic_door=*: 57
- **Accessibility fields:** wheelchair, toilets:wheelchair, entrance, kerb, tactile_paving, step_count, ramp:wheelchair, parking_space=disabled, capacity:disabled, highway=elevator, automatic_door
- **Place schema mapping:** source → Provenance.sourceName = "OpenStreetMap contributors (Geofabrik Ontario extract): OpenStreetMap Ontario: objects with accessibility tags"; sourceId = "osm-ontario-a11y-tags" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Database License 1.0"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Already covered by:** access-maps #1 (cursor/ontario-open-data-pipeline-986f) already imports OSM Ontario venues, washrooms and paths. No new lane.
- **Import plan:** Covered by access-maps #1. Do not re-import in access-tools. Values other than yes/no/limited/designated (for example wheelchair=2, bad, ramp) stay UNKNOWN and are listed as unmapped.

### OpenStreetMap Ontario: base places and pedestrian network (accessibility UNKNOWN unless tagged)

- **ID:** `osm-ontario-base` · **Publisher:** OpenStreetMap contributors · **URL:** https://download.geofabrik.de/north-america/canada/ontario.html
- **Licence:** Open Database License 1.0 (https://opendatacommons.org/licenses/odbl/1-0/) · status `open`
- **Share-alike:** ODbL share-alike: any public derived database built from OSM (including tiles' underlying data) must be offered under ODbL; keep OSM-derived records in their own partition with attribution; produced works (rendered maps) need attribution only.
- **Count:** 1,378,279 records (counted, 2026-11-15). Method: Same stream as above: POIs (amenity/shop/tourism/leisure/healthcare/office) + pedestrian ways (footway/pedestrian/path/steps/cycleway/living_street) + highway=crossing nodes + bus stops/platforms.
- **Breakdown:** pois: 540,620; pois_named: 172,111; pois_with_wheelchair: 12,208; pedestrian_ways: 575,813; of_which_footway=sidewalk: 198,006; crossing_nodes: 221,934; transit_platforms_or_bus_stops: 39,912; building_footprints_not_in_total: 3,128,244
- **Accessibility fields:** None by default. Every accessibility field stays UNKNOWN unless an explicit tag exists.
- **Place schema mapping:** source → Provenance.sourceName = "OpenStreetMap contributors: OpenStreetMap Ontario: base places and pedestrian network (accessibility UNKNOWN unless tagged)"; sourceId = "osm-ontario-base" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Database License 1.0"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Already covered by:** access-maps #1 (540,944 venues and 846,525 path records in its counts). No new lane.
- **Import plan:** Covered by access-maps #1. 3,128,244 building footprints are listed for context and not counted as place records.

### OC Transpo (Ottawa) GTFS stops

- **ID:** `gtfs-oc-transpo` · **Publisher:** OC Transpo (Ottawa) · **URL:** https://www.octranspo.com/en/plan-your-trip/travel-tools/developers/
- **Licence:** City of Ottawa / OC Transpo developer terms (https://www.octranspo.com/en/plan-your-trip/travel-tools/developers/) · status `verify`
- **Count:** 5,842 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the agency download URL; zip deleted after counting.
- **Breakdown:** stops_location_type_0: 5,781; wheelchair_boarding_1_or_2_on_stops: 0; share_set_pct: 0.0; wheelchair_boarding_values: {'': 5798, '0': 44}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "OC Transpo (Ottawa): OC Transpo (Ottawa) GTFS stops"; sourceId = "gtfs-oc-transpo" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of Ottawa / OC Transpo developer terms"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import status (2026-11-16):** Not imported. On 2026-11-16 the City of Ottawa open-data item for the schedules linked the Open Data Licence Version 2.0, and the zip returned HTTP 403. Listed in access-maps sources/gaps.json.
- **Import plan:** Lane H1: streaming stops.txt reader; licence must be confirmed (status 'verify'/'unknown' feeds are imported only into a local, git-ignored output until a person records the licence).

### York Region Transit GTFS stops

- **ID:** `gtfs-yrt` · **Publisher:** York Region Transit · **URL:** https://www.yrt.ca/en/about-us/open-data-licence-agreement.aspx
- **Licence:** YRT Open Data Licence Agreement (https://www.yrt.ca/en/about-us/open-data-licence-agreement.aspx) · status `verify`
- **Count:** 4,827 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the agency download URL; zip deleted after counting.
- **Breakdown:** stops_location_type_0: 4,809; wheelchair_boarding_1_or_2_on_stops: 4,809; share_set_pct: 100.0; wheelchair_boarding_values: {'1': 3847, '2': 980}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "York Region Transit: York Region Transit GTFS stops"; sourceId = "gtfs-yrt" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "YRT Open Data Licence Agreement"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H1: streaming stops.txt reader; licence must be confirmed (status 'verify'/'unknown' feeds are imported only into a local, git-ignored output until a person records the licence).

### Durham Region Transit GTFS stops

- **ID:** `gtfs-durham-drt` · **Publisher:** Durham Region Transit · **URL:** https://opendata.durham.ca/
- **Licence:** Region of Durham Open Data Licence (https://opendata.durham.ca/) · status `verify`
- **Count:** 1,912 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the agency download URL; zip deleted after counting.
- **Breakdown:** stops_location_type_0: 1,912; wheelchair_boarding_1_or_2_on_stops: 1,912; share_set_pct: 100.0; wheelchair_boarding_values: {'1': 1889, '2': 23}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "Durham Region Transit: Durham Region Transit GTFS stops"; sourceId = "gtfs-durham-drt" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Region of Durham Open Data Licence"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H1: streaming stops.txt reader; licence must be confirmed (status 'verify'/'unknown' feeds are imported only into a local, git-ignored output until a person records the licence).

### Kingston Transit GTFS stops

- **ID:** `gtfs-kingston-transit` · **Publisher:** Kingston Transit · **URL:** https://opendatakingston.cityofkingston.ca/
- **Licence:** Open Data Licence – City of Kingston 1.0 (https://opendatakingston.cityofkingston.ca/) · status `open-recorded`
- **Count:** 770 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the agency download URL; zip deleted after counting.
- **Breakdown:** stops_location_type_0: 770; wheelchair_boarding_1_or_2_on_stops: 0; share_set_pct: 0.0; wheelchair_boarding_values: {'0': 770}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "Kingston Transit: Kingston Transit GTFS stops"; sourceId = "gtfs-kingston-transit" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Data Licence – City of Kingston 1.0"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H1: streaming stops.txt reader; licence must be confirmed (status 'verify'/'unknown' feeds are imported only into a local, git-ignored output until a person records the licence).

### Barrie Transit GTFS stops

- **ID:** `gtfs-barrie-transit` · **Publisher:** Barrie Transit · **URL:** https://www.barrie.ca/services-payments/transportation-parking/barrie-transit/barrie-gtfs
- **Licence:** City of Barrie open data terms (https://www.barrie.ca/services-payments/transportation-parking/barrie-transit/barrie-gtfs) · status `verify`
- **Count:** 559 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the Mobility Database mirror of the latest feed (agency URL returned HTTP 500 or was not used); zip deleted after counting.
- **Breakdown:** stops_location_type_0: 558; wheelchair_boarding_1_or_2_on_stops: 0; share_set_pct: 0.0; wheelchair_boarding_values: {'': 1, '0': 558}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "Barrie Transit: Barrie Transit GTFS stops"; sourceId = "gtfs-barrie-transit" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of Barrie open data terms"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H1: streaming stops.txt reader; licence must be confirmed (status 'verify'/'unknown' feeds are imported only into a local, git-ignored output until a person records the licence).

### Burlington Transit GTFS stops

- **ID:** `gtfs-burlington-transit` · **Publisher:** Burlington Transit · **URL:** https://opendata.burlington.ca/
- **Licence:** City of Burlington Open Data Terms of Use (https://opendata.burlington.ca/) · status `verify`
- **Count:** 787 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the agency download URL; zip deleted after counting.
- **Breakdown:** stops_location_type_0: 787; wheelchair_boarding_1_or_2_on_stops: 787; share_set_pct: 100.0; wheelchair_boarding_values: {'1': 712, '2': 75}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "Burlington Transit: Burlington Transit GTFS stops"; sourceId = "gtfs-burlington-transit" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of Burlington Open Data Terms of Use"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H1: streaming stops.txt reader; licence must be confirmed (status 'verify'/'unknown' feeds are imported only into a local, git-ignored output until a person records the licence).

### Oakville Transit GTFS stops

- **ID:** `gtfs-oakville-transit` · **Publisher:** Oakville Transit · **URL:** http://www.oakville.ca/data/oakville-transit-route-information.html
- **Licence:** Town of Oakville open data licence (http://www.oakville.ca/data/oakville-transit-route-information.html) · status `verify`
- **Count:** 1,163 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the agency download URL; zip deleted after counting.
- **Breakdown:** stops_location_type_0: 1,163; wheelchair_boarding_1_or_2_on_stops: 0; share_set_pct: 0.0; wheelchair_boarding_values: {'0': 1163}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "Oakville Transit: Oakville Transit GTFS stops"; sourceId = "gtfs-oakville-transit" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Town of Oakville open data licence"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H1: streaming stops.txt reader; licence must be confirmed (status 'verify'/'unknown' feeds are imported only into a local, git-ignored output until a person records the licence).

### Transit Windsor GTFS stops

- **ID:** `gtfs-transit-windsor` · **Publisher:** Transit Windsor · **URL:** https://opendata.citywindsor.ca/
- **Licence:** City of Windsor open data terms (https://opendata.citywindsor.ca/) · status `verify`
- **Count:** 1,464 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the agency download URL; zip deleted after counting.
- **Breakdown:** stops_location_type_0: 1,464; wheelchair_boarding_1_or_2_on_stops: 1,464; share_set_pct: 100.0; wheelchair_boarding_values: {'1': 1464}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "Transit Windsor: Transit Windsor GTFS stops"; sourceId = "gtfs-transit-windsor" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of Windsor open data terms"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H1: streaming stops.txt reader; licence must be confirmed (status 'verify'/'unknown' feeds are imported only into a local, git-ignored output until a person records the licence).

### Thunder Bay Transit GTFS stops

- **ID:** `gtfs-thunder-bay` · **Publisher:** Thunder Bay Transit · **URL:** http://api.nextlift.ca/gtfs.zip
- **Licence:** No licence text found with the feed (http://api.nextlift.ca/gtfs.zip) · status `unknown`
- **Count:** 732 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the Mobility Database mirror of the latest feed (agency URL returned HTTP 500 or was not used); zip deleted after counting.
- **Breakdown:** stops_location_type_0: 732; wheelchair_boarding_1_or_2_on_stops: 480; share_set_pct: 65.6; wheelchair_boarding_values: {'1': 480, '0': 252}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "Thunder Bay Transit: Thunder Bay Transit GTFS stops"; sourceId = "gtfs-thunder-bay" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "No licence text found with the feed"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H1: streaming stops.txt reader; licence must be confirmed (status 'verify'/'unknown' feeds are imported only into a local, git-ignored output until a person records the licence).

### GOVA Transit (Greater Sudbury) GTFS stops

- **ID:** `gtfs-sudbury-gova` · **Publisher:** GOVA Transit (Greater Sudbury) · **URL:** https://www.greatersudbury.ca/
- **Licence:** Open Data Licence – City of Greater Sudbury (https://www.greatersudbury.ca/) · status `open-recorded`
- **Count:** 1,121 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the agency download URL; zip deleted after counting.
- **Breakdown:** stops_location_type_0: 1,121; wheelchair_boarding_1_or_2_on_stops: 0; share_set_pct: 0.0; wheelchair_boarding_values: {'0': 1121}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "GOVA Transit (Greater Sudbury): GOVA Transit (Greater Sudbury) GTFS stops"; sourceId = "gtfs-sudbury-gova" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Data Licence – City of Greater Sudbury"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H1: streaming stops.txt reader; licence must be confirmed (status 'verify'/'unknown' feeds are imported only into a local, git-ignored output until a person records the licence).

### Milton Transit GTFS stops

- **ID:** `gtfs-milton-transit` · **Publisher:** Milton Transit · **URL:** https://discover-milton.hub.arcgis.com/pages/disclaimer-and-terms-of-use
- **Licence:** Town of Milton terms of use (https://discover-milton.hub.arcgis.com/pages/disclaimer-and-terms-of-use) · status `verify`
- **Count:** 414 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the Mobility Database mirror of the latest feed (agency URL returned HTTP 500 or was not used); zip deleted after counting.
- **Breakdown:** stops_location_type_0: 414; wheelchair_boarding_1_or_2_on_stops: 0; share_set_pct: 0.0; wheelchair_boarding_values: {'0': 414}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "Milton Transit: Milton Transit GTFS stops"; sourceId = "gtfs-milton-transit" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Town of Milton terms of use"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H1: streaming stops.txt reader; licence must be confirmed (status 'verify'/'unknown' feeds are imported only into a local, git-ignored output until a person records the licence).

### Belleville Transit GTFS stops

- **ID:** `gtfs-belleville-transit` · **Publisher:** Belleville Transit · **URL:** https://metrolinx.tmix.se/gtfs/gtfs-belleville.zip
- **Licence:** No licence text found with the feed (https://metrolinx.tmix.se/gtfs/gtfs-belleville.zip) · status `unknown`
- **Count:** 245 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the agency download URL; zip deleted after counting.
- **Breakdown:** stops_location_type_0: 245; wheelchair_boarding_1_or_2_on_stops: 0; share_set_pct: 0.0; wheelchair_boarding_values: {'0': 245}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "Belleville Transit: Belleville Transit GTFS stops"; sourceId = "gtfs-belleville-transit" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "No licence text found with the feed"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H1: streaming stops.txt reader; licence must be confirmed (status 'verify'/'unknown' feeds are imported only into a local, git-ignored output until a person records the licence).

### Cornwall Transit GTFS stops

- **ID:** `gtfs-cornwall-transit` · **Publisher:** Cornwall Transit · **URL:** http://metrolinx.tmix.se/gtfs/gtfs-cornwall.zip
- **Licence:** No licence text found with the feed (http://metrolinx.tmix.se/gtfs/gtfs-cornwall.zip) · status `unknown`
- **Count:** 308 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the Mobility Database mirror of the latest feed (agency URL returned HTTP 500 or was not used); zip deleted after counting.
- **Breakdown:** stops_location_type_0: 308; wheelchair_boarding_1_or_2_on_stops: 0; share_set_pct: 0.0; wheelchair_boarding_values: {'0': 308}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "Cornwall Transit: Cornwall Transit GTFS stops"; sourceId = "gtfs-cornwall-transit" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "No licence text found with the feed"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H1: streaming stops.txt reader; licence must be confirmed (status 'verify'/'unknown' feeds are imported only into a local, git-ignored output until a person records the licence).

### TTC GTFS stops

- **ID:** `gtfs-ttc` · **Publisher:** TTC · **URL:** https://open.toronto.ca/dataset/ttc-routes-and-schedules/
- **Licence:** Open Government Licence – Toronto (https://open.toronto.ca/dataset/ttc-routes-and-schedules/) · status `open-recorded`
- **Count:** 9,368 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the Mobility Database mirror of the latest feed (agency URL returned HTTP 500 or was not used); zip deleted after counting.
- **Breakdown:** stops_location_type_0: 9,368; wheelchair_boarding_1_or_2_on_stops: 9,368; share_set_pct: 100.0; wheelchair_boarding_values: {'1': 8064, '2': 1304}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "TTC: TTC GTFS stops"; sourceId = "gtfs-ttc" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Government Licence – Toronto"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Already covered by:** access-maps #1 already imports this feed.
- **Import plan:** Covered by access-maps #1.

### GO Transit GTFS stops

- **ID:** `gtfs-go-transit` · **Publisher:** GO Transit · **URL:** https://www.metrolinx.com/en/about-us/open-data
- **Licence:** Open Government Licence – Ontario – Metrolinx (held in access-maps #1 as revocable) (https://www.metrolinx.com/en/about-us/open-data) · status `held`
- **Count:** 889 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the agency download URL; zip deleted after counting.
- **Breakdown:** stops_location_type_0: 889; wheelchair_boarding_1_or_2_on_stops: 889; share_set_pct: 100.0; wheelchair_boarding_values: {'1': 769, '2': 120}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "GO Transit: GO Transit GTFS stops"; sourceId = "gtfs-go-transit" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Government Licence – Ontario – Metrolinx (held in access-maps #1 as revocable)"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Already covered by:** access-maps #1 already imports this feed.
- **Import plan:** Covered by access-maps #1.

### UP Express GTFS stops

- **ID:** `gtfs-up-express` · **Publisher:** UP Express · **URL:** https://www.metrolinx.com/en/about-us/open-data
- **Licence:** Open Government Licence – Ontario – Metrolinx (held in access-maps #1) (https://www.metrolinx.com/en/about-us/open-data) · status `held`
- **Count:** 5 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the agency download URL; zip deleted after counting.
- **Breakdown:** stops_location_type_0: 5; wheelchair_boarding_1_or_2_on_stops: 5; share_set_pct: 100.0; wheelchair_boarding_values: {'1': 5}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "UP Express: UP Express GTFS stops"; sourceId = "gtfs-up-express" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Government Licence – Ontario – Metrolinx (held in access-maps #1)"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Already covered by:** access-maps #1 already imports this feed.
- **Import plan:** Covered by access-maps #1.

### MiWay GTFS stops

- **ID:** `gtfs-miway` · **Publisher:** MiWay · **URL:** https://www.mississauga.ca/miway-transit/developer-download/
- **Licence:** City of Mississauga Terms of Use (held in access-maps #1) (https://www.mississauga.ca/miway-transit/developer-download/) · status `held`
- **Count:** 4,066 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the agency download URL; zip deleted after counting.
- **Breakdown:** stops_location_type_0: 3,124; wheelchair_boarding_1_or_2_on_stops: 3,124; share_set_pct: 100.0; wheelchair_boarding_values: {'1': 3027, '2': 97, '0': 942}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "MiWay: MiWay GTFS stops"; sourceId = "gtfs-miway" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of Mississauga Terms of Use (held in access-maps #1)"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Already covered by:** access-maps #1 already imports this feed.
- **Import plan:** Covered by access-maps #1.

### Brampton Transit GTFS stops

- **ID:** `gtfs-brampton-transit` · **Publisher:** Brampton Transit · **URL:** https://www.arcgis.com/home/item.html?id=a355aabd5a8c490186bdce559c9c75fb
- **Licence:** CC BY (https://www.arcgis.com/home/item.html?id=a355aabd5a8c490186bdce559c9c75fb) · status `open-recorded`
- **Count:** 2,872 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the agency download URL; zip deleted after counting.
- **Breakdown:** stops_location_type_0: 2,849; wheelchair_boarding_1_or_2_on_stops: 2,469; share_set_pct: 86.7; wheelchair_boarding_values: {'1': 2492, '0': 380}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "Brampton Transit: Brampton Transit GTFS stops"; sourceId = "gtfs-brampton-transit" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "CC BY"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Already covered by:** access-maps #1 already imports this feed.
- **Import plan:** Covered by access-maps #1.

### Grand River Transit (bus) GTFS stops

- **ID:** `gtfs-grt` · **Publisher:** Grand River Transit (bus) · **URL:** https://www.grt.ca/about-grt/open-data/
- **Licence:** Region of Waterloo Open Data Licence 2.0 (https://www.grt.ca/about-grt/open-data/) · status `open-recorded`
- **Count:** 2,265 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the agency download URL; zip deleted after counting.
- **Breakdown:** stops_location_type_0: 2,251; wheelchair_boarding_1_or_2_on_stops: 2,251; share_set_pct: 100.0; wheelchair_boarding_values: {'1': 1791, '2': 460, '': 14}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "Grand River Transit (bus): Grand River Transit (bus) GTFS stops"; sourceId = "gtfs-grt" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Region of Waterloo Open Data Licence 2.0"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Already covered by:** access-maps #1 already imports this feed.
- **Import plan:** Covered by access-maps #1.

### London Transit Commission GTFS stops

- **ID:** `gtfs-ltc-london` · **Publisher:** London Transit Commission · **URL:** https://www.londontransit.ca/open-data/
- **Licence:** LTC Open Data Terms of Use (held in access-maps #1) (https://www.londontransit.ca/open-data/) · status `held`
- **Count:** 1,938 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the Mobility Database mirror of the latest feed (agency URL returned HTTP 500 or was not used); zip deleted after counting.
- **Breakdown:** stops_location_type_0: 1,938; wheelchair_boarding_1_or_2_on_stops: 0; share_set_pct: 0.0; wheelchair_boarding_values: {'0': 1938}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "London Transit Commission: London Transit Commission GTFS stops"; sourceId = "gtfs-ltc-london" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "LTC Open Data Terms of Use (held in access-maps #1)"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Already covered by:** access-maps #1 already imports this feed.
- **Import plan:** Covered by access-maps #1.

### Hamilton Street Railway GTFS stops

- **ID:** `gtfs-hsr-hamilton` · **Publisher:** Hamilton Street Railway · **URL:** https://www.hamilton.ca/city-council/data-maps/open-data/open-data-licence-terms-and-conditions
- **Licence:** City of Hamilton Open Data Licence (https://www.hamilton.ca/city-council/data-maps/open-data/open-data-licence-terms-and-conditions) · status `open-recorded`
- **Count:** 2,353 stops.txt rows (counted, 2026-11-15). Method: stops.txt rows streamed from the agency download URL; zip deleted after counting.
- **Breakdown:** stops_location_type_0: 2,350; wheelchair_boarding_1_or_2_on_stops: 0; share_set_pct: 0.0; wheelchair_boarding_values: {'0': 2353}; pathways_or_levels_files: 0
- **Accessibility fields:** wheelchair_boarding (0 or empty = UNKNOWN; 1 = some accessible boarding per agency; 2 = not possible per agency). Child stops inherit only when the parent says so and are marked derived.
- **Place schema mapping:** source → Provenance.sourceName = "Hamilton Street Railway: Hamilton Street Railway GTFS stops"; sourceId = "gtfs-hsr-hamilton" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of Hamilton Open Data Licence"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Already covered by:** access-maps #1 already imports this feed.
- **Import plan:** Covered by access-maps #1.

### GTFS-RT elevator / accessibility alerts (TTC, GO, OC Transpo)

- **ID:** `gtfs-rt-elevator-status` · **Publisher:** Agencies · **URL:** https://open.toronto.ca/dataset/ttc-gtfs-realtime-gtfs-rt/
- **Licence:** Per agency; GO and OC Transpo real-time need a registered key · status `keyed-or-held`
- **Count:** — records (not-counted, 2026-11-15). Method: Not counted: live status is never stored as a place fact (tier 4 needs observedAt and expiresAt). TTC alerts are handled in access-maps #1 and #5.
- **Accessibility fields:** Elevator/escalator outage alerts
- **Place schema mapping:** source → Provenance.sourceName = "Agencies: GTFS-RT elevator / accessibility alerts (TTC, GO, OC Transpo)"; sourceId = "gtfs-rt-elevator-status" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Per agency; GO and OC Transpo real-time need a registered key"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Already covered by:** access-maps #1 and #5
- **Import plan:** No new lane. Live status is shown with expiry, never stored.

### Traffic signals with accessible pedestrian signal (APS) flag

- **ID:** `toronto-traffic-signals-aps` · **Publisher:** City of Toronto · **URL:** https://open.toronto.ca/dataset/traffic-signals-tabular/
- **Licence:** Open Government Licence – Toronto (https://open.toronto.ca/open-data-licence/) · status `open`
- **Count:** 2,563 records (counted, 2026-11-15). Method: CKAN datastore_search total for resource 'Traffic Signal'; full 2,563 rows tallied for AUDIBLEPEDSIGNAL.
- **Breakdown:** AUDIBLEPEDSIGNAL=1: 1,407; AUDIBLEPEDSIGNAL=-1: 26; AUDIBLEPEDSIGNAL=null: 1,130
- **Accessibility fields:** AUDIBLEPEDSIGNAL (1 = APS present per city; -1 and null stay UNKNOWN), APS_OPERATION, PEDWALKSPEED, ACTIVATIONDATE
- **Place schema mapping:** source → Provenance.sourceName = "City of Toronto: Traffic signals with accessible pedestrian signal (APS) flag"; sourceId = "toronto-traffic-signals-aps" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Government Licence – Toronto"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import status (2026-11-16):** Imported on 2026-11-16 as access-maps source toronto-traffic-signals: 2,563 venue records, tier 0. AUDIBLEPEDSIGNAL 1 is stored as speech_output yes (1,407); blank and -1 stay UNKNOWN (1,156). access-maps pull request #48 (branch claude/real-data-imports).
- **Import plan:** Lane H2: page the CKAN datastore_search API (limit 1000/page) or stream the 4326 GeoJSON; map listed fields only; everything else UNKNOWN.

### Pedestrian crossovers

- **ID:** `toronto-pedestrian-crossovers` · **Publisher:** City of Toronto · **URL:** https://open.toronto.ca/dataset/traffic-signals-tabular/
- **Licence:** Open Government Licence – Toronto (https://open.toronto.ca/open-data-licence/) · status `open`
- **Count:** 496 records (counted, 2026-11-15). Method: CKAN datastore_search total
- **Accessibility fields:** None (location and type only; accessibility UNKNOWN)
- **Place schema mapping:** source → Provenance.sourceName = "City of Toronto: Pedestrian crossovers"; sourceId = "toronto-pedestrian-crossovers" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Government Licence – Toronto"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import status (2026-11-16):** Retrieved on 2026-11-16 and not imported: the resource has no accessibility column. Listed in access-maps sources/gaps.json.
- **Import plan:** Lane H2: page the CKAN datastore_search API (limit 1000/page) or stream the 4326 GeoJSON; map listed fields only; everything else UNKNOWN.

### Privately owned publicly-accessible spaces (POPS)

- **ID:** `toronto-pops` · **Publisher:** City of Toronto · **URL:** https://open.toronto.ca/dataset/privately-owned-publicly-available-spaces/
- **Licence:** Open Government Licence – Toronto (https://open.toronto.ca/open-data-licence/) · status `open`
- **Count:** 308 records (counted, 2026-11-15). Method: CKAN datastore_search totals: 238 points + 70 polygons
- **Breakdown:** points: 238; polygons: 70
- **Accessibility fields:** None (public-access status is not wheelchair access; stays UNKNOWN)
- **Place schema mapping:** source → Provenance.sourceName = "City of Toronto: Privately owned publicly-accessible spaces (POPS)"; sourceId = "toronto-pops" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Government Licence – Toronto"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H2: page the CKAN datastore_search API (limit 1000/page) or stream the 4326 GeoJSON; map listed fields only; everything else UNKNOWN.

### Parks and recreation facilities

- **ID:** `toronto-parks-rec-facilities` · **Publisher:** City of Toronto · **URL:** https://open.toronto.ca/dataset/parks-and-recreation-facilities/
- **Licence:** Open Government Licence – Toronto (https://open.toronto.ca/open-data-licence/) · status `open-recorded`, licence text read 2026-11-16. CKAN license_title is empty for this dataset; the portal default is OGL-Toronto. Confirm on the dataset page before import.
- **Count:** 1,801 records (counted, 2026-11-15). Method: CKAN datastore_search total
- **Accessibility fields:** AMENITIES text only. Do not parse words like 'accessible' into a wheelchair fact; keep raw text, fact UNKNOWN.
- **Place schema mapping:** source → Provenance.sourceName = "City of Toronto: Parks and recreation facilities"; sourceId = "toronto-parks-rec-facilities" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Government Licence – Toronto"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import status (2026-11-16):** Imported on 2026-11-16 as access-maps source toronto-parks-recreation-facilities: 1,801 venue records, tier 0, every accessibility field UNKNOWN. access-maps pull request #48 (branch claude/real-data-imports).
- **Import plan:** Lane H2: page the CKAN datastore_search API (limit 1000/page) or stream the 4326 GeoJSON; map listed fields only; everything else UNKNOWN.

### Off-street surface lots: accessible stalls

- **ID:** `toronto-accessible-stalls` · **Publisher:** City of Toronto · **URL:** https://open.toronto.ca/dataset/off-street-parking-surface-lots-accessible-stalls/
- **Licence:** Open Government Licence – Toronto (https://open.toronto.ca/open-data-licence/) · status `open`
- **Count:** 669 records (counted, 2026-11-15). Method: CKAN datastore_search total
- **Accessibility fields:** AODA_TYPE (stall type per city)
- **Place schema mapping:** source → Provenance.sourceName = "City of Toronto: Off-street surface lots: accessible stalls"; sourceId = "toronto-accessible-stalls" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Government Licence – Toronto"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import status (2026-11-16):** Imported on 2026-11-16 as access-maps source toronto-accessible-parking-stalls: 669 venue records, tier 0, AODA_TYPE stored as published. access-maps pull request #48 (branch claude/real-data-imports).
- **Import plan:** Lane H5: page the CKAN datastore_search API (limit 1000/page) or stream the 4326 GeoJSON; map listed fields only; everything else UNKNOWN.

### Pedestrian network (sidewalk and crosswalk segments)

- **ID:** `toronto-pedestrian-network` · **Publisher:** City of Toronto · **URL:** https://open.toronto.ca/dataset/pedestrian-network/
- **Licence:** Open Government Licence – Toronto (https://open.toronto.ca/open-data-licence/) · status `open`
- **Count:** 87,105 records (counted, 2026-11-15). Method: CKAN datastore_search total
- **Accessibility fields:** SIDEWALK_CODE, SIDEWALK_DESCRIPTION, CROSSWALK, CROSSWALK_TYPE, PX
- **Place schema mapping:** source → Provenance.sourceName = "City of Toronto: Pedestrian network (sidewalk and crosswalk segments)"; sourceId = "toronto-pedestrian-network" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Government Licence – Toronto"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import status (2026-11-16):** Imported in part on 2026-11-16 as access-maps source toronto-pedestrian-network: 70,749 path records, tier 0. 16,356 segments published with no sidewalk, a partial sidewalk or no description on a road were left out. access-maps pull request #48 (branch claude/real-data-imports).
- **Import plan:** Lane H4: stream the 4326 GeoJSON (or page datastore), emit chunked NDJSON partitions ≤ 20 MB gzip as release assets; never commit full outputs.

### Topographic mapping: physical area of sidewalks

- **ID:** `toronto-topo-sidewalks` · **Publisher:** City of Toronto · **URL:** https://open.toronto.ca/dataset/topographic-mapping-physical-area-of-sidewalks/
- **Licence:** Open Government Licence – Toronto (https://open.toronto.ca/open-data-licence/) · status `open`
- **Count:** 14,116 records (counted, 2026-11-15). Method: CKAN datastore_search total
- **Accessibility fields:** SUBTYPE_DESC (polygon footprint; no width or slope)
- **Place schema mapping:** source → Provenance.sourceName = "City of Toronto: Topographic mapping: physical area of sidewalks"; sourceId = "toronto-topo-sidewalks" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Government Licence – Toronto"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H4: stream the 4326 GeoJSON (or page datastore), emit chunked NDJSON partitions ≤ 20 MB gzip as release assets; never commit full outputs.

### Parks inventory layers with a bilingual ACCESSIBLE field (benches, play structures, sports fields, rinks, splash pads, parks and greenspace and more)

- **ID:** `ottawa-parks-inventory` · **Publisher:** City of Ottawa · **URL:** https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer
- **Licence:** City of Ottawa Open Data Licence v2.0 (https://open.ottawa.ca/pages/open-data-licence) · status `open-recorded`, licence text read 2026-11-16. OGL-style municipal licence; hub item licence shows 'custom'. Confirm text before import.
- **Count:** 11,391 records (counted, 2026-11-15). Method: ArcGIS returnCountOnly on every Parks_Inventory layer that has an ACCESSIBLE field (26 layers = 11,800), minus layer 14 Parking (409, assigned to H5).
- **Breakdown:** layers_total_with_access_field: 11,800; non_null_ACCESSIBLE_all_layers: 9,922; benches: 3,318; play_structures: 1,719; parks_and_greenspace: 1,378; dogs_in_parks: 1,092; pathway_links: 609; sports_fields: 526; basketball: 308; ball_diamonds: 281; outdoor_rinks: 270; splash_pads: 161
- **Accessibility fields:** ACCESSIBLE (city's own value; mapped verbatim to yes/no only when the value is an explicit yes/no; anything else UNKNOWN), names in EN and FR
- **Place schema mapping:** source → Provenance.sourceName = "City of Ottawa: Parks inventory layers with a bilingual ACCESSIBLE field (benches, play structures, sports fields, rinks, splash pads, parks and greenspace and more)"; sourceId = "ottawa-parks-inventory" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of Ottawa Open Data Licence v2.0"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import status (2026-11-16):** Imported in part on 2026-11-16 as access-maps source ottawa-parks-inventory: 7,916 venue records from 20 point layers, tier 0, with the City ACCESSIBLE flag stored as published. Layers 5, 7, 8, 23 and 24 were not imported. access-maps pull request #48 (branch claude/real-data-imports).
- **Import plan:** Lane H3: page each layer with resultOffset/resultRecordCount (2,000) and outSR=4326; keep EN and FR names; ACCESSIBLE stays raw and maps only exact yes/no values.

### Pedestrian network (Pedestrian Plan)

- **ID:** `ottawa-pedestrian-network` · **Publisher:** City of Ottawa · **URL:** https://maps.ottawa.ca/arcgis/rest/services/Pedestrian_Plan/MapServer/0
- **Licence:** City of Ottawa Open Data Licence v2.0 (https://open.ottawa.ca/pages/open-data-licence) · status `open-recorded`, licence text read 2026-11-16. OGL-style municipal licence; hub item licence shows 'custom'. Confirm text before import.
- **Count:** 20,298 records (counted, 2026-11-15). Method: ArcGIS returnCountOnly
- **Accessibility fields:** WALK_TYPE, TYPE_EN/TYPE_FR (no width or slope)
- **Place schema mapping:** source → Provenance.sourceName = "City of Ottawa: Pedestrian network (Pedestrian Plan)"; sourceId = "ottawa-pedestrian-network" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of Ottawa Open Data Licence v2.0"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import status (2026-11-16):** Licence read on 2026-11-16. Not imported: the layer has no surface, width, slope or curb column and was not mapped. Listed in access-maps sources/gaps.json.
- **Import plan:** Lane H4: paged ArcGIS query, chunked NDJSON output.

### City-owned parking facilities (Accessible space count)

- **ID:** `mississauga-parking-facilities` · **Publisher:** City of Mississauga · **URL:** https://services6.arcgis.com/hM5ymMLbxIyWTjn2/arcgis/rest/services/City_Owned_Parkng_Facilities/FeatureServer/0
- **Licence:** City of Mississauga Open Data Terms of Use (https://data.mississauga.ca/) · status `verify`. access-maps #1 holds MiWay under these terms as not a plain open grant.
- **Count:** 282 records (counted, 2026-11-15). Method: ArcGIS returnCountOnly
- **Accessibility fields:** Accessible (count of accessible spaces per city)
- **Place schema mapping:** source → Provenance.sourceName = "City of Mississauga: City-owned parking facilities (Accessible space count)"; sourceId = "mississauga-parking-facilities" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of Mississauga Open Data Terms of Use"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H5, held output until licence confirmed.

### City public washrooms

- **ID:** `mississauga-washrooms` · **Publisher:** City of Mississauga · **URL:** https://services6.arcgis.com/hM5ymMLbxIyWTjn2/arcgis/rest/services/City_Public_Washrooms/FeatureServer/1
- **Licence:** City of Mississauga Open Data Terms of Use (https://data.mississauga.ca/) · status `verify`. access-maps #1 holds MiWay under these terms as not a plain open grant.
- **Count:** 48 records (counted, 2026-11-15). Method: ArcGIS returnCountOnly
- **Accessibility fields:** None (location only; accessibility UNKNOWN)
- **Place schema mapping:** source → Provenance.sourceName = "City of Mississauga: City public washrooms"; sourceId = "mississauga-washrooms" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of Mississauga Open Data Terms of Use"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Deferred: licence held; washroom import lives in access-maps.

### Sidewalk segments

- **ID:** `brampton-sidewalks` · **Publisher:** City of Brampton · **URL:** https://services3.arcgis.com/rl7ACuZkiFsmDA2g/arcgis/rest/services/Sidewalks/FeatureServer/0
- **Licence:** Creative Commons Attribution 4.0 (per Brampton GeoHub item) (https://creativecommons.org/licenses/by/4.0/) · status `open`
- **Count:** 429,007 records (counted, 2026-11-15). Method: ArcGIS returnCountOnly
- **Accessibility fields:** DESCR only (no width, slope or curb cut); all accessibility UNKNOWN
- **Place schema mapping:** source → Provenance.sourceName = "City of Brampton: Sidewalk segments"; sourceId = "brampton-sidewalks" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Creative Commons Attribution 4.0 (per Brampton GeoHub item)"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H4: paged query, chunked NDJSON; largest single municipal source.

### Parks

- **ID:** `brampton-parks` · **Publisher:** City of Brampton · **URL:** https://services3.arcgis.com/rl7ACuZkiFsmDA2g/arcgis/rest/services/Planning_Parks/FeatureServer/1
- **Licence:** Creative Commons Attribution 4.0 (per Brampton GeoHub item) (https://creativecommons.org/licenses/by/4.0/) · status `open`
- **Count:** 869 records (counted, 2026-11-15). Method: ArcGIS returnCountOnly
- **Accessibility fields:** ACCESS_POINTS (count of access points, not wheelchair access)
- **Place schema mapping:** source → Provenance.sourceName = "City of Brampton: Parks"; sourceId = "brampton-parks" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Creative Commons Attribution 4.0 (per Brampton GeoHub item)"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Deferred to a later parks lane.

### Sidewalks (Width, Material)

- **ID:** `london-sidewalks` · **Publisher:** City of London · **URL:** https://maps.london.ca/server/rest/services/OpenData/OpenData_Transportation/MapServer/4
- **Licence:** City of London Open Data licence (https://opendata.london.ca/) · status `verify`
- **Count:** 11,196 records (counted, 2026-11-15). Method: ArcGIS returnCountOnly
- **Accessibility fields:** Width, Material
- **Place schema mapping:** source → Provenance.sourceName = "City of London: Sidewalks (Width, Material)"; sourceId = "london-sidewalks" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of London Open Data licence"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H4.

### Walkways

- **ID:** `london-walkways` · **Publisher:** City of London · **URL:** https://maps.london.ca/server/rest/services/OpenData/OpenData_Transportation/MapServer/6
- **Licence:** City of London Open Data licence (https://opendata.london.ca/) · status `verify`
- **Count:** 465 records (counted, 2026-11-15). Method: ArcGIS returnCountOnly
- **Accessibility fields:** None
- **Place schema mapping:** source → Provenance.sourceName = "City of London: Walkways"; sourceId = "london-walkways" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of London Open Data licence"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H4.

### Parking inventory (CountDisabledSpaces)

- **ID:** `london-parking` · **Publisher:** City of London · **URL:** https://maps.london.ca/server/rest/services/OpenData/OpenData_Transportation/MapServer/1
- **Licence:** City of London Open Data licence (https://opendata.london.ca/) · status `verify`
- **Count:** 170 records (counted, 2026-11-15). Method: ArcGIS returnCountOnly
- **Accessibility fields:** CountDisabledSpaces
- **Place schema mapping:** source → Provenance.sourceName = "City of London: Parking inventory (CountDisabledSpaces)"; sourceId = "london-parking" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of London Open Data licence"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H5.

### Signalized intersections

- **ID:** `london-signals` · **Publisher:** City of London · **URL:** https://maps.london.ca/server/rest/services/OpenData/OpenData_Transportation/MapServer/14
- **Licence:** City of London Open Data licence (https://opendata.london.ca/) · status `verify`
- **Count:** 448 records (counted, 2026-11-15). Method: ArcGIS returnCountOnly
- **Accessibility fields:** None (no APS field)
- **Place schema mapping:** source → Provenance.sourceName = "City of London: Signalized intersections"; sourceId = "london-signals" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of London Open Data licence"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Deferred.

### Parks

- **ID:** `london-parks` · **Publisher:** City of London · **URL:** https://maps.london.ca/server/rest/services/OpenData/OpenData_Recreation/MapServer/3
- **Licence:** City of London Open Data licence (https://opendata.london.ca/) · status `verify`
- **Count:** 609 records (counted, 2026-11-15). Method: ArcGIS returnCountOnly
- **Accessibility fields:** Facility counts only
- **Place schema mapping:** source → Provenance.sourceName = "City of London: Parks"; sourceId = "london-parks" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of London Open Data licence"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Deferred.

### Kitchener sidewalks and active-transport segments (WIDTH_M, GRADE, CURBCUT, SURFACE_CONDITION)

- **ID:** `kitchener-sidewalks` · **Publisher:** City of Kitchener · **URL:** https://services1.arcgis.com/qAo1OsXi67t7XgmS/arcgis/rest/services/Sidewalks/FeatureServer/0
- **Licence:** City of Kitchener Open Data licence (https://open-kitchenergis.opendata.arcgis.com/) · status `verify`
- **Count:** 17,111 records (counted, 2026-11-15). Method: ArcGIS returnCountOnly
- **Accessibility fields:** WIDTH_M, GRADE, CURBCUT, RAILING, SURFACE_MATERIAL, SURFACE_CONDITION
- **Place schema mapping:** source → Provenance.sourceName = "City of Kitchener: Kitchener sidewalks and active-transport segments (WIDTH_M, GRADE, CURBCUT, SURFACE_CONDITION)"; sourceId = "kitchener-sidewalks" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of Kitchener Open Data licence"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H4: the richest sidewalk attributes found; sourceDate from CONDITION_DATE where present.

### City of Waterloo sidewalks

- **ID:** `waterloo-sidewalks` · **Publisher:** City of Waterloo · **URL:** https://services.arcgis.com/ZpeBVw5o1kjit7LT/arcgis/rest/services/Sidewalks/FeatureServer/0
- **Licence:** City of Waterloo Open Data licence (https://data.waterloo.ca/) · status `verify`
- **Count:** 5,262 records (counted, 2026-11-15). Method: ArcGIS returnCountOnly
- **Accessibility fields:** SURFACE, PATH_TYPE, CLEARED_BY
- **Place schema mapping:** source → Provenance.sourceName = "City of Waterloo: City of Waterloo sidewalks"; sourceId = "waterloo-sidewalks" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of Waterloo Open Data licence"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H4.

### City of Waterloo city-operated parking lots (ACCESSIBLE)

- **ID:** `waterloo-parking-lots` · **Publisher:** City of Waterloo · **URL:** https://services.arcgis.com/ZpeBVw5o1kjit7LT/arcgis/rest/services/ParkingLots/FeatureServer/0
- **Licence:** City of Waterloo Open Data licence (https://data.waterloo.ca/) · status `verify`
- **Count:** 31 records (counted, 2026-11-15). Method: ArcGIS returnCountOnly
- **Accessibility fields:** ACCESSIBLE
- **Place schema mapping:** source → Provenance.sourceName = "City of Waterloo: City of Waterloo city-operated parking lots (ACCESSIBLE)"; sourceId = "waterloo-parking-lots" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of Waterloo Open Data licence"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane H5.

### Parks inventory: parking (ACCESSIBLE_PARKING_CAPACITY)

- **ID:** `ottawa-parks-parking` · **Publisher:** City of Ottawa · **URL:** https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer/14
- **Licence:** City of Ottawa Open Data Licence v2.0 (https://open.ottawa.ca/pages/open-data-licence) · status `open-recorded`, licence text read 2026-11-16. OGL-style municipal licence; hub item licence shows 'custom'. Confirm text before import.
- **Count:** 409 records (counted, 2026-11-15). Method: ArcGIS returnCountOnly (all 409 have a non-null ACCESSIBLE value)
- **Accessibility fields:** ACCESSIBLE_PARKING_CAPACITY, ACCESSIBLE
- **Place schema mapping:** source → Provenance.sourceName = "City of Ottawa: Parks inventory: parking (ACCESSIBLE_PARKING_CAPACITY)"; sourceId = "ottawa-parks-parking" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "City of Ottawa Open Data Licence v2.0"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import status (2026-11-16):** Imported on 2026-11-16 as access-maps source ottawa-park-parking: 408 venue records, tier 0, ACCESSIBLE_PARKING_CAPACITY stored as capacity_disabled. One row has no usable coordinate. access-maps pull request #48 (branch claude/real-data-imports).
- **Import plan:** Lane H5.

### Hamilton, York Region, Vaughan, Durham hubs

- **ID:** `hamilton-york-other-hubs` · **Publisher:** Various · **URL:** https://open.hamilton.ca/
- **Licence:** Not checked · status `unknown`
- **Count:** — records (not-counted, 2026-11-15). Method: Not counted: Hamilton and Vaughan hub search APIs errored from the box; York Region and Durham searches returned no accessibility layers.
- **Accessibility fields:** Unknown
- **Place schema mapping:** source → Provenance.sourceName = "Various: Hamilton, York Region, Vaughan, Durham hubs"; sourceId = "hamilton-york-other-hubs" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Not checked"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Follow-up survey.

### Ministry of Health service provider locations (MOHSERLO)

- **ID:** `ontario-moh-service-locations` · **Publisher:** Government of Ontario · **URL:** https://data.ontario.ca/dataset/ministry-of-health-service-provider-locations-mohserlo
- **Licence:** Open Government Licence – Ontario (https://www.ontario.ca/page/open-government-licence-ontario) · status `open`
- **Count:** 11,625 records (counted, 2026-11-15). Method: ArcGIS returnCountOnly on LIO_Open09/MapServer/26
- **Accessibility fields:** None (names EN/FR, address, service type). Accessibility UNKNOWN.
- **Place schema mapping:** source → Provenance.sourceName = "Government of Ontario: Ministry of Health service provider locations (MOHSERLO)"; sourceId = "ontario-moh-service-locations" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Government Licence – Ontario"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Deferred: directory-only use needs a clinical-boundary review first (no medical advice).

### Approved functional assessment centres for drivers

- **ID:** `ontario-functional-assessment-centres` · **Publisher:** Government of Ontario · **URL:** https://data.ontario.ca/dataset/approved-functional-assessment-centres-for-drivers
- **Licence:** Open Government Licence – Ontario (https://www.ontario.ca/page/open-government-licence-ontario) · status `open`
- **Count:** 46 records (counted, 2026-11-15). Method: CKAN datastore_search total (EN resource)
- **Accessibility fields:** 'Services available in French' only
- **Place schema mapping:** source → Provenance.sourceName = "Government of Ontario: Approved functional assessment centres for drivers"; sourceId = "ontario-functional-assessment-centres" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Government Licence – Ontario"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Deferred: directory link only, belongs with the navigator package.

### Catalogue search for accessibility place data

- **ID:** `ontario-catalogue-accessibility-search` · **Publisher:** Government of Ontario · **URL:** https://data.ontario.ca/
- **Licence:** Open Government Licence – Ontario (https://www.ontario.ca/page/open-government-licence-ontario) · status `open`
- **Count:** — records (not-counted, 2026-11-15). Method: CKAN package_search 'accessibility' returned 301 datasets; none found is a place-level accessibility layer (grant recipients, compliance reports, complaints). MTO picnic parks is already in access-maps #1.
- **Accessibility fields:** n/a
- **Place schema mapping:** source → Provenance.sourceName = "Government of Ontario: Catalogue search for accessibility place data"; sourceId = "ontario-catalogue-accessibility-search" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Government Licence – Ontario"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Already covered by:** access-maps #1 (mto-picnic-parks)
- **Import plan:** None.

### Total Accessibility Score of PSPC owned and lease-purchased buildings (CSA B651-18)

- **ID:** `pspc-building-accessibility` · **Publisher:** Public Services and Procurement Canada · **URL:** https://open.canada.ca/data/en/dataset/aaf6462d-eab9-4165-9329-24095451121d
- **Licence:** Open Government Licence – Canada 2.0 (https://open.canada.ca/en/open-government-licence-canada) · status `open`
- **Count:** 71 records (counted, 2026-11-15). Method: Downloaded the 72,924-byte CSV and counted rows with Province-code ON (205 rows Canada-wide).
- **Breakdown:** canada_rows: 205; ontario_rows: 71
- **Accessibility fields:** Accessibility-score (0–100 against CSA B651-18), Compliance-standard-applied, Assessment fiscal year; names and addresses EN and FR
- **Place schema mapping:** source → Provenance.sourceName = "Public Services and Procurement Canada: Total Accessibility Score of PSPC owned and lease-purchased buildings (CSA B651-18)"; sourceId = "pspc-building-accessibility" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Government Licence – Canada 2.0"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane D1: score is stored as the publisher's building-level score with its standard and fiscal year; never turned into step-free or washroom facts.

### Canadian Survey on Disability 2022 tables 13-10-0374, 13-10-0376, 13-10-0377, 13-10-0750

- **ID:** `statcan-csd-2022` · **Publisher:** Statistics Canada · **URL:** https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1310037401
- **Licence:** Statistics Canada Open Licence (https://www.statcan.gc.ca/en/reference/licence) · status `open`
- **Count:** 118,764 statistical datapoints (not place records) (counted, 2026-11-15). Method: WDS getCubeMetadata nbDatapointsCube per table (Canada-wide, all geographies)
- **Breakdown:** 13100374: 14,688; 13100376: 36,720; 13100377: 66,096; 13100750: 1,260
- **Accessibility fields:** Aggregates only
- **Place schema mapping:** source → Provenance.sourceName = "Statistics Canada: Canadian Survey on Disability 2022 tables 13-10-0374, 13-10-0376, 13-10-0377, 13-10-0750"; sourceId = "statcan-csd-2022" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Statistics Canada Open Licence"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Context statistics for help-centre copy; not place records. Excluded from the total.

### CMHC Housing Market Information Portal

- **ID:** `cmhc-housing` · **Publisher:** CMHC · **URL:** https://open.canada.ca/data/en/dataset/c2a1fdbf-d9b7-4c84-b7eb-c845b6ffd5e6
- **Licence:** Open Government Licence – Canada 2.0 (https://open.canada.ca/en/open-government-licence-canada) · status `open`
- **Count:** — records (not-counted, 2026-11-15). Method: Not counted: market statistics, no accessible-unit place data found.
- **Accessibility fields:** None
- **Place schema mapping:** source → Provenance.sourceName = "CMHC: CMHC Housing Market Information Portal"; sourceId = "cmhc-housing" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Government Licence – Canada 2.0"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** None.

### Accessibility Standards Canada

- **ID:** `accessibility-standards-canada` · **Publisher:** Accessibility Standards Canada · **URL:** https://open.canada.ca/data/en/dataset/15c31fd7-3bcf-40f8-bd91-af6a315a83cc
- **Licence:** Open Government Licence – Canada 2.0 (https://open.canada.ca/en/open-government-licence-canada) · status `open`
- **Count:** — records (not-counted, 2026-11-15). Method: Not counted: publishes its accessibility plan, not place data.
- **Accessibility fields:** None
- **Place schema mapping:** source → Provenance.sourceName = "Accessibility Standards Canada: Accessibility Standards Canada"; sourceId = "accessibility-standards-canada" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "Open Government Licence – Canada 2.0"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Reference only (standards text for docs).

### Wikidata items in Ontario with wheelchair accessibility (P2846)

- **ID:** `wikidata-p2846-ontario` · **Publisher:** Wikidata contributors · **URL:** https://query.wikidata.org/
- **Licence:** CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/) · status `open`
- **Count:** 276 records (counted, 2026-11-15). Method: SPARQL: items with wdt:P2846 and wdt:P17 wd:Q16, then wdt:P131+ wd:Q1904, grouped by value.
- **Breakdown:** Q24192067_accessible: 241; Q24192069_partially: 33; Q24192068_inaccessible: 2; ontario_items_with_coordinates_any: 85,284
- **Accessibility fields:** P2846 value; qualifiers and references if present
- **Place schema mapping:** source → Provenance.sourceName = "Wikidata contributors: Wikidata items in Ontario with wheelchair accessibility (P2846)"; sourceId = "wikidata-p2846-ontario" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "CC0 1.0"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Lane D2: import a committed SPARQL JSON result; the 85,284 Ontario items with coordinates are context and not imported (no accessibility statement).

### Overture Maps places theme

- **ID:** `overture-places` · **Publisher:** Overture Maps Foundation · **URL:** https://docs.overturemaps.org/attribution/
- **Licence:** CDLA Permissive 2.0 (places theme) (https://cdla.dev/permissive-2-0/) · status `excluded`
- **Count:** — records (not-counted, 2026-11-15). Method: Not counted: licence is outside the allowed list (ODbL, OGL-Ontario, OGL-Canada, CC-BY, CC0) and the places theme has no accessibility attributes.
- **Accessibility fields:** None
- **Place schema mapping:** source → Provenance.sourceName = "Overture Maps Foundation: Overture Maps places theme"; sourceId = "overture-places" plus the upstream feature id; sourceUrl = dataset URL; licence → Provenance.licence = "CDLA Permissive 2.0 (places theme)"; retrievedOn → Provenance.retrievedAt = run date (YYYY-MM-DD); sourceDate = upstream last-modified date, or UNKNOWN-dated run date with a note if the source gives none; tier → Provenance.tier = 0, prototypeLabel = SEEDED-OPEN-DATA, verifierType = open-data-import. Never 2, 3 or 4 from an import.
- **Import plan:** Excluded until a licence decision is recorded.

## Import lanes

Each lane builds one streaming importer and validator as its own workspace package, `packages/importer-<source>`, with tests on fixtures of a few KB. The root Vitest and TypeScript globs only reach `packages/*`, so a nested `packages/importers/<source>` folder would not be tested by CI. G8 (`packages/place-import`) has no open pull request yet, so the importers emit `Sourced<T>` / `Provenance` from `@access-tools/place` directly and can adopt G8's interface later.

- **D1:** `packages/importer-pspc` — federal building accessibility scores (Ontario rows), OGL-Canada. Counted records in scope: 71.
- **D2:** `packages/importer-wikidata` — Wikidata P2846 items in Ontario, CC0. Counted records in scope: 276.
- **H1:** `packages/importer-gtfs-stops` — GTFS stops for the 13 Ontario feeds not in access-maps #1. Counted records in scope: 20,144.
- **H2:** `packages/importer-toronto` — Toronto APS signals, pedestrian crossovers, POPS, parks and recreation facilities. Counted records in scope: 5,168.
- **H3:** `packages/importer-ottawa-parks` — Ottawa parks inventory layers with the ACCESSIBLE field. Counted records in scope: 11,391.
- **H4:** `packages/importer-sidewalks` — sidewalk and pedestrian-network segments from Toronto, Ottawa, Brampton, London, Kitchener and Waterloo. Counted records in scope: 584,560.
- **H5:** `packages/importer-parking` — accessible parking counts from Toronto, Mississauga, London, Waterloo and Ottawa parks. Counted records in scope: 1,561.
