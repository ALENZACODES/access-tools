import type {
  ChargingPoint,
  Lang,
  ParkingBay,
  PhotoSlot,
  PlacePack,
  PlaceRecord,
  Provenance,
  Repairer,
  SupplyStore,
  Washroom,
} from "./types.js";
import {
  formatChangeTable,
  formatCord,
  formatDoor,
  formatElevator,
  formatGrabBars,
  formatHoist,
  formatMm,
  formatRampGeometry,
  formatRampLength,
  formatSink,
  formatTransfer,
  formatYesNo,
  unknownLabel,
} from "./format.js";
import { copy, labelOf, localizeAuthored, phrase } from "./i18n.js";
import { freshness, tierPhrase, winterClearanceText, type FreshnessLayer } from "./staleness.js";
import { privilegeText, PROTOTYPE_NOTICE, vanLiftReading, vanLiftText } from "./recommend.js";

export interface PhotoView {
  id: string;
  text: string;
  /** Substrings that stay English on a French screen. */
  englishFragments: string[];
}

export interface FieldRowView {
  id: string;
  label: string;
  valueText: string;
  unknown: boolean;
  tierText: string;
  sourceName: string;
  sourceDate: string;
  recordDate: string;
  licence: string;
  freshnessText: string;
  photos: PhotoView[];
  /** Substrings of valueText that stay English on a French screen. */
  englishFragments: string[];
}

export interface WashroomCardView {
  id: string;
  heading: string;
  genderText: string;
  attendantText: string;
  rows: FieldRowView[];
  englishFragments: string[];
}

export interface BayCardView {
  id: string;
  heading: string;
  kindText: string;
  vanLiftText: string;
  privilegeText: string;
  rows: FieldRowView[];
}

export interface ChargingCardView {
  id: string;
  heading: string;
  rows: FieldRowView[];
}

export interface DirectoryCardView {
  id: string;
  heading: string;
  lines: string[];
  englishFragments: string[];
}

export interface SectionView {
  id: string;
  heading: string;
  intro: string | null;
  rows: FieldRowView[];
}

export interface PlaceView {
  title: string;
  prototypeNotice: string;
  honestyNote: string;
  tierBadge: string;
  sourceLine: string;
  depthStatement: string | null;
  sections: SectionView[];
  washrooms: WashroomCardView[];
  bays: BayCardView[];
  charging: ChargingCardView[];
  repairers: DirectoryCardView[];
  supplyStores: DirectoryCardView[];
  peerTips: Array<{ text: string; englishFragments: string[] }>;
}

interface RowInput {
  id: string;
  label: string;
  valueText: string;
  unknown: boolean;
  provenance: Provenance | null;
  photoSlotIds: string[];
  layer: FreshnessLayer;
  englishFragments?: string[];
}

const ENTRANCE_IDS = [
  "entrance.no-single-status",
  "entrance.step-height-mm",
  "entrance.threshold-height-mm",
  "entrance.ramp-present",
  "entrance.named-location",
  "entrance.street-directions",
  "entrance.door-clear-width-mm",
  "entrance.door-operation",
  "entrance.ramp-geometry",
  "entrance.ramp-length-rise",
  "entrance.elevator",
  "entrance.lighting-signage",
] as const;

const WASHROOM_IDS = [
  "washroom.location-and-route",
  "washroom.door",
  "washroom.turning-diameter-mm",
  "washroom.transfer",
  "washroom.grab-bars",
  "washroom.seat-height-mm",
  "washroom.sink",
  "washroom.shelf-hook-supplies",
  "washroom.privacy-lock",
  "washroom.emergency-cord",
  "washroom.change-table",
  "washroom.hoist",
  "washroom.access-policy",
  "washroom.hours-reliability",
] as const;

const INTERIOR_IDS = [
  "interior.routes",
  "interior.counters",
  "interior.seating",
  "interior.sensory",
  "interior.assistance-policy",
  "interior.assistive-listening",
  "interior.rest-space",
] as const;

const PARKING_IDS = [
  "parking.bay-summary",
  "parking.route",
  "parking.van-lift",
  "parking.surface-snow",
  "parking.payment",
  "parking.drop-off",
  "parking.curb-cuts",
  "parking.approach-obstacles",
] as const;

const TRANSPORT_IDS = [
  "transport.nearest-stop",
  "transport.elevator-status",
  "transport.paratransit",
  "transport.charging",
  "transport.repair-supply",
  "transport.emergency-contacts",
] as const;

const TRUST_IDS = [
  "trust.tier",
  "trust.last-verified",
  "trust.source",
  "trust.photos",
  "trust.correction-path",
  "trust.dispute-path",
  "trust.peer-tips",
  "trust.bilingual",
] as const;

const IDENTITY_IDS = [
  "identity.name",
  "identity.place-type",
  "identity.address",
  "identity.municipality",
  "identity.coordinates",
  "identity.category",
  "identity.hours",
  "identity.phone",
  "identity.languages",
  "identity.statement",
  "identity.dataset",
  "identity.depth",
] as const;

/** Section 5.2 core arithmetic: 12 + 14 + 7 + 8 + 6 + 8 = 55, plus 12 identity fields. */
export const FIELD_COUNTS = {
  entrance: ENTRANCE_IDS.length,
  washroom: WASHROOM_IDS.length,
  interior: INTERIOR_IDS.length,
  parking: PARKING_IDS.length,
  transport: TRANSPORT_IDS.length,
  trust: TRUST_IDS.length,
  identity: IDENTITY_IDS.length,
} as const;

export const DAY3_EXTRA_IDS = ["entrance.step-count", "entrance.step-free"] as const;

function photoViews(photos: PhotoSlot[], ids: string[], lang: Lang): PhotoView[] {
  if (ids.length === 0) {
    return [{ id: "none", text: copy("photo.none", lang), englishFragments: [] }];
  }
  return ids.map((id) => {
    const photo = photos.find((slot) => slot.id === id);
    if (!photo) {
      return { id, text: copy("photo.missing", lang), englishFragments: [] };
    }
    if (photo.status === "empty") {
      return { id, text: copy("photo.none", lang), englishFragments: [] };
    }
    if (photo.status === "withheld") {
      return { id, text: copy("photo.withheld", lang), englishFragments: [] };
    }
    if (!photo.description) {
      return {
        id,
        text: copy("photo.no-description", lang),
        englishFragments: [],
      };
    }
    const date = photo.capturedOn ?? copy("photo.date-unknown", lang);
    const file = copy("photo.file-absent", lang);
    return {
      id,
      text: phrase("photo.caption", lang, { description: photo.description, date, file }),
      englishFragments: lang === "fr" ? [photo.description] : [],
    };
  });
}

function authoredFr(text: string, lang: Lang): string {
  return localizeAuthored(text, lang);
}

function rowFrom(place: PlaceRecord, input: RowInput, lang: Lang, today: string): FieldRowView {
  const fresh = freshness(input.provenance, today, input.layer, lang);
  const tierText = input.provenance
    ? tierPhrase(input.provenance, place.datasetStatus, lang, place.publicationContext, {
        requirePhoto: input.id.startsWith("washroom."),
      })
    : copy("tier.none", lang);
  return {
    id: input.id,
    label: input.label,
    valueText: input.valueText,
    unknown: input.unknown,
    tierText,
    sourceName: input.provenance ? authoredFr(input.provenance.sourceName, lang) : copy("source.none", lang),
    sourceDate: input.provenance?.sourceDate ?? unknownLabel(lang),
    recordDate: input.provenance?.recordDate ?? unknownLabel(lang),
    licence: input.provenance ? authoredFr(input.provenance.licence, lang) : copy("licence.none", lang),
    freshnessText: fresh.text,
    photos: photoViews(place.photos, input.photoSlotIds, lang),
    englishFragments: input.englishFragments ?? [],
  };
}

function keptEnglish(fragments: Array<string | null | undefined>, lang: Lang): string[] {
  if (lang !== "fr") return [];
  return fragments.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function proseRow(
  place: PlaceRecord,
  id: string,
  value: string | null,
  provenance: Provenance | null,
  photoSlotIds: string[],
  layer: FreshnessLayer,
  lang: Lang,
  today: string,
): FieldRowView {
  const read = textOrUnknown(value, lang);
  return sourcedRow(place, id, read.text, read.unknown, provenance, photoSlotIds, layer, lang, today, keptEnglish(read.unknown ? [] : [value], lang));
}

function sourcedRow(
  place: PlaceRecord,
  id: string,
  valueText: string,
  unknown: boolean,
  provenance: Provenance | null,
  photoSlotIds: string[],
  layer: FreshnessLayer,
  lang: Lang,
  today: string,
  englishFragments: string[] = [],
): FieldRowView {
  return rowFrom(
    place,
    { id, label: labelOf(id, lang), valueText, unknown, provenance, photoSlotIds, layer, englishFragments },
    lang,
    today,
  );
}

function ruleRow(place: PlaceRecord, id: string, valueText: string, lang: Lang, today: string): FieldRowView {
  return rowFrom(
    place,
    {
      id,
      label: labelOf(id, lang),
      valueText,
      unknown: false,
      provenance: null,
      photoSlotIds: [],
      layer: "venue",
    },
    lang,
    today,
  );
}

function textOrUnknown(value: string | null, lang: Lang): { text: string; unknown: boolean } {
  if (value === null || value.trim() === "") return { text: unknownLabel(lang), unknown: true };
  return { text: value, unknown: false };
}

export function projectPlace(place: PlaceRecord, lang: Lang, today: string, pack?: PlacePack): PlaceView {
  const u = unknownLabel(lang);
  const title = lang === "fr" && place.nameFr ? place.nameFr : place.identity.name;
  const coords =
    place.identity.latitude === null || place.identity.longitude === null
      ? { text: u, unknown: true }
      : {
          text: `${place.identity.latitude.toFixed(5)}, ${place.identity.longitude.toFixed(5)}. ${place.identity.coordinateNote ?? u}`,
          unknown: false,
        };
  const identityRows: FieldRowView[] = [
    sourcedRow(place, "identity.name", place.identity.name, false, place.recordProvenance, [], "venue", lang, today, keptEnglish([place.identity.name], lang)),
    sourcedRow(place, "identity.place-type", labelOf(`placeType.${place.identity.placeType}`, lang), false, place.recordProvenance, [], "venue", lang, today),
    proseRow(place, "identity.address", place.identity.address, place.identity.address ? place.recordProvenance : null, [], "venue", lang, today),
    sourcedRow(place, "identity.municipality", `${place.identity.municipality}, ${place.identity.province}`, false, place.recordProvenance, [], "venue", lang, today),
    sourcedRow(place, "identity.coordinates", coords.text, coords.unknown, coords.unknown ? null : place.recordProvenance, [], "venue", lang, today, keptEnglish(coords.unknown ? [] : [place.identity.coordinateNote], lang)),
    sourcedRow(place, "identity.category", labelOf(`category.${place.identity.category}`, lang), false, place.recordProvenance, [], "venue", lang, today),
    proseRow(place, "identity.hours", place.identity.hoursText, place.identity.hoursText ? place.recordProvenance : null, [], "policy", lang, today),
    proseRow(place, "identity.phone", place.identity.phone, place.identity.phone ? place.recordProvenance : null, [], "venue", lang, today),
    sourcedRow(
      place,
      "identity.languages",
      place.identity.languagesOfService ? place.identity.languagesOfService.join(", ") : u,
      place.identity.languagesOfService === null,
      place.identity.languagesOfService ? place.recordProvenance : null,
      [],
      "venue",
      lang,
      today,
    ),
    sourcedRow(
      place,
      "identity.statement",
      textOrUnknown(place.identity.accessibilityStatementUrl, lang).text,
      place.identity.accessibilityStatementUrl === null,
      place.identity.accessibilityStatementUrl ? place.recordProvenance : null,
      [],
      "policy",
      lang,
      today,
    ),
    sourcedRow(place, "identity.dataset", labelOf(`dataset.${place.datasetStatus}`, lang), false, place.recordProvenance, [], "venue", lang, today),
    sourcedRow(place, "identity.depth", labelOf(`depth.${place.depth}`, lang), false, place.recordProvenance, [], "venue", lang, today),
  ];

  const entrance = place.entrance;
  const entranceRows: FieldRowView[] = [
    ruleRow(
      place,
      "entrance.no-single-status",
      copy("status.no-single", lang),
      lang,
      today,
    ),
    sourcedRow(place, "entrance.step-count", entrance.stepCount.value === null ? u : String(entrance.stepCount.value), entrance.stepCount.value === null, entrance.stepCount.provenance, entrance.stepCount.photoSlotIds, "venue", lang, today),
    sourcedRow(place, "entrance.step-free", formatYesNo(entrance.stepFree.value, lang), entrance.stepFree.value === null, entrance.stepFree.provenance, entrance.stepFree.photoSlotIds, "venue", lang, today),
    sourcedRow(place, "entrance.step-height-mm", formatMm(entrance.stepHeightMm.value, lang), entrance.stepHeightMm.value === null, entrance.stepHeightMm.provenance, entrance.stepHeightMm.photoSlotIds, "venue", lang, today),
    sourcedRow(place, "entrance.threshold-height-mm", formatMm(entrance.thresholdHeightMm.value, lang), entrance.thresholdHeightMm.value === null, entrance.thresholdHeightMm.provenance, entrance.thresholdHeightMm.photoSlotIds, "venue", lang, today),
    sourcedRow(place, "entrance.ramp-present", formatYesNo(entrance.rampPresent.value, lang), entrance.rampPresent.value === null, entrance.rampPresent.provenance, entrance.rampPresent.photoSlotIds, "venue", lang, today),
    proseRow(place, "entrance.named-location", entrance.namedLocation.value, entrance.namedLocation.provenance, entrance.namedLocation.photoSlotIds, "venue", lang, today),
    proseRow(place, "entrance.street-directions", entrance.streetDirections.value, entrance.streetDirections.provenance, entrance.streetDirections.photoSlotIds, "venue", lang, today),
    sourcedRow(place, "entrance.door-clear-width-mm", formatMm(entrance.doorClearWidthMm.value, lang), entrance.doorClearWidthMm.value === null, entrance.doorClearWidthMm.provenance, entrance.doorClearWidthMm.photoSlotIds, "venue", lang, today),
    sourcedRow(place, "entrance.door-operation", formatDoor(entrance.doorOperation.value, lang), entrance.doorOperation.value === null, entrance.doorOperation.provenance, entrance.doorOperation.photoSlotIds, "venue", lang, today),
    sourcedRow(place, "entrance.ramp-geometry", formatRampGeometry(entrance.rampGeometry.value, lang), entrance.rampGeometry.value === null, entrance.rampGeometry.provenance, entrance.rampGeometry.photoSlotIds, "venue", lang, today),
    sourcedRow(place, "entrance.ramp-length-rise", formatRampLength(entrance.rampLengthRise.value, lang), entrance.rampLengthRise.value === null, entrance.rampLengthRise.provenance, entrance.rampLengthRise.photoSlotIds, "venue", lang, today),
    sourcedRow(place, "entrance.elevator", formatElevator(entrance.elevator.value, lang), entrance.elevator.value === null, entrance.elevator.provenance, entrance.elevator.photoSlotIds, "venue", lang, today),
    proseRow(place, "entrance.lighting-signage", entrance.lightingSignage.value, entrance.lightingSignage.provenance, entrance.lightingSignage.photoSlotIds, "venue", lang, today),
  ];

  const interior = place.interior;
  const interiorRows = [
    proseRow(place, "interior.routes", interior.routes.value, interior.routes.provenance, interior.routes.photoSlotIds, "venue", lang, today),
    proseRow(place, "interior.counters", interior.counters.value, interior.counters.provenance, interior.counters.photoSlotIds, "venue", lang, today),
    proseRow(place, "interior.seating", interior.seating.value, interior.seating.provenance, interior.seating.photoSlotIds, "venue", lang, today),
    proseRow(place, "interior.sensory", interior.sensory.value, interior.sensory.provenance, interior.sensory.photoSlotIds, "venue", lang, today),
    proseRow(place, "interior.assistance-policy", interior.assistancePolicy.value, interior.assistancePolicy.provenance, interior.assistancePolicy.photoSlotIds, "policy", lang, today),
    proseRow(place, "interior.assistive-listening", interior.assistiveListening.value, interior.assistiveListening.provenance, interior.assistiveListening.photoSlotIds, "venue", lang, today),
    proseRow(place, "interior.rest-space", interior.restSpace.value, interior.restSpace.provenance, interior.restSpace.photoSlotIds, "venue", lang, today),
  ];

  const baySummary =
    place.parking.bays.length === 0
      ? { text: u, unknown: true }
      : {
          text: place.parking.bays.map((bay) => `${bay.name}${copy("sep.colon", lang)}${labelOf(`bay.${bay.kind}`, lang)}`).join(copy("sep.semicolon", lang)),
          unknown: false,
        };
  const vanSummary =
    place.parking.bays.length === 0
      ? { text: u, unknown: true }
      : {
          text: place.parking.bays.map((bay) => `${bay.name}${copy("sep.colon", lang)}${vanLiftText(vanLiftReading(bay), lang)}`).join(" "),
          unknown: false,
        };
  const month = Number(today.slice(5, 7));
  const snow = place.parking.surfaceSnow;
  const snowText = snow.value
    ? `${snow.value} ${winterClearanceText(
        place.parking.bays.find((bay) => bay.snowClearedOn.value)?.snowClearedOn.value ?? null,
        Number.isFinite(month) ? month : 1,
        lang,
      )}`
    : winterClearanceText(
        place.parking.bays.find((bay) => bay.snowClearedOn.value)?.snowClearedOn.value ?? null,
        Number.isFinite(month) ? month : 1,
        lang,
      );
  const parkingRows = [
    sourcedRow(place, "parking.bay-summary", baySummary.text, baySummary.unknown, baySummary.unknown ? null : place.recordProvenance, [], "parking", lang, today, keptEnglish(place.parking.bays.map((bay) => bay.name), lang)),
    proseRow(place, "parking.route", place.parking.route.value, place.parking.route.provenance, place.parking.route.photoSlotIds, "parking", lang, today),
    sourcedRow(place, "parking.van-lift", vanSummary.text, vanSummary.unknown, null, [], "parking", lang, today, keptEnglish(place.parking.bays.map((bay) => bay.name), lang)),
    sourcedRow(place, "parking.surface-snow", snowText, snow.value === null && place.parking.bays.every((bay) => bay.snowClearedOn.value === null), snow.provenance, snow.photoSlotIds, "parking", lang, today, keptEnglish([snow.value], lang)),
    proseRow(place, "parking.payment", place.parking.payment.value, place.parking.payment.provenance, place.parking.payment.photoSlotIds, "policy", lang, today),
    proseRow(place, "parking.drop-off", place.parking.dropOff.value, place.parking.dropOff.provenance, place.parking.dropOff.photoSlotIds, "parking", lang, today),
    proseRow(place, "parking.curb-cuts", place.parking.curbCuts.value, place.parking.curbCuts.provenance, place.parking.curbCuts.photoSlotIds, "parking", lang, today),
    proseRow(place, "parking.approach-obstacles", place.parking.approachObstacles.value, place.parking.approachObstacles.provenance, place.parking.approachObstacles.photoSlotIds, "parking", lang, today),
  ];

  const chargingSummary =
    place.transport.chargingSummary.value ??
    (place.chargingPoints.length === 0
      ? null
      : phrase("summary.charging", lang, { count: place.chargingPoints.length }));
  const repairSummary =
    place.transport.repairSupplySummary.value ??
    (place.linkedRepairerIds.length + place.linkedSupplyStoreIds.length === 0
      ? null
      : copy("summary.directory", lang));
  const transport = place.transport;
  const transportRows = [
    proseRow(place, "transport.nearest-stop", transport.nearestStop.value, transport.nearestStop.provenance, transport.nearestStop.photoSlotIds, "venue", lang, today),
    proseRow(place, "transport.elevator-status", transport.elevatorStatus.value, transport.elevatorStatus.provenance, transport.elevatorStatus.photoSlotIds, "venue", lang, today),
    proseRow(place, "transport.paratransit", transport.paratransit.value, transport.paratransit.provenance, transport.paratransit.photoSlotIds, "policy", lang, today),
    sourcedRow(place, "transport.charging", textOrUnknown(chargingSummary, lang).text, chargingSummary === null, transport.chargingSummary.provenance, transport.chargingSummary.photoSlotIds, "charging", lang, today, keptEnglish([place.transport.chargingSummary.value], lang)),
    sourcedRow(place, "transport.repair-supply", textOrUnknown(repairSummary, lang).text, repairSummary === null, transport.repairSupplySummary.provenance, transport.repairSupplySummary.photoSlotIds, "repair", lang, today, keptEnglish([place.transport.repairSupplySummary.value], lang)),
    proseRow(place, "transport.emergency-contacts", transport.emergencyContacts.value, transport.emergencyContacts.provenance, transport.emergencyContacts.photoSlotIds, "venue", lang, today),
  ];

  const described = place.photos.filter((photo) => photo.status === "described" && photo.description).length;
  const empty = place.photos.filter((photo) => photo.status === "empty").length;
  const trustRows = [
    sourcedRow(place, "trust.tier", tierPhrase(place.recordProvenance, place.datasetStatus, lang, place.publicationContext), false, place.recordProvenance, [], "venue", lang, today),
    sourcedRow(place, "trust.last-verified", place.recordProvenance.recordDate, false, place.recordProvenance, [], "venue", lang, today),
    sourcedRow(
      place,
      "trust.source",
      `${authoredFr(place.recordProvenance.sourceName, lang)}. ${authoredFr(place.recordProvenance.licence, lang)}`,
      false,
      place.recordProvenance,
      [],
      "venue",
      lang,
      today,
    ),
    ruleRow(
      place,
      "trust.photos",
      phrase("summary.photos", lang, { slots: place.photos.length, described, empty }),
      lang,
      today,
    ),
    ruleRow(
      place,
      "trust.correction-path",
      copy("trust.correction", lang),
      lang,
      today,
    ),
    ruleRow(
      place,
      "trust.dispute-path",
      copy("trust.dispute", lang),
      lang,
      today,
    ),
    ruleRow(
      place,
      "trust.peer-tips",
      place.peerTips.length === 0
        ? copy("trust.peer-none", lang)
        : phrase("trust.peer-count", lang, { count: place.peerTips.length }),
      lang,
      today,
    ),
    ruleRow(
      place,
      "trust.bilingual",
      copy("trust.bilingual-note", lang),
      lang,
      today,
    ),
  ];

  const sections: SectionView[] = [
    {
      id: "getting-there",
      heading: copy("section.getting-there", lang),
      intro: copy("section.approach", lang),
      rows: [transportRows[0], parkingRows[5], parkingRows[6], parkingRows[7]].filter((row): row is FieldRowView => row !== undefined),
    },
    {
      id: "entrance",
      heading: copy("section.entrance", lang),
      intro: null,
      rows: entranceRows,
    },
    {
      id: "inside",
      heading: copy("section.inside", lang),
      intro: null,
      rows: [interiorRows[0], interiorRows[6]].filter((row): row is FieldRowView => row !== undefined),
    },
    {
      id: "washrooms",
      heading: copy("section.washrooms", lang),
      intro: place.washrooms.length === 0 ? copy("washroom.none-linked", lang) : copy("washroom.each-record", lang),
      rows: place.washrooms.length === 0 ? projectWashroom(place, emptyWashroomPlaceholder(), lang, today).rows : [],
    },
    {
      id: "parking",
      heading: copy("section.parking", lang),
      intro: copy("parking.separate", lang),
      rows: parkingRows,
    },
    {
      id: "seating",
      heading: copy("section.seating", lang),
      intro: null,
      rows: [interiorRows[1], interiorRows[2]].filter((row): row is FieldRowView => row !== undefined),
    },
    {
      id: "policies",
      heading: copy("section.policies", lang),
      intro: copy("policy.quoted", lang),
      rows: [interiorRows[3], interiorRows[4], interiorRows[5], transportRows[2]].filter((row): row is FieldRowView => row !== undefined),
    },
    {
      id: "charging",
      heading: copy("section.charging", lang),
      intro: transportRows[3]?.valueText ?? null,
      rows: transportRows[3] ? [transportRows[3]] : [],
    },
    {
      id: "repair",
      heading: copy("section.repair", lang),
      intro: transportRows[4]?.valueText ?? null,
      rows: transportRows[4] ? [transportRows[4]] : [],
    },
    {
      id: "photos",
      heading: copy("section.photos", lang),
      intro: copy("photo.not-evidence", lang),
      rows: trustRows[3] ? [trustRows[3]] : [],
    },
    {
      id: "reports",
      heading: copy("section.reports", lang),
      intro: null,
      rows: trustRows.filter((row) => row.id === "trust.correction-path" || row.id === "trust.dispute-path" || row.id === "trust.peer-tips"),
    },
    {
      id: "trust",
      heading: copy("section.source", lang),
      intro: null,
      rows: trustRows.filter((row) => row.id === "trust.tier" || row.id === "trust.last-verified" || row.id === "trust.source" || row.id === "trust.bilingual"),
    },
  ];

  if (place.trail) {
    sections.push({
      id: "trail",
      heading: copy("section.trail", lang),
      intro: copy("trail.template", lang),
      rows: [
        proseRow(place, "trail.surface", place.trail.surface.value, place.trail.surface.provenance, place.trail.surface.photoSlotIds, "venue", lang, today),
        proseRow(place, "trail.grade", place.trail.grade.value, place.trail.grade.provenance, place.trail.grade.photoSlotIds, "venue", lang, today),
        sourcedRow(place, "trail.width-mm", formatMm(place.trail.widthMm.value, lang), place.trail.widthMm.value === null, place.trail.widthMm.provenance, place.trail.widthMm.photoSlotIds, "venue", lang, today),
        proseRow(place, "trail.obstacles", place.trail.obstacles.value, place.trail.obstacles.provenance, place.trail.obstacles.photoSlotIds, "venue", lang, today),
        proseRow(place, "trail.rest", place.trail.rest.value, place.trail.rest.provenance, place.trail.rest.photoSlotIds, "venue", lang, today),
      ],
    });
  }

  const identitySection: SectionView = {
    id: "identity",
    heading: copy("section.identity", lang),
    intro: null,
    rows: identityRows,
  };

  const repairers = (pack?.repairers ?? []).filter((repairer) => place.linkedRepairerIds.includes(repairer.id)).map((repairer) => projectRepairer(repairer, lang));
  const supplyStores = (pack?.supplyStores ?? []).filter((store) => place.linkedSupplyStoreIds.includes(store.id)).map((store) => projectSupply(store, lang));

  return {
    title,
    prototypeNotice: PROTOTYPE_NOTICE[lang],
    honestyNote: lang === "fr" ? place.honestyNoteFr : place.honestyNote,
    tierBadge: tierPhrase(place.recordProvenance, place.datasetStatus, lang, place.publicationContext),
    sourceLine: phrase("place.source-line", lang, {
      source: authoredFr(place.recordProvenance.sourceName, lang),
      sourceDate: place.recordProvenance.sourceDate,
      recordDate: place.recordProvenance.recordDate,
      licence: authoredFr(place.recordProvenance.licence, lang),
    }),
    depthStatement:
      place.depth === "skeleton" ? phrase("place.skeleton", lang, { municipality: place.identity.municipality }) : null,
    sections: [identitySection, ...sections],
    washrooms: place.washrooms.map((washroom) => projectWashroom(place, washroom, lang, today)),
    bays: place.parking.bays.map((bay) => projectBay(place, bay, lang, today, month)),
    charging: place.chargingPoints.map((point) => projectCharging(place, point, lang, today)),
    repairers,
    supplyStores,
    peerTips: place.peerTips.map((tip) => ({
      text: phrase("place.peer-tip", lang, { date: tip.date, body: tip.body }),
      englishFragments: keptEnglish([tip.body], lang),
    })),
  };
}

function emptyWashroomPlaceholder(): Washroom {
  return {
    id: "none",
    name: "none",
    gender: null,
    attendantAccessNote: null,
    locationAndRoute: { value: null, provenance: null, photoSlotIds: [] },
    door: { value: null, provenance: null, photoSlotIds: [] },
    doorClearWidthMm: { value: null, provenance: null, photoSlotIds: [] },
    turningDiameterMm: { value: null, provenance: null, photoSlotIds: [] },
    transfer: { value: null, provenance: null, photoSlotIds: [] },
    grabBars: { value: null, provenance: null, photoSlotIds: [] },
    seatHeightMm: { value: null, provenance: null, photoSlotIds: [] },
    sink: { value: null, provenance: null, photoSlotIds: [] },
    shelfHookSupplies: { value: null, provenance: null, photoSlotIds: [] },
    privacyLock: { value: null, provenance: null, photoSlotIds: [] },
    emergencyCord: { value: null, provenance: null, photoSlotIds: [] },
    changeTable: { value: null, provenance: null, photoSlotIds: [] },
    hoist: { value: null, provenance: null, photoSlotIds: [] },
    accessPolicy: { value: null, provenance: null, photoSlotIds: [] },
    hoursReliability: { value: null, provenance: null, photoSlotIds: [] },
    hours: null,
  };
}

export function projectWashroom(place: PlaceRecord, washroom: Washroom, lang: Lang, today: string): WashroomCardView {
  const u = unknownLabel(lang);
  const doorText = washroom.door.value
    ? phrase("washroom.clear-width", lang, {
        door: formatDoor(washroom.door.value, lang),
        width: formatMm(washroom.doorClearWidthMm.value, lang),
      })
    : formatMm(washroom.doorClearWidthMm.value, lang);
  const doorUnknown = washroom.door.value === null && washroom.doorClearWidthMm.value === null;
  const access = washroom.accessPolicy.value;
  const accessText = access
    ? [labelOf(`access.${access.method}`, lang), access.howToObtain ?? u, access.phone ?? u].join(". ")
    : u;
  const hours = washroom.hoursReliability.value;
  const hoursText = hours
    ? [hours.hoursText ?? u, hours.outOfOrderNote ?? copy("washroom.out-of-order", lang), hours.lastReportNote ?? copy("washroom.last-report", lang)].join(". ")
    : u;
  const gender = washroom.gender === null ? u : labelOf(`gender.${washroom.gender}`, lang);
  const rows = [
    proseRow(place, "washroom.location-and-route", washroom.locationAndRoute.value, washroom.locationAndRoute.provenance, washroom.locationAndRoute.photoSlotIds, "washroom", lang, today),
    sourcedRow(place, "washroom.door", doorText, doorUnknown, washroom.door.provenance ?? washroom.doorClearWidthMm.provenance, [...washroom.door.photoSlotIds, ...washroom.doorClearWidthMm.photoSlotIds], "washroom", lang, today, keptEnglish([washroom.door.value?.forceNote, washroom.door.value?.closingSpeedNote], lang)),
    sourcedRow(place, "washroom.turning-diameter-mm", formatMm(washroom.turningDiameterMm.value, lang), washroom.turningDiameterMm.value === null, washroom.turningDiameterMm.provenance, washroom.turningDiameterMm.photoSlotIds, "washroom", lang, today),
    sourcedRow(place, "washroom.transfer", formatTransfer(washroom.transfer.value, lang), washroom.transfer.value === null, washroom.transfer.provenance, washroom.transfer.photoSlotIds, "washroom", lang, today),
    sourcedRow(place, "washroom.grab-bars", formatGrabBars(washroom.grabBars.value, lang), washroom.grabBars.value === null, washroom.grabBars.provenance, washroom.grabBars.photoSlotIds, "washroom", lang, today, keptEnglish([washroom.grabBars.value?.configuration, washroom.grabBars.value?.side, washroom.grabBars.value?.sturdinessNote], lang)),
    sourcedRow(place, "washroom.seat-height-mm", formatMm(washroom.seatHeightMm.value, lang), washroom.seatHeightMm.value === null, washroom.seatHeightMm.provenance, washroom.seatHeightMm.photoSlotIds, "washroom", lang, today),
    sourcedRow(place, "washroom.sink", formatSink(washroom.sink.value, lang), washroom.sink.value === null, washroom.sink.provenance, washroom.sink.photoSlotIds, "washroom", lang, today, keptEnglish([washroom.sink.value?.tap], lang)),
    proseRow(place, "washroom.shelf-hook-supplies", washroom.shelfHookSupplies.value, washroom.shelfHookSupplies.provenance, washroom.shelfHookSupplies.photoSlotIds, "washroom", lang, today),
    proseRow(place, "washroom.privacy-lock", washroom.privacyLock.value, washroom.privacyLock.provenance, washroom.privacyLock.photoSlotIds, "washroom", lang, today),
    sourcedRow(place, "washroom.emergency-cord", formatCord(washroom.emergencyCord.value, lang), washroom.emergencyCord.value === null, washroom.emergencyCord.provenance, washroom.emergencyCord.photoSlotIds, "washroom", lang, today),
    sourcedRow(place, "washroom.change-table", formatChangeTable(washroom.changeTable.value, lang), washroom.changeTable.value === null, washroom.changeTable.provenance, washroom.changeTable.photoSlotIds, "washroom", lang, today, keptEnglish([washroom.changeTable.value?.heightRange, washroom.changeTable.value?.productLabel], lang)),
    sourcedRow(place, "washroom.hoist", formatHoist(washroom.hoist.value, lang), washroom.hoist.value === null, washroom.hoist.provenance, washroom.hoist.photoSlotIds, "washroom", lang, today, keptEnglish([washroom.hoist.value?.type, washroom.hoist.value?.slingPolicy, washroom.hoist.value?.operatorAvailability], lang)),
    sourcedRow(place, "washroom.access-policy", accessText, access === null, washroom.accessPolicy.provenance, washroom.accessPolicy.photoSlotIds, "policy", lang, today, keptEnglish([access?.howToObtain], lang)),
    sourcedRow(place, "washroom.hours-reliability", hoursText, hours === null, washroom.hoursReliability.provenance, washroom.hoursReliability.photoSlotIds, "washroom", lang, today, keptEnglish([hours?.hoursText, hours?.outOfOrderNote, hours?.lastReportNote], lang)),
  ];
  return {
    id: washroom.id,
    heading: washroom.name,
    genderText: phrase("washroom.gender", lang, { gender }),
    attendantText: washroom.attendantAccessNote ?? copy("washroom.attendant", lang),
    rows,
    englishFragments: keptEnglish([washroom.name, washroom.attendantAccessNote], lang),
  };
}

function projectBay(place: PlaceRecord, bay: ParkingBay, lang: Lang, today: string, month: number): BayCardView {
  const rows: FieldRowView[] = [
    sourcedRow(place, `bay.${bay.id}.width`, formatMm(bay.widthMm.value, lang), bay.widthMm.value === null, bay.widthMm.provenance, bay.widthMm.photoSlotIds, "parking", lang, today),
    sourcedRow(place, `bay.${bay.id}.aisle`, formatMm(bay.aisleWidthMm.value, lang), bay.aisleWidthMm.value === null, bay.aisleWidthMm.provenance, bay.aisleWidthMm.photoSlotIds, "parking", lang, today),
    sourcedRow(place, `bay.${bay.id}.distance`, bay.distanceToEntranceM.value === null ? unknownLabel(lang) : `${bay.distanceToEntranceM.value} m`, bay.distanceToEntranceM.value === null, bay.distanceToEntranceM.provenance, bay.distanceToEntranceM.photoSlotIds, "parking", lang, today),
    sourcedRow(place, `bay.${bay.id}.snow`, winterClearanceText(bay.snowClearedOn.value, Number.isFinite(month) ? month : 1, lang), bay.snowClearedOn.value === null && (month >= 11 || month <= 4), bay.snowClearedOn.provenance, bay.snowClearedOn.photoSlotIds, "parking", lang, today),
    sourcedRow(place, `bay.${bay.id}.step-free-route`, formatYesNo(bay.stepFreeRoute.value, lang), bay.stepFreeRoute.value === null, bay.stepFreeRoute.provenance, bay.stepFreeRoute.photoSlotIds, "parking", lang, today),
  ];
  rows[0]!.label = copy("bay.width", lang);
  rows[1]!.label = copy("bay.aisle", lang);
  rows[2]!.label = copy("bay.entrance-distance", lang);
  rows[3]!.label = copy("bay.snow", lang);
  rows[4]!.label = copy("bay.step-free", lang);
  return {
    id: bay.id,
    heading: bay.name,
    kindText: labelOf(`bay.${bay.kind}`, lang),
    vanLiftText: vanLiftText(vanLiftReading(bay), lang),
    privilegeText: privilegeText(bay, lang),
    rows,
  };
}

function projectCharging(place: PlaceRecord, point: ChargingPoint, lang: Lang, today: string): ChargingCardView {
  const specs: Array<[string, string, boolean, Provenance | null, string[]]> = [
    [copy("charging.location", lang), point.locationNote.value ?? unknownLabel(lang), point.locationNote.value === null, point.locationNote.provenance, point.locationNote.photoSlotIds],
    [copy("charging.outlet", lang), point.outletType.value ?? unknownLabel(lang), point.outletType.value === null, point.outletType.provenance, point.outletType.photoSlotIds],
    [copy("charging.count", lang), point.outletCount.value === null ? unknownLabel(lang) : String(point.outletCount.value), point.outletCount.value === null, point.outletCount.provenance, point.outletCount.photoSlotIds],
    [copy("charging.access", lang), point.accessMethod.value ? labelOf(`access.${point.accessMethod.value}`, lang) : unknownLabel(lang), point.accessMethod.value === null, point.accessMethod.provenance, point.accessMethod.photoSlotIds],
    [copy("charging.permission", lang), point.permissionContact.value ?? unknownLabel(lang), point.permissionContact.value === null, point.permissionContact.provenance, point.permissionContact.photoSlotIds],
    [copy("charging.seating", lang), formatYesNo(point.seating.value, lang), point.seating.value === null, point.seating.provenance, point.seating.photoSlotIds],
    [copy("charging.setting", lang), point.setting.value ? labelOf(`setting.${point.setting.value}`, lang) : unknownLabel(lang), point.setting.value === null, point.setting.provenance, point.setting.photoSlotIds],
    [copy("charging.hours", lang), point.hoursText.value ?? unknownLabel(lang), point.hoursText.value === null, point.hoursText.provenance, point.hoursText.photoSlotIds],
    [copy("charging.cost", lang), point.cost.value ?? unknownLabel(lang), point.cost.value === null, point.cost.provenance, point.cost.photoSlotIds],
    [copy("bay.step-free", lang), formatYesNo(point.stepFreeRoute.value, lang), point.stepFreeRoute.value === null, point.stepFreeRoute.provenance, point.stepFreeRoute.photoSlotIds],
  ];
  const authored = [
    point.locationNote.value,
    point.outletType.value,
    null,
    null,
    point.permissionContact.value,
    null,
    null,
    point.hoursText.value,
    point.cost.value,
    null,
  ];
  const rows = specs.map((spec, index) => {
    const built = sourcedRow(place, `${point.id}.${index}`, spec[1], spec[2], spec[3], spec[4], "charging", lang, today, keptEnglish([authored[index]], lang));
    built.label = spec[0];
    return built;
  });
  return { id: point.id, heading: point.name, rows };
}

function projectRepairer(repairer: Repairer, lang: Lang): DirectoryCardView {
  const unknown = copy("value.unknown", lang);
  const services =
    repairer.servicesPublished.length === 0
      ? copy("directory.no-services", lang)
      : repairer.servicesPublished.map((service) => labelOf(`repair.${service}`, lang)).join(", ");
  const radius = repairer.mobileRadiusKm === null ? unknown : `${repairer.mobileRadiusKm} km`;
  return {
    id: repairer.id,
    heading: lang === "fr" && repairer.nameFr ? repairer.nameFr : repairer.name,
    lines: [
      lang === "fr" ? repairer.honestyNoteFr : repairer.honestyNote,
      phrase("directory.services", lang, { services }),
      phrase("directory.coverage", lang, { note: repairer.coverageNote ?? unknown }),
      phrase("directory.radius", lang, { radius }),
      phrase("directory.hours", lang, { hours: repairer.hoursText ?? unknown }),
      phrase("directory.phone", lang, { phone: repairer.phone ?? unknown }),
      phrase("directory.website", lang, { website: repairer.website ?? unknown }),
      `${authoredFr(repairer.provenance.sourceName, lang)}. ${repairer.provenance.sourceDate}. ${authoredFr(repairer.provenance.licence, lang)}`,
    ],
    englishFragments: keptEnglish([repairer.coverageNote, repairer.hoursText, repairer.nameFr ? null : repairer.name], lang),
  };
}

function projectSupply(store: SupplyStore, lang: Lang): DirectoryCardView {
  const unknown = copy("value.unknown", lang);
  const categories =
    store.categoriesPublished.length === 0
      ? copy("directory.no-categories", lang)
      : store.categoriesPublished.map((category) => labelOf(`supply.${category}`, lang)).join(", ");
  const delivery = store.delivery === null ? unknown : formatYesNo(store.delivery, lang);
  return {
    id: store.id,
    heading: lang === "fr" && store.nameFr ? store.nameFr : store.name,
    lines: [
      lang === "fr" ? store.honestyNoteFr : store.honestyNote,
      phrase("directory.categories", lang, { categories }),
      copy("directory.not-stock", lang),
      phrase("directory.hours", lang, { hours: store.hoursText ?? unknown }),
      phrase("directory.delivery", lang, { delivery }),
      phrase("directory.phone", lang, { phone: store.phone ?? unknown }),
      `${authoredFr(store.provenance.sourceName, lang)}. ${store.provenance.sourceDate}. ${authoredFr(store.provenance.licence, lang)}`,
    ],
    englishFragments: keptEnglish([store.hoursText, store.nameFr ? null : store.name], lang),
  };
}

/** A short page-language tag so two washroom options stay distinct when the group label is skipped. */
function washroomOptionPrefix(name: string, index: number, lang: Lang, used: Set<string>): string {
  const letter = name.match(/\b([A-Z])\b/)?.[1];
  const noun = copy("section.washroom", lang);
  let prefix = letter ? `${noun} ${letter}` : `${noun} ${index + 1}`;
  if (used.has(prefix)) prefix = `${noun} ${index + 1}`;
  used.add(prefix);
  return prefix;
}

export function correctableFields(
  place: PlaceRecord,
  lang: Lang,
): Array<{ id: string; label: string; group: string; groupEnglish?: boolean }> {
  const fields: Array<{ id: string; label: string; group: string; groupEnglish?: boolean }> = [];
  const add = (id: string, group: string) => fields.push({ id, label: labelOf(id, lang), group });
  for (const id of IDENTITY_IDS) add(id, copy("section.identity", lang));
  for (const id of DAY3_EXTRA_IDS) add(id, copy("section.entrance", lang));
  for (const id of ENTRANCE_IDS) add(id, copy("section.entrance", lang));
  for (const id of INTERIOR_IDS) add(id, copy("group.inside", lang));
  for (const id of PARKING_IDS) add(id, copy("section.parking", lang));
  for (const id of TRANSPORT_IDS) add(id, copy("section.transport", lang));
  const usedPrefixes = new Set<string>();
  for (const [index, washroom] of place.washrooms.entries()) {
    const prefix = washroomOptionPrefix(washroom.name, index, lang, usedPrefixes);
    const separator = copy("sep.colon", lang);
    for (const id of WASHROOM_IDS) {
      fields.push({
        id: `washroom:${washroom.id}:${id}`,
        label: `${prefix}${separator}${labelOf(id, lang)}`,
        group: washroom.name,
        groupEnglish: true,
      });
    }
  }
  if (place.trail) {
    for (const id of ["trail.surface", "trail.grade", "trail.width-mm", "trail.obstacles", "trail.rest"]) {
      add(id, copy("section.trail", lang));
    }
  }
  return fields;
}

export function coreFieldIdList(): string[] {
  return [
    ...ENTRANCE_IDS,
    ...WASHROOM_IDS,
    ...INTERIOR_IDS,
    ...PARKING_IDS,
    ...TRANSPORT_IDS,
    ...TRUST_IDS,
    ...IDENTITY_IDS,
  ];
}
