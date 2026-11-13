/**
 * Place records for the App.
 * A null value is UNKNOWN. It is never a guess.
 * Every non-null fact carries provenance: source, licence, date, and tier.
 * Real records are produced by access-maps. This package ships labelled fixtures only.
 */

/** Canonical tiers from @access-main/schema. 0–4 and E. Not the old tier-N strings. */
export const VERIFICATION_TIERS = [0, 1, 2, 3, 4, "E"] as const;

export type VerificationTier = (typeof VERIFICATION_TIERS)[number];

/** Day 1 prototype labels. A prototype record may carry only the first two. */
export const PROTOTYPE_LABELS = [
  "PROTOTYPE-UNVERIFIED",
  "SEEDED-OPEN-DATA",
  "COMMUNITY-REPORTED",
  "VERIFIED",
] as const;

export type PrototypeLabel = (typeof PROTOTYPE_LABELS)[number];

export const PUBLICATION_CONTEXTS = ["prototype", "canonical"] as const;

export type PublicationContext = (typeof PUBLICATION_CONTEXTS)[number];

export const VERIFIER_ROLES = ["trained_verifier", "peer", "operator", "importer", "desk_reviewer"] as const;

export type VerifierRole = (typeof VERIFIER_ROLES)[number];

export const DATASET_STATUSES = ["labelled-fixture", "prototype-seed", "access-maps"] as const;
export type DatasetStatus = (typeof DATASET_STATUSES)[number];

export const PLACE_TYPES = [
  "simple-venue",
  "complex-venue",
  "transit-station",
  "trailhead",
  "hotel-room",
  "parking-lot",
  "skeleton",
] as const;

export type PlaceType = (typeof PLACE_TYPES)[number];

export type Lang = "en" | "fr";

export type YesNo = "yes" | "no";

/** Tier 3 and the label VERIFIED are invalid without this block. */
export interface SurveyEvidence {
  protocolVersion: string;
  verifierRole: VerifierRole;
  method: string;
  /** Visit or observation date (YYYY-MM-DD). */
  observedAt: string;
  photoIds: string[];
}

export interface Provenance {
  sourceName: string;
  sourceId: string;
  sourceUrl?: string;
  licence: string;
  /** Calendar date the source was published or the fixture was authored (YYYY-MM-DD). */
  sourceDate: string;
  /** Calendar date this field was written into the record (YYYY-MM-DD). */
  recordDate: string;
  /** Calendar date the source was retrieved (YYYY-MM-DD). */
  retrievedAt: string;
  tier: VerificationTier;
  prototypeLabel?: PrototypeLabel;
  verifierType: "open-data-import" | "business" | "peer" | "surveyor" | "operator-feed" | "fixture-author" | "desk-reviewer";
  /** Required when tier is 3 or prototypeLabel is VERIFIED. */
  evidence?: SurveyEvidence;
  /** Minute-level timestamp for a live feed. Absent means the age is unknown. */
  observedAt?: string;
  /** After this instant a live status is unknown. */
  expiresAt?: string;
}

export interface PhotoSlot {
  id: string;
  fieldId: string;
  /** Access-relevant description. A file name is not a description. */
  description: string | null;
  capturedOn: string | null;
  tier: VerificationTier | null;
  status: "empty" | "described" | "withheld";
}

/** Null value means UNKNOWN. Provenance is required when value is non-null. */
export interface Sourced<T> {
  value: T | null;
  provenance: Provenance | null;
  photoSlotIds: string[];
}

/** 0 Sunday through 6 Saturday. Open is inclusive, close is exclusive. Compared as a civil clock the user types. */
export interface HoursWindow {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  open: string;
  close: string;
}

export interface PeerTip {
  id: string;
  body: string;
  role: "peer";
  date: string;
  moderated: false;
}

export interface Identity {
  name: string;
  placeType: PlaceType;
  category: string;
  address: string | null;
  municipality: string;
  province: "ON";
  latitude: number | null;
  longitude: number | null;
  /** Required when coordinates are present. Explains that a fixture point is not a surveyed entrance. */
  coordinateNote: string | null;
  phone: string | null;
  hoursText: string | null;
  hours: HoursWindow[] | null;
  languagesOfService: string[] | null;
  accessibilityStatementUrl: string | null;
}

export interface DoorFact {
  operator: "manual" | "automatic" | "power-assist" | null;
  pushPlateHeightMm: number | null;
  forceNote: string | null;
  closingSpeedNote: string | null;
  swing: "in" | "out" | "sliding" | null;
  lock: "none" | "privacy" | "key" | "code" | "staff" | null;
}

export interface RampGeometry {
  slopeRatio: string | null;
  widthMm: number | null;
  landingMm: number | null;
  handrails: YesNo | null;
  surface: string | null;
  drainage: string | null;
}

export interface RampLengthRise {
  lengthMm: number | null;
  riseMm: number | null;
  restLandings: string | null;
  surfaceWetWinter: string | null;
}

export interface ElevatorFact {
  present: YesNo;
  carWidthMm: number | null;
  carDepthMm: number | null;
  doorWidthMm: number | null;
  controlHeightMm: number | null;
  signals: string | null;
}

export interface Entrance {
  stepCount: Sourced<number>;
  stepHeightMm: Sourced<number>;
  thresholdHeightMm: Sourced<number>;
  rampPresent: Sourced<YesNo>;
  namedLocation: Sourced<string>;
  streetDirections: Sourced<string>;
  doorClearWidthMm: Sourced<number>;
  doorOperation: Sourced<DoorFact>;
  rampGeometry: Sourced<RampGeometry>;
  rampLengthRise: Sourced<RampLengthRise>;
  elevator: Sourced<ElevatorFact>;
  lightingSignage: Sourced<string>;
  /** Explicit. Search never treats a missing value as step-free. */
  stepFree: Sourced<YesNo>;
}

export interface TransferFact {
  side: "left" | "right" | "both";
  clearFloorBesideMm: number | null;
}

export interface GrabBarFact {
  configuration: string | null;
  side: string | null;
  heightMm: number | null;
  lengthMm: number | null;
  sturdinessNote: string | null;
}

export interface SinkFact {
  heightMm: number | null;
  kneeClearanceDepthMm: number | null;
  kneeClearanceHeightMm: number | null;
  tap: string | null;
  mirrorHeightMm: number | null;
}

export interface EmergencyCordFact {
  present: YesNo;
  reachesFloor: YesNo | null;
  /** not-tested means the alarm was not activated. The App does not test emergency alarms. */
  working: "not-tested" | YesNo | null;
}

export interface ChangeTableFact {
  present: YesNo;
  lengthMm: number | null;
  widthMm: number | null;
  heightRange: string | null;
  loadKg: number | null;
  productLabel: string | null;
}

export interface HoistFact {
  present: YesNo;
  type: string | null;
  working: YesNo | null;
  slingPolicy: string | null;
  slingProvided: YesNo | null;
  operatorAvailability: string | null;
  weightCapacityKg: number | null;
}

export interface AccessPolicyFact {
  method: "open" | "key" | "code" | "staff-assisted";
  howToObtain: string | null;
  phone: string | null;
}

export interface HoursReliabilityFact {
  hoursText: string | null;
  outOfOrderNote: string | null;
  lastReportNote: string | null;
}

export interface Washroom {
  id: string;
  name: string;
  gender: "women" | "men" | "all-gender" | "family" | null;
  attendantAccessNote: string | null;
  locationAndRoute: Sourced<string>;
  door: Sourced<DoorFact>;
  doorClearWidthMm: Sourced<number>;
  turningDiameterMm: Sourced<number>;
  transfer: Sourced<TransferFact>;
  grabBars: Sourced<GrabBarFact>;
  seatHeightMm: Sourced<number>;
  sink: Sourced<SinkFact>;
  shelfHookSupplies: Sourced<string>;
  privacyLock: Sourced<string>;
  emergencyCord: Sourced<EmergencyCordFact>;
  changeTable: Sourced<ChangeTableFact>;
  hoist: Sourced<HoistFact>;
  accessPolicy: Sourced<AccessPolicyFact>;
  hoursReliability: Sourced<HoursReliabilityFact>;
  hours: HoursWindow[] | null;
}

export interface Interior {
  routes: Sourced<string>;
  counters: Sourced<string>;
  seating: Sourced<string>;
  sensory: Sourced<string>;
  assistancePolicy: Sourced<string>;
  assistiveListening: Sourced<string>;
  restSpace: Sourced<string>;
}

export interface ParkingPrivilege {
  municipality: string | null;
  bylaw: string | null;
  page: string | null;
  statement: string | null;
  checkedOn: string | null;
}

export interface ParkingBay {
  id: string;
  name: string;
  kind: "type-a-van" | "type-b-standard" | "drop-off" | "unverified";
  widthMm: Sourced<number>;
  aisleWidthMm: Sourced<number>;
  aisleSide: Sourced<"left" | "right" | "both">;
  surface: Sourced<string>;
  gradient: Sourced<string>;
  distanceToEntranceM: Sourced<number>;
  stepFreeRoute: Sourced<YesNo>;
  snowClearedOn: Sourced<string>;
  signage: Sourced<string>;
  privilege: ParkingPrivilege;
  photoSlotIds: string[];
}

export interface Parking {
  bays: ParkingBay[];
  route: Sourced<string>;
  surfaceSnow: Sourced<string>;
  payment: Sourced<string>;
  dropOff: Sourced<string>;
  curbCuts: Sourced<string>;
  approachObstacles: Sourced<string>;
}

export interface ChargingPoint {
  id: string;
  name: string;
  locationNote: Sourced<string>;
  outletType: Sourced<string>;
  outletCount: Sourced<number>;
  accessMethod: Sourced<"open" | "permission" | "staff-assisted">;
  permissionContact: Sourced<string>;
  seating: Sourced<YesNo>;
  setting: Sourced<"indoor" | "outdoor">;
  hoursText: Sourced<string>;
  hours: HoursWindow[] | null;
  cost: Sourced<string>;
  stepFreeRoute: Sourced<YesNo>;
}

export interface Transport {
  nearestStop: Sourced<string>;
  elevatorStatus: Sourced<string>;
  paratransit: Sourced<string>;
  chargingSummary: Sourced<string>;
  repairSupplySummary: Sourced<string>;
  emergencyContacts: Sourced<string>;
}

export interface TrailFields {
  surface: Sourced<string>;
  grade: Sourced<string>;
  widthMm: Sourced<number>;
  obstacles: Sourced<string>;
  rest: Sourced<string>;
}

export interface PlaceRecord {
  id: string;
  datasetStatus: DatasetStatus;
  publicationContext: PublicationContext;
  honestyNote: string;
  honestyNoteFr: string;
  depth: "bounded-seed" | "skeleton";
  identity: Identity;
  nameFr: string | null;
  recordProvenance: Provenance;
  entrance: Entrance;
  washrooms: Washroom[];
  interior: Interior;
  parking: Parking;
  chargingPoints: ChargingPoint[];
  linkedRepairerIds: string[];
  linkedSupplyStoreIds: string[];
  transport: Transport;
  photos: PhotoSlot[];
  peerTips: PeerTip[];
  /** Present only on a trailhead. Null means the trail template does not apply. */
  trail: TrailFields | null;
}

export const REPAIR_SERVICES = [
  "manual-chair",
  "power-chair",
  "seating-adjustment",
  "tyre",
  "caster",
  "battery",
  "mobile",
  "out-of-hours",
] as const;

export type RepairService = (typeof REPAIR_SERVICES)[number];

export interface Repairer {
  id: string;
  name: string;
  nameFr: string | null;
  datasetStatus: DatasetStatus;
  publicationContext: PublicationContext;
  honestyNote: string;
  honestyNoteFr: string;
  /** Services the business record publishes. The App does not infer services from a name. */
  servicesPublished: RepairService[];
  coverageNote: string | null;
  mobileRadiusKm: number | null;
  hoursText: string | null;
  hours: HoursWindow[] | null;
  phone: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  coordinateNote: string | null;
  premisesPlaceId: string | null;
  provenance: Provenance;
}

export const SUPPLY_CATEGORIES = [
  "catheter-supplies",
  "continence-products",
  "bowel-care-supplies",
  "skin-care-products",
] as const;

export type SupplyCategory = (typeof SUPPLY_CATEGORIES)[number];

export interface SupplyStore {
  id: string;
  name: string;
  nameFr: string | null;
  datasetStatus: DatasetStatus;
  publicationContext: PublicationContext;
  honestyNote: string;
  honestyNoteFr: string;
  storeType: "pharmacy" | "supply-store";
  /** Published categories only. A category is not a claim that a specific product is in stock. */
  categoriesPublished: SupplyCategory[];
  hoursText: string | null;
  hours: HoursWindow[] | null;
  delivery: YesNo | null;
  phone: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  coordinateNote: string | null;
  premisesPlaceId: string | null;
  provenance: Provenance;
}

export interface PlacePack {
  id: string;
  kind: "labelled-fixture";
  generatedOn: string;
  notice: string;
  places: PlaceRecord[];
  repairers: Repairer[];
  supplyStores: SupplyStore[];
}

export const CHANGE_PROBLEMS = [
  "locked",
  "out-of-order",
  "used-as-storage",
  "entrance-blocked",
  "bay-blocked",
  "snow-blocked",
  "outlet-blocked",
  "permission-refused",
  "point-removed",
  "business-closed",
  "moved",
  "service-not-offered",
  "other",
] as const;

export type ChangeProblem = (typeof CHANGE_PROBLEMS)[number];

export interface Correction {
  id: string;
  placeId: string;
  fieldId: string;
  suggestedCorrection: string;
  note: string;
  submittedAt: string;
  status: "pending";
  moderation: "not-running";
}

export interface ChangeReport {
  id: string;
  placeId: string;
  targetId: string;
  problem: ChangeProblem;
  note: string;
  submittedAt: string;
  status: "pending";
  moderation: "not-running";
}

export interface ReportLog {
  corrections: Correction[];
  changes: ChangeReport[];
}
