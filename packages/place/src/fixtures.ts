import { blankBay, blankEntrance, blankInterior, blankParking, blankTransport, blankWashroom, unknown } from "./blank.js";
import type { ChargingPoint, HoursWindow, PlacePack, PlaceRecord, Provenance, Repairer, Sourced, SupplyStore } from "./types.js";

/**
 * Labelled fixtures for tests and demos.
 * Every place name starts with "Fixture" or "Skeleton seed".
 * No real venue is described. Numbers are authored for the interface.
 * Real records come from access-maps.
 */

export const FIXTURE_DAY = "2026-11-13";

export const FIXTURE_PROVENANCE: Provenance = {
  sourceName: "access-tools labelled fixture",
  sourceId: "access-tools-labelled-fixture",
  licence: "Labelled fixture. Not a data licence. Not a real-world observation.",
  sourceDate: FIXTURE_DAY,
  recordDate: FIXTURE_DAY,
  retrievedAt: FIXTURE_DAY,
  tier: 1,
  prototypeLabel: "PROTOTYPE-UNVERIFIED",
  verifierType: "fixture-author",
};

const SEED_PROVENANCE: Provenance = {
  sourceName: "access-tools skeleton seed",
  sourceId: "access-tools-skeleton-seed",
  licence: "Skeleton seed. Not a data licence. No venue is identified.",
  sourceDate: FIXTURE_DAY,
  recordDate: FIXTURE_DAY,
  retrievedAt: FIXTURE_DAY,
  tier: 1,
  prototypeLabel: "PROTOTYPE-UNVERIFIED",
  verifierType: "fixture-author",
};

function f<T>(value: T, photos: string[] = []): Sourced<T> {
  return { value, provenance: FIXTURE_PROVENANCE, photoSlotIds: photos };
}

const WEEKDAY: HoursWindow[] = [1, 2, 3, 4, 5].map((day) => ({
  day: day as HoursWindow["day"],
  open: "09:00",
  close: "17:00",
}));

function shell(input: Pick<PlaceRecord, "id" | "honestyNote" | "honestyNoteFr" | "identity"> & Partial<PlaceRecord>): PlaceRecord {
  return {
    datasetStatus: "labelled-fixture",
    publicationContext: "prototype",
    depth: "bounded-seed",
    nameFr: null,
    recordProvenance: FIXTURE_PROVENANCE,
    entrance: blankEntrance(),
    washrooms: [],
    interior: blankInterior(),
    parking: blankParking(),
    chargingPoints: [],
    linkedRepairerIds: [],
    linkedSupplyStoreIds: [],
    transport: blankTransport(),
    photos: [],
    peerTips: [],
    trail: null,
    ...input,
  };
}

const communityWashroomMeasured = blankWashroom("fix-cc-wash-1", "Fixture washroom A");
communityWashroomMeasured.gender = "all-gender";
communityWashroomMeasured.locationAndRoute = f("Synthetic note: ground floor, past the fixture lobby. Not a real route.");
communityWashroomMeasured.doorClearWidthMm = f(860);
communityWashroomMeasured.door = f({
  operator: "automatic",
  pushPlateHeightMm: null,
  forceNote: null,
  closingSpeedNote: null,
  swing: "sliding",
  lock: "none",
});
communityWashroomMeasured.turningDiameterMm = f(1600, ["ph-turn-empty"]);
communityWashroomMeasured.transfer = f({ side: "left", clearFloorBesideMm: 900 });
communityWashroomMeasured.seatHeightMm = f(430);
communityWashroomMeasured.grabBars = f({
  configuration: "Fixture text: bars recorded on the left. Not a real room.",
  side: "left",
  heightMm: null,
  lengthMm: null,
  sturdinessNote: null,
});
communityWashroomMeasured.changeTable = f({
  present: "no",
  lengthMm: null,
  widthMm: null,
  heightRange: null,
  loadKg: null,
  productLabel: null,
});
communityWashroomMeasured.hoist = f({
  present: "no",
  type: null,
  working: null,
  slingPolicy: null,
  slingProvided: null,
  operatorAvailability: null,
  weightCapacityKg: null,
});
communityWashroomMeasured.accessPolicy = f({ method: "open", howToObtain: null, phone: null });
communityWashroomMeasured.hoursReliability = f({
  hoursText: "Fixture hours: weekdays 09:00–17:00.",
  outOfOrderNote: null,
  lastReportNote: null,
});
communityWashroomMeasured.hours = WEEKDAY;

const hoistWashroom = blankWashroom("fix-hoist-wash", "Fixture change and hoist room");
hoistWashroom.gender = "family";
hoistWashroom.attendantAccessNote =
  "Fixture note: recorded as a family room. Whether an attendant can enter is Unknown.";
hoistWashroom.locationAndRoute = f("Synthetic note: family room off the fixture corridor.");
hoistWashroom.doorClearWidthMm = f(920);
hoistWashroom.turningDiameterMm = f(1800);
hoistWashroom.transfer = f({ side: "both", clearFloorBesideMm: null });
hoistWashroom.changeTable = f({
  present: "yes",
  lengthMm: 1800,
  widthMm: 800,
  heightRange: "450–1000 mm, fixture figure",
  loadKg: 180,
  productLabel: "Fixture product label, not a real product",
});
hoistWashroom.hoist = f({
  present: "yes",
  type: "Ceiling track, fixture text",
  working: null,
  slingPolicy: "Fixture policy text: a sling is not provided.",
  slingProvided: "no",
  operatorAvailability: null,
  weightCapacityKg: null,
});
hoistWashroom.accessPolicy = f({
  method: "staff-assisted",
  howToObtain: "Fixture note: ask at the synthetic desk.",
  phone: "555-0102",
});
hoistWashroom.hoursReliability = f({
  hoursText: "Fixture hours follow the building, weekdays 09:00–17:00.",
  outOfOrderNote: null,
  lastReportNote: null,
});
hoistWashroom.hours = WEEKDAY;

const libraryCharging: ChargingPoint = {
  id: "fix-library-charge",
  name: "Fixture library outlet",
  locationNote: f("Synthetic note: inside the fixture lobby, on the left wall."),
  outletType: f("Household 120 V, fixture text"),
  outletCount: f(2),
  accessMethod: f("open"),
  permissionContact: unknown(),
  seating: f("yes"),
  setting: f("indoor"),
  hoursText: f("Fixture hours: weekdays 09:00–17:00."),
  hours: WEEKDAY,
  cost: f("Fixture note: no fee recorded in this synthetic record."),
  stepFreeRoute: unknown(),
};

const communityCharging: ChargingPoint = {
  id: "fix-cc-charge",
  name: "Fixture centre outlet",
  locationNote: f("Synthetic note: beside the fixture seating."),
  outletType: f("Household 120 V, fixture text"),
  outletCount: f(1),
  accessMethod: f("permission"),
  permissionContact: f("555-0101"),
  seating: f("yes"),
  setting: f("indoor"),
  hoursText: unknown(),
  hours: null,
  cost: unknown(),
  stepFreeRoute: unknown(),
};

const typeA = blankBay("fix-cc-bay-a", "Fixture bay A", "type-a-van");
typeA.widthMm = f(3400);
typeA.aisleWidthMm = f(2000);
typeA.aisleSide = f("left");
typeA.distanceToEntranceM = f(40);
typeA.surface = f("Fixture surface text: paved.");

const typeB = blankBay("fix-cc-bay-b", "Fixture bay B", "type-b-standard");
typeB.widthMm = f(2400);
typeB.distanceToEntranceM = f(55);

const lotBay = blankBay("fix-lot-bay", "Fixture lot bay", "type-b-standard");
lotBay.widthMm = f(2400);

const communityEntrance = blankEntrance();
communityEntrance.stepCount = f(0);
communityEntrance.stepHeightMm = f(0);
communityEntrance.thresholdHeightMm = f(12);
communityEntrance.rampPresent = f("no");
communityEntrance.stepFree = f("yes");
communityEntrance.namedLocation = f("Fixture side door");
communityEntrance.streetDirections = f(
  "Synthetic directions: on Fixture Lane, the side door is on the north face of this made-up building.",
);
communityEntrance.doorClearWidthMm = f(860, ["ph-door"]);
communityEntrance.doorOperation = f({
  operator: "automatic",
  pushPlateHeightMm: 900,
  forceNote: null,
  closingSpeedNote: null,
  swing: "sliding",
  lock: "none",
});

const communityParking = blankParking();
communityParking.bays = [typeA, typeB];
communityParking.payment = f("Fixture note: payment method not recorded beyond this sentence.");

const places: PlaceRecord[] = [
  shell({
    id: "fix-community-centre",
    honestyNote:
      "Labelled fixture. Not a real place. Values are synthetic and unverified. Real records come from access-maps.",
    honestyNoteFr:
      "Jeu d'essai étiqueté. Pas un lieu réel. Les valeurs sont synthétiques et non vérifiées. Les fiches réelles viennent d'access-maps.",
    nameFr: "Centre communautaire (jeu d'essai)",
    identity: {
      name: "Fixture: Synthetic Community Centre",
      placeType: "complex-venue",
      category: "community-centre",
      address: "1 Fixture Lane (not a real address)",
      municipality: "Toronto",
      province: "ON",
      latitude: 43.7,
      longitude: -79.4,
      coordinateNote: "Synthetic test point for distance sorting. Not a surveyed entrance.",
      phone: "555-0100",
      hoursText: "Fixture hours: weekdays 09:00–17:00.",
      hours: WEEKDAY,
      languagesOfService: ["en", "fr"],
      accessibilityStatementUrl: null,
    },
    entrance: communityEntrance,
    washrooms: [communityWashroomMeasured, blankWashroom("fix-cc-wash-2", "Fixture washroom B, nothing measured")],
    parking: communityParking,
    chargingPoints: [communityCharging],
    linkedRepairerIds: ["fix-repairer"],
    linkedSupplyStoreIds: ["fix-pharmacy"],
    photos: [
      {
        id: "ph-door",
        fieldId: "entrance.door-clear-width-mm",
        description: "Synthetic description of a doorway for the fixture. Not a photograph of a real entrance.",
        capturedOn: FIXTURE_DAY,
        tier: 1,
        status: "described",
      },
      {
        id: "ph-turn-empty",
        fieldId: "washroom.turning-diameter-mm",
        description: null,
        capturedOn: null,
        tier: null,
        status: "empty",
      },
    ],
    peerTips: [
      {
        id: "tip-1",
        body: "Fixture peer tip, not a fact: the synthetic note says the side door is the one this record describes.",
        role: "peer",
        date: FIXTURE_DAY,
        moderated: false,
      },
    ],
  }),
  shell({
    id: "fix-cafe",
    honestyNote: "Labelled fixture. Not a real place. Almost every access field is unknown on purpose.",
    honestyNoteFr: "Jeu d'essai étiqueté. Pas un lieu réel. Presque tous les champs d'accès sont inconnus, volontairement.",
    nameFr: "Café (jeu d'essai)",
    identity: {
      name: "Fixture: Synthetic Café",
      placeType: "simple-venue",
      category: "cafe",
      address: "2 Fixture Lane (not a real address)",
      municipality: "Toronto",
      province: "ON",
      latitude: 43.701,
      longitude: -79.401,
      coordinateNote: "Synthetic test point. Not a surveyed entrance.",
      phone: null,
      hoursText: null,
      hours: null,
      languagesOfService: null,
      accessibilityStatementUrl: null,
    },
  }),
  shell({
    id: "fix-change-hoist",
    honestyNote: "Labelled fixture. Not a real place. Change-table and hoist figures are synthetic.",
    honestyNoteFr: "Jeu d'essai étiqueté. Pas un lieu réel. Les chiffres de la table de change et du lève-personne sont synthétiques.",
    nameFr: "Salle de change (jeu d'essai)",
    identity: {
      name: "Fixture: Change Table and Hoist Room",
      placeType: "complex-venue",
      category: "community-centre",
      address: "3 Fixture Lane (not a real address)",
      municipality: "Toronto",
      province: "ON",
      latitude: 43.71,
      longitude: -79.41,
      coordinateNote: "Synthetic test point. Not a surveyed entrance.",
      phone: "555-0102",
      hoursText: "Fixture hours: weekdays 09:00–17:00.",
      hours: WEEKDAY,
      languagesOfService: ["en"],
      accessibilityStatementUrl: null,
    },
    washrooms: [hoistWashroom],
  }),
  shell({
    id: "fix-parking-lot",
    honestyNote: "Labelled fixture. Not a real parking lot. Bay figures are synthetic.",
    honestyNoteFr: "Jeu d'essai étiqueté. Pas un stationnement réel. Les chiffres des places sont synthétiques.",
    identity: {
      name: "Fixture: Synthetic Parking Lot",
      placeType: "parking-lot",
      category: "parking",
      address: "4 Fixture Lane (not a real address)",
      municipality: "Toronto",
      province: "ON",
      latitude: 43.69,
      longitude: -79.42,
      coordinateNote: "Synthetic test point. Not a surveyed bay.",
      phone: "555-0103",
      hoursText: null,
      hours: null,
      languagesOfService: null,
      accessibilityStatementUrl: null,
    },
    parking: {
      ...blankParking(),
      bays: [lotBay],
      payment: f("Fixture note: recorded as app-only, with no cash or card in this synthetic lot."),
    },
  }),
  shell({
    id: "fix-library-charging",
    honestyNote: "Labelled fixture. Not a real library. The outlet record is synthetic.",
    honestyNoteFr: "Jeu d'essai étiqueté. Pas une bibliothèque réelle. La fiche de prise est synthétique.",
    nameFr: "Bibliothèque (jeu d'essai)",
    identity: {
      name: "Fixture: Synthetic Library",
      placeType: "simple-venue",
      category: "library",
      address: "5 Fixture Lane (not a real address)",
      municipality: "Toronto",
      province: "ON",
      latitude: 43.72,
      longitude: -79.39,
      coordinateNote: "Synthetic test point. Not a surveyed outlet.",
      phone: "555-0104",
      hoursText: "Fixture hours: weekdays 09:00–17:00.",
      hours: WEEKDAY,
      languagesOfService: ["en", "fr"],
      accessibilityStatementUrl: null,
    },
    chargingPoints: [libraryCharging],
  }),
  shell({
    id: "fix-repair-shop",
    honestyNote: "Labelled fixture. Not a real business. The service list is the published list in this fixture and nothing more.",
    honestyNoteFr:
      "Jeu d'essai étiqueté. Pas un commerce réel. La liste de services est seulement la liste publiée dans ce jeu d'essai.",
    identity: {
      name: "Fixture: Repair Bench Premises",
      placeType: "simple-venue",
      category: "repair",
      address: "6 Fixture Lane (not a real address)",
      municipality: "Toronto",
      province: "ON",
      latitude: 43.68,
      longitude: -79.38,
      coordinateNote: "Synthetic test point. Not a surveyed door.",
      phone: "555-0105",
      hoursText: "Fixture hours: weekdays 09:00–17:00.",
      hours: WEEKDAY,
      languagesOfService: null,
      accessibilityStatementUrl: null,
    },
    linkedRepairerIds: ["fix-repairer"],
  }),
  shell({
    id: "fix-trailhead",
    honestyNote: "Labelled fixture. Not a real trail. Trail fields are present and unknown.",
    honestyNoteFr: "Jeu d'essai étiqueté. Pas un sentier réel. Les champs de sentier sont présents et inconnus.",
    identity: {
      name: "Fixture: Synthetic Trailhead",
      placeType: "trailhead",
      category: "trail",
      address: null,
      municipality: "Toronto",
      province: "ON",
      latitude: null,
      longitude: null,
      coordinateNote: null,
      phone: null,
      hoursText: null,
      hours: null,
      languagesOfService: null,
      accessibilityStatementUrl: null,
    },
    trail: {
      surface: unknown(),
      grade: unknown(),
      widthMm: unknown(),
      obstacles: unknown(),
      rest: unknown(),
    },
  }),
  shell({
    id: "skel-thunder-bay",
    datasetStatus: "prototype-seed",
    depth: "skeleton",
    honestyNote: "Skeleton seed for Thunder Bay. No venue is identified. This seed is not a real place.",
    honestyNoteFr: "Graine squelette pour Thunder Bay. Aucun lieu n'est identifié. Cette graine n'est pas un lieu réel.",
    recordProvenance: SEED_PROVENANCE,
    nameFr: "Graine incomplète — Thunder Bay",
    identity: {
      name: "Skeleton seed — Thunder Bay",
      placeType: "skeleton",
      category: "not-seeded",
      address: null,
      municipality: "Thunder Bay",
      province: "ON",
      latitude: null,
      longitude: null,
      coordinateNote: null,
      phone: null,
      hoursText: null,
      hours: null,
      languagesOfService: null,
      accessibilityStatementUrl: null,
    },
  }),
  shell({
    id: "skel-ottawa",
    datasetStatus: "prototype-seed",
    depth: "skeleton",
    honestyNote: "Skeleton seed for Ottawa. No venue is identified. This seed is not a real place.",
    honestyNoteFr: "Graine squelette pour Ottawa. Aucun lieu n'est identifié. Cette graine n'est pas un lieu réel.",
    recordProvenance: SEED_PROVENANCE,
    nameFr: "Graine incomplète — Ottawa",
    identity: {
      name: "Skeleton seed — Ottawa",
      placeType: "skeleton",
      category: "not-seeded",
      address: null,
      municipality: "Ottawa",
      province: "ON",
      latitude: null,
      longitude: null,
      coordinateNote: null,
      phone: null,
      hoursText: null,
      hours: null,
      languagesOfService: null,
      accessibilityStatementUrl: null,
    },
  }),
];

const repairers: Repairer[] = [
  {
    id: "fix-repairer",
    name: "Fixture Repair Bench",
    nameFr: "Établi de réparation (jeu d'essai)",
    datasetStatus: "labelled-fixture",
    publicationContext: "prototype",
    honestyNote: "Labelled fixture. Not a real repairer. Services are only the list below.",
    honestyNoteFr: "Jeu d'essai étiqueté. Pas un réparateur réel. Les services sont seulement la liste ci-dessous.",
    servicesPublished: ["tyre", "caster", "mobile"],
    coverageNote: "Synthetic coverage note: 15 km around the fixture point. Not a real service area.",
    mobileRadiusKm: 15,
    hoursText: "Fixture hours: weekdays 09:00–17:00. Closed Saturday and Sunday in this fixture.",
    hours: WEEKDAY,
    phone: "555-0105",
    website: "https://example.com/fixture-repair",
    latitude: 43.68,
    longitude: -79.38,
    coordinateNote: "Synthetic test point. Not a surveyed shop.",
    premisesPlaceId: "fix-repair-shop",
    provenance: FIXTURE_PROVENANCE,
  },
];

const supplyStores: SupplyStore[] = [
  {
    id: "fix-pharmacy",
    name: "Fixture Pharmacy Counter",
    nameFr: "Comptoir de pharmacie (jeu d'essai)",
    datasetStatus: "labelled-fixture",
    publicationContext: "prototype",
    honestyNote: "Labelled fixture. Not a real pharmacy. Categories are not stock of a named product.",
    honestyNoteFr: "Jeu d'essai étiqueté. Pas une pharmacie réelle. Les catégories ne sont pas le stock d'un produit nommé.",
    storeType: "pharmacy",
    categoriesPublished: ["catheter-supplies", "continence-products"],
    hoursText: "Fixture hours: weekdays 09:00–17:00.",
    hours: WEEKDAY,
    delivery: null,
    phone: "555-0106",
    website: "https://example.com/fixture-pharmacy",
    latitude: 43.705,
    longitude: -79.39,
    coordinateNote: "Synthetic test point. Not a surveyed counter.",
    premisesPlaceId: null,
    provenance: FIXTURE_PROVENANCE,
  },
];

export const fixturePack: PlacePack = {
  id: "access-tools-labelled-fixtures",
  kind: "labelled-fixture",
  generatedOn: FIXTURE_DAY,
  notice:
    "Labelled fixtures for the interface and tests. Not real places. Not verified. Not an open-data import. Real records come from access-maps.",
  places,
  repairers,
  supplyStores,
};

export function placeById(id: string): PlaceRecord | undefined {
  return fixturePack.places.find((place) => place.id === id);
}
