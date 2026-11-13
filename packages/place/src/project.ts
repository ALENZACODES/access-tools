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
import { labelOf, localizeAuthored } from "./i18n.js";
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

const LABELS: Record<string, { en: string; fr: string }> = {
  "entrance.no-single-status": { en: "Overall status", fr: "Statut global" },
  "entrance.step-count": { en: "Step count", fr: "Nombre de marches" },
  "entrance.step-free": { en: "Step-free entrance, explicit", fr: "Entrée sans marche, explicite" },
  "entrance.step-height-mm": { en: "Step height", fr: "Hauteur de marche" },
  "entrance.threshold-height-mm": { en: "Threshold height", fr: "Hauteur du seuil" },
  "entrance.ramp-present": { en: "Ramp present", fr: "Rampe présente" },
  "entrance.named-location": { en: "Named entrance", fr: "Entrée nommée" },
  "entrance.street-directions": { en: "Street directions", fr: "Indications depuis la rue" },
  "entrance.door-clear-width-mm": { en: "Door clear width", fr: "Largeur libre de la porte" },
  "entrance.door-operation": { en: "Door operation", fr: "Fonctionnement de la porte" },
  "entrance.ramp-geometry": { en: "Ramp slope, width, landing, handrails, surface, drainage", fr: "Pente, largeur, palier, mains courantes, surface, drainage" },
  "entrance.ramp-length-rise": { en: "Ramp length and rise", fr: "Longueur et dénivelé de la rampe" },
  "entrance.elevator": { en: "Elevator to the entrance", fr: "Ascenseur jusqu'à l'entrée" },
  "entrance.lighting-signage": { en: "Entrance lighting and signage", fr: "Éclairage et signalisation de l'entrée" },
  "washroom.location-and-route": { en: "Location and step-free route", fr: "Emplacement et chemin sans marche" },
  "washroom.door": { en: "Washroom door", fr: "Porte des toilettes" },
  "washroom.turning-diameter-mm": { en: "Turning space, door closed", fr: "Espace de rotation, porte fermée" },
  "washroom.transfer": { en: "Transfer side and clear floor", fr: "Côté de transfert et dégagement" },
  "washroom.grab-bars": { en: "Grab bars", fr: "Barres d'appui" },
  "washroom.seat-height-mm": { en: "Toilet seat height", fr: "Hauteur de la cuvette" },
  "washroom.sink": { en: "Sink and knee clearance", fr: "Lavabo et dégagement des genoux" },
  "washroom.shelf-hook-supplies": { en: "Shelf, hook, and supplies space", fr: "Tablette, crochet et espace pour les fournitures" },
  "washroom.privacy-lock": { en: "Privacy and lock", fr: "Intimité et verrou" },
  "washroom.emergency-cord": { en: "Emergency cord", fr: "Cordon d'alarme" },
  "washroom.change-table": { en: "Adult change table", fr: "Table de change adulte" },
  "washroom.hoist": { en: "Hoist", fr: "Lève-personne" },
  "washroom.access-policy": { en: "Lock, key, and code policy", fr: "Politique de clé, code et accès" },
  "washroom.hours-reliability": { en: "Hours and reliability", fr: "Heures et fiabilité" },
  "interior.routes": { en: "Interior step-free routes", fr: "Chemins intérieurs sans marche" },
  "interior.counters": { en: "Counters and service points", fr: "Comptoirs et points de service" },
  "interior.seating": { en: "Seating", fr: "Sièges" },
  "interior.sensory": { en: "Quiet, scent, lighting, and sound", fr: "Calme, parfum, éclairage et bruit" },
  "interior.assistance-policy": { en: "Assistance and support-person policy", fr: "Aide et politique de personne de soutien" },
  "interior.assistive-listening": { en: "Assistive listening and communication", fr: "Aide à l'écoute et communication" },
  "interior.rest-space": { en: "Rest and pressure-relief space", fr: "Espace de repos" },
  "parking.bay-summary": { en: "Accessible parking records", fr: "Fiches de stationnement accessible" },
  "parking.route": { en: "Bay location and route", fr: "Emplacement et chemin" },
  "parking.van-lift": { en: "Van lift deployment", fr: "Déploiement du hayon" },
  "parking.surface-snow": { en: "Surface, gradient, and snow", fr: "Surface, pente et neige" },
  "parking.payment": { en: "Payment method", fr: "Mode de paiement" },
  "parking.drop-off": { en: "Drop-off and pick-up", fr: "Dépose et reprise" },
  "parking.curb-cuts": { en: "Curb cuts on the approach", fr: "Bateaux de trottoir sur l'approche" },
  "parking.approach-obstacles": { en: "Approach width and obstacles", fr: "Largeur de l'approche et obstacles" },
  "transport.nearest-stop": { en: "Nearest transit stop", fr: "Arrêt de transport le plus proche" },
  "transport.elevator-status": { en: "Elevator dimensions and status", fr: "Dimensions et statut de l'ascenseur" },
  "transport.paratransit": { en: "Paratransit for this place", fr: "Transport adapté pour ce lieu" },
  "transport.charging": { en: "Charging for mobility devices", fr: "Recharge des aides à la mobilité" },
  "transport.repair-supply": { en: "Repair and supply proximity", fr: "Réparation et fournitures à proximité" },
  "transport.emergency-contacts": { en: "Emergency and help contacts", fr: "Contacts d'urgence et d'aide" },
  "trust.tier": { en: "Verification tier", fr: "Niveau de vérification" },
  "trust.last-verified": { en: "Last recorded date", fr: "Dernière date enregistrée" },
  "trust.source": { en: "Source", fr: "Source" },
  "trust.photos": { en: "Photo evidence", fr: "Preuves photographiques" },
  "trust.correction-path": { en: "Correction and report path", fr: "Chemin de correction et de signalement" },
  "trust.dispute-path": { en: "Venue dispute path", fr: "Chemin de contestation du lieu" },
  "trust.peer-tips": { en: "Peer tips", fr: "Notes de pairs" },
  "trust.bilingual": { en: "Bilingual content", fr: "Contenu bilingue" },
  "identity.name": { en: "Name", fr: "Nom" },
  "identity.place-type": { en: "Place type", fr: "Type de lieu" },
  "identity.address": { en: "Address", fr: "Adresse" },
  "identity.municipality": { en: "Municipality", fr: "Municipalité" },
  "identity.coordinates": { en: "Coordinates", fr: "Coordonnées" },
  "identity.category": { en: "Category", fr: "Catégorie" },
  "identity.hours": { en: "Hours", fr: "Heures" },
  "identity.phone": { en: "Phone", fr: "Téléphone" },
  "identity.languages": { en: "Languages of service", fr: "Langues de service" },
  "identity.statement": { en: "Accessibility statement", fr: "Énoncé d'accessibilité" },
  "identity.dataset": { en: "Dataset", fr: "Jeu de données" },
  "identity.depth": { en: "Seed depth", fr: "Profondeur de la graine" },
  "trail.surface": { en: "Trail surface", fr: "Surface du sentier" },
  "trail.grade": { en: "Trail grade", fr: "Pente du sentier" },
  "trail.width-mm": { en: "Trail width", fr: "Largeur du sentier" },
  "trail.obstacles": { en: "Trail obstacles", fr: "Obstacles du sentier" },
  "trail.rest": { en: "Trail rest", fr: "Repos sur le sentier" },
};

function label(id: string, lang: Lang): string {
  const entry = LABELS[id];
  if (!entry) return id;
  return lang === "fr" ? entry.fr : entry.en;
}

function photoViews(photos: PhotoSlot[], ids: string[], lang: Lang): PhotoView[] {
  if (ids.length === 0) {
    return [{ id: "none", text: lang === "fr" ? "Aucune photographie au dossier." : "No photograph on file.", englishFragments: [] }];
  }
  return ids.map((id) => {
    const photo = photos.find((slot) => slot.id === id);
    if (!photo) {
      return { id, text: lang === "fr" ? "Emplacement de photo manquant." : "Photograph slot is missing from the record.", englishFragments: [] };
    }
    if (photo.status === "empty") {
      return { id, text: lang === "fr" ? "Aucune photographie au dossier." : "No photograph on file.", englishFragments: [] };
    }
    if (photo.status === "withheld") {
      return { id, text: lang === "fr" ? "Photographie retenue pour protéger la vie privée." : "Photograph withheld to protect privacy.", englishFragments: [] };
    }
    if (!photo.description) {
      return {
        id,
        text:
          lang === "fr"
            ? "Une photo a une date mais pas de description d'accès. Elle n'est pas une preuve."
            : "A photograph has a date and no access description. It is not evidence.",
        englishFragments: [],
      };
    }
    const date = photo.capturedOn ?? (lang === "fr" ? "date inconnue" : "date unknown");
    const file =
      lang === "fr"
        ? "Le fichier image n'est pas dans ce paquet. access-maps conserve les fichiers photo."
        : "The image file is not in this package. access-maps holds photograph files.";
    return {
      id,
      text: `${photo.description} (${date}). ${file}`,
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
    : lang === "fr"
      ? "Aucun niveau. Non vérifié."
      : "No tier. Unverified.";
  return {
    id: input.id,
    label: input.label,
    valueText: input.valueText,
    unknown: input.unknown,
    tierText,
    sourceName: input.provenance ? authoredFr(input.provenance.sourceName, lang) : lang === "fr" ? "Aucune source" : "No source",
    sourceDate: input.provenance?.sourceDate ?? unknownLabel(lang),
    recordDate: input.provenance?.recordDate ?? unknownLabel(lang),
    licence: input.provenance ? authoredFr(input.provenance.licence, lang) : lang === "fr" ? "Aucune licence" : "No licence",
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
    { id, label: label(id, lang), valueText, unknown, provenance, photoSlotIds, layer, englishFragments },
    lang,
    today,
  );
}

function ruleRow(place: PlaceRecord, id: string, valueText: string, lang: Lang, today: string): FieldRowView {
  return rowFrom(
    place,
    {
      id,
      label: label(id, lang),
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
      lang === "fr"
        ? "Pas de statut unique accessible ou non. Chaque champ est un fait, un inconnu, ou sans objet."
        : "No single accessible or not-accessible status. Each field is a fact, an unknown, or not applicable.",
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
          text: place.parking.bays.map((bay) => `${bay.name}: ${labelOf(`bay.${bay.kind}`, lang)}`).join("; "),
          unknown: false,
        };
  const vanSummary =
    place.parking.bays.length === 0
      ? { text: u, unknown: true }
      : {
          text: place.parking.bays.map((bay) => `${bay.name}: ${vanLiftText(vanLiftReading(bay), lang)}`).join(" "),
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
      : lang === "fr"
        ? `${place.chargingPoints.length} fiche de point de recharge est liée. Voir la section recharge.`
        : `${place.chargingPoints.length} charging-point record is linked. See the charging section.`);
  const repairSummary =
    place.transport.repairSupplySummary.value ??
    (place.linkedRepairerIds.length + place.linkedSupplyStoreIds.length === 0
      ? null
      : lang === "fr"
        ? "Des fiches d'annuaire sont liées. Voir réparation et fournitures."
        : "Directory records are linked. See repair and supply.");
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
      lang === "fr"
        ? `${place.photos.length} emplacements, ${described} décrits, ${empty} vides.`
        : `${place.photos.length} slots, ${described} described, ${empty} empty.`,
      lang,
      today,
    ),
    ruleRow(
      place,
      "trust.correction-path",
      lang === "fr"
        ? "Le formulaire de correction est sur cette page. Un signalement en attente ne modifie pas la fiche. La modération ne tourne pas dans ce prototype."
        : "The correction form is on this page. A pending report does not change the record. Moderation is not running in this prototype.",
      lang,
      today,
    ),
    ruleRow(
      place,
      "trust.dispute-path",
      lang === "fr"
        ? "Un lieu peut proposer une correction avec une preuve. Rien n'est écrasé en silence. Ce prototype ne tranche pas les contestations."
        : "A venue can submit a correction with evidence. Nothing is overwritten silently. This prototype does not decide disputes.",
      lang,
      today,
    ),
    ruleRow(
      place,
      "trust.peer-tips",
      place.peerTips.length === 0
        ? lang === "fr"
          ? "Aucune note de pair au dossier. Une note de pair n'est pas un fait."
          : "No peer tip is on file. A peer tip is not a fact."
        : lang === "fr"
          ? `${place.peerTips.length} note de pair, séparée des faits.`
          : `${place.peerTips.length} peer tip, kept separate from facts.`,
      lang,
      today,
    ),
    ruleRow(
      place,
      "trust.bilingual",
      lang === "fr"
        ? "L'interface est en français et en anglais. Les mesures ne sont pas traduites automatiquement. Le nom français n'existe que s'il est écrit dans la fiche."
        : "The interface is in English and French. Measurements are not machine-translated. A French name exists only when the record has one.",
      lang,
      today,
    ),
  ];

  const sections: SectionView[] = [
    {
      id: "getting-there",
      heading: lang === "fr" ? "S'y rendre" : "Getting there",
      intro:
        lang === "fr"
          ? "Arrêt, dépose et approche. Une distance à vol d'oiseau n'est pas un chemin."
          : "Stop, drop-off, and approach. A straight-line distance is not a route.",
      rows: [transportRows[0], parkingRows[5], parkingRows[6], parkingRows[7]].filter((row): row is FieldRowView => row !== undefined),
    },
    {
      id: "entrance",
      heading: lang === "fr" ? "Entrée" : "Entrance",
      intro: null,
      rows: entranceRows,
    },
    {
      id: "inside",
      heading: lang === "fr" ? "À l'intérieur" : "Inside",
      intro: null,
      rows: [interiorRows[0], interiorRows[6]].filter((row): row is FieldRowView => row !== undefined),
    },
    {
      id: "washrooms",
      heading: lang === "fr" ? "Toilettes" : "Washrooms",
      intro:
        place.washrooms.length === 0
          ? lang === "fr"
            ? "Aucune fiche de toilettes n'est liée. Ce n'est pas une affirmation qu'il n'y a pas de toilettes."
            : "No washroom record is linked. That is not a statement that no washroom exists."
          : lang === "fr"
            ? "Chaque toilette est une fiche. Le résumé ne remplace pas les mesures."
            : "Each washroom is its own record. A summary does not replace the measurements.",
      rows: place.washrooms.length === 0 ? projectWashroom(place, emptyWashroomPlaceholder(), lang, today).rows : [],
    },
    {
      id: "parking",
      heading: lang === "fr" ? "Stationnement" : "Parking",
      intro:
        lang === "fr"
          ? "Le type de place et le privilège municipal sont séparés. Aucune disponibilité en direct n'est affichée."
          : "Bay type and the municipal privilege are separate. No live availability is shown.",
      rows: parkingRows,
    },
    {
      id: "seating",
      heading: lang === "fr" ? "Sièges et comptoirs" : "Seating and counters",
      intro: null,
      rows: [interiorRows[1], interiorRows[2]].filter((row): row is FieldRowView => row !== undefined),
    },
    {
      id: "policies",
      heading: lang === "fr" ? "Politiques" : "Policies",
      intro:
        lang === "fr"
          ? "Une politique est citée seulement si la fiche a un texte. L'application ne donne pas de conseil d'admissibilité."
          : "A policy is quoted only when the record has text. The application does not give eligibility advice.",
      rows: [interiorRows[3], interiorRows[4], interiorRows[5], transportRows[2]].filter((row): row is FieldRowView => row !== undefined),
    },
    {
      id: "charging",
      heading: lang === "fr" ? "Recharge" : "Charging",
      intro: transportRows[3]?.valueText ?? null,
      rows: transportRows[3] ? [transportRows[3]] : [],
    },
    {
      id: "repair",
      heading: lang === "fr" ? "Réparation et fournitures" : "Repair and supply",
      intro: transportRows[4]?.valueText ?? null,
      rows: transportRows[4] ? [transportRows[4]] : [],
    },
    {
      id: "photos",
      heading: lang === "fr" ? "Photographies" : "Photos",
      intro:
        lang === "fr"
          ? "Une photo sans date ou sans description d'accès n'est pas une preuve."
          : "A photograph without a date or an access description is not evidence.",
      rows: trustRows[3] ? [trustRows[3]] : [],
    },
    {
      id: "reports",
      heading: lang === "fr" ? "Signalements" : "Reports",
      intro: null,
      rows: trustRows.filter((row) => row.id === "trust.correction-path" || row.id === "trust.dispute-path" || row.id === "trust.peer-tips"),
    },
    {
      id: "trust",
      heading: lang === "fr" ? "Source et fraîcheur" : "Source and freshness",
      intro: null,
      rows: trustRows.filter((row) => row.id === "trust.tier" || row.id === "trust.last-verified" || row.id === "trust.source" || row.id === "trust.bilingual"),
    },
  ];

  if (place.trail) {
    sections.push({
      id: "trail",
      heading: lang === "fr" ? "Sentier" : "Trail",
      intro:
        lang === "fr"
          ? "Champs du modèle sentier. Ils ne s'affichent pas sur un café."
          : "Trail-template fields. They are not shown on a café.",
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
    heading: lang === "fr" ? "Identité" : "Identity",
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
    sourceLine:
      lang === "fr"
        ? `Source : ${authoredFr(place.recordProvenance.sourceName, lang)}. Date de source : ${place.recordProvenance.sourceDate}. Date de fiche : ${place.recordProvenance.recordDate}. ${authoredFr(place.recordProvenance.licence, lang)}`
        : `Source: ${place.recordProvenance.sourceName}. Source date: ${place.recordProvenance.sourceDate}. Record date: ${place.recordProvenance.recordDate}. ${place.recordProvenance.licence}`,
    depthStatement:
      place.depth === "skeleton"
        ? lang === "fr"
          ? `Graine incomplète pour ${place.identity.municipality}. Faits présents : le nom et la municipalité. Les mesures d'entrée, de toilettes, de stationnement, de recharge et de réparation sont absentes de cette graine.`
          : `Skeleton seed for ${place.identity.municipality}. Facts present: the name and the municipality. Entrance, washroom, parking, charging, and repair measurements are absent from this seed.`
        : null,
    sections: [identitySection, ...sections],
    washrooms: place.washrooms.map((washroom) => projectWashroom(place, washroom, lang, today)),
    bays: place.parking.bays.map((bay) => projectBay(place, bay, lang, today, month)),
    charging: place.chargingPoints.map((point) => projectCharging(place, point, lang, today)),
    repairers,
    supplyStores,
    peerTips: place.peerTips.map((tip) => ({
      text:
        lang === "fr"
          ? `Note de pair du ${tip.date}, non modérée, pas un fait : ${tip.body}`
          : `Peer tip dated ${tip.date}, not moderated, not a fact: ${tip.body}`,
      englishFragments: keptEnglish([tip.body], lang),
    })),
  };
}

function emptyWashroomPlaceholder(): Washroom {
  return {
    id: "none",
    name: "No washroom record",
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
    ? `${formatDoor(washroom.door.value, lang)}. ${lang === "fr" ? "Largeur libre" : "Clear width"}: ${formatMm(washroom.doorClearWidthMm.value, lang)}`
    : formatMm(washroom.doorClearWidthMm.value, lang);
  const doorUnknown = washroom.door.value === null && washroom.doorClearWidthMm.value === null;
  const access = washroom.accessPolicy.value;
  const accessText = access
    ? [labelOf(`access.${access.method}`, lang), access.howToObtain ?? u, access.phone ?? u].join(". ")
    : u;
  const hours = washroom.hoursReliability.value;
  const hoursText = hours
    ? [hours.hoursText ?? u, hours.outOfOrderNote ?? (lang === "fr" ? "Note de panne : inconnue" : "Out-of-order note: unknown"), hours.lastReportNote ?? (lang === "fr" ? "Dernier signalement : inconnu" : "Last report: unknown")].join(". ")
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
    genderText: lang === "fr" ? `Genre enregistré : ${gender}` : `Recorded gender: ${gender}`,
    attendantText:
      washroom.attendantAccessNote ??
      (lang === "fr" ? "Accès accompagnateur : Inconnu" : "Attendant access: Unknown"),
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
  rows[0]!.label = lang === "fr" ? "Largeur de la place" : "Bay width";
  rows[1]!.label = lang === "fr" ? "Largeur de l'allée" : "Aisle width";
  rows[2]!.label = lang === "fr" ? "Distance jusqu'à l'entrée" : "Distance to the entrance";
  rows[3]!.label = lang === "fr" ? "Déneigement" : "Snow clearance";
  rows[4]!.label = lang === "fr" ? "Chemin sans marche" : "Step-free route";
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
    [lang === "fr" ? "Emplacement" : "Location", point.locationNote.value ?? unknownLabel(lang), point.locationNote.value === null, point.locationNote.provenance, point.locationNote.photoSlotIds],
    [lang === "fr" ? "Type de prise" : "Outlet type", point.outletType.value ?? unknownLabel(lang), point.outletType.value === null, point.outletType.provenance, point.outletType.photoSlotIds],
    [lang === "fr" ? "Nombre de prises" : "Outlet count", point.outletCount.value === null ? unknownLabel(lang) : String(point.outletCount.value), point.outletCount.value === null, point.outletCount.provenance, point.outletCount.photoSlotIds],
    [lang === "fr" ? "Accès" : "Access method", point.accessMethod.value ? labelOf(`access.${point.accessMethod.value}`, lang) : unknownLabel(lang), point.accessMethod.value === null, point.accessMethod.provenance, point.accessMethod.photoSlotIds],
    [lang === "fr" ? "Contact pour permission" : "Permission contact", point.permissionContact.value ?? unknownLabel(lang), point.permissionContact.value === null, point.permissionContact.provenance, point.permissionContact.photoSlotIds],
    [lang === "fr" ? "Siège en attendant" : "Seating while charging", formatYesNo(point.seating.value, lang), point.seating.value === null, point.seating.provenance, point.seating.photoSlotIds],
    [lang === "fr" ? "Intérieur ou extérieur" : "Indoor or outdoor", point.setting.value ? labelOf(`setting.${point.setting.value}`, lang) : unknownLabel(lang), point.setting.value === null, point.setting.provenance, point.setting.photoSlotIds],
    [lang === "fr" ? "Heures" : "Hours", point.hoursText.value ?? unknownLabel(lang), point.hoursText.value === null, point.hoursText.provenance, point.hoursText.photoSlotIds],
    [lang === "fr" ? "Coût" : "Cost", point.cost.value ?? unknownLabel(lang), point.cost.value === null, point.cost.provenance, point.cost.photoSlotIds],
    [lang === "fr" ? "Chemin sans marche" : "Step-free route", formatYesNo(point.stepFreeRoute.value, lang), point.stepFreeRoute.value === null, point.stepFreeRoute.provenance, point.stepFreeRoute.photoSlotIds],
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
  const services =
    repairer.servicesPublished.length === 0
      ? lang === "fr"
        ? "Aucune liste de services publiée dans cette fiche."
        : "No published service list is in this record."
      : repairer.servicesPublished.map((service) => labelOf(`repair.${service}`, lang)).join(", ");
  return {
    id: repairer.id,
    heading: lang === "fr" && repairer.nameFr ? repairer.nameFr : repairer.name,
    lines: [
      lang === "fr" ? repairer.honestyNoteFr : repairer.honestyNote,
      lang === "fr" ? `Services publiés : ${services}` : `Published services: ${services}`,
      lang === "fr"
        ? `Couverture : ${repairer.coverageNote ?? "Inconnu"}`
        : `Coverage: ${repairer.coverageNote ?? "Unknown"}`,
      lang === "fr"
        ? `Rayon mobile : ${repairer.mobileRadiusKm === null ? "Inconnu" : `${repairer.mobileRadiusKm} km`}`
        : `Mobile radius: ${repairer.mobileRadiusKm === null ? "Unknown" : `${repairer.mobileRadiusKm} km`}`,
      lang === "fr" ? `Heures : ${repairer.hoursText ?? "Inconnu"}` : `Hours: ${repairer.hoursText ?? "Unknown"}`,
      lang === "fr" ? `Téléphone : ${repairer.phone ?? "Inconnu"}` : `Phone: ${repairer.phone ?? "Unknown"}`,
      lang === "fr" ? `Site : ${repairer.website ?? "Inconnu"}` : `Website: ${repairer.website ?? "Unknown"}`,
      `${authoredFr(repairer.provenance.sourceName, lang)}. ${repairer.provenance.sourceDate}. ${authoredFr(repairer.provenance.licence, lang)}`,
    ],
    englishFragments: keptEnglish([repairer.coverageNote, repairer.hoursText, repairer.nameFr ? null : repairer.name], lang),
  };
}

function projectSupply(store: SupplyStore, lang: Lang): DirectoryCardView {
  const categories =
    store.categoriesPublished.length === 0
      ? lang === "fr"
        ? "Aucune catégorie publiée dans cette fiche."
        : "No published category is in this record."
      : store.categoriesPublished.map((category) => labelOf(`supply.${category}`, lang)).join(", ");
  const delivery =
    store.delivery === null ? (lang === "fr" ? "Inconnu" : "Unknown") : store.delivery === "yes" ? (lang === "fr" ? "Oui" : "Yes") : lang === "fr" ? "Non" : "No";
  return {
    id: store.id,
    heading: lang === "fr" && store.nameFr ? store.nameFr : store.name,
    lines: [
      lang === "fr" ? store.honestyNoteFr : store.honestyNote,
      lang === "fr" ? `Catégories publiées : ${categories}` : `Published categories: ${categories}`,
      lang === "fr"
        ? "Une catégorie n'est pas un stock d'un produit précis."
        : "A category is not stock of a specific product.",
      lang === "fr" ? `Heures : ${store.hoursText ?? "Inconnu"}` : `Hours: ${store.hoursText ?? "Unknown"}`,
      lang === "fr" ? `Livraison : ${delivery}` : `Delivery: ${delivery}`,
      lang === "fr" ? `Téléphone : ${store.phone ?? "Inconnu"}` : `Phone: ${store.phone ?? "Unknown"}`,
      `${authoredFr(store.provenance.sourceName, lang)}. ${store.provenance.sourceDate}. ${authoredFr(store.provenance.licence, lang)}`,
    ],
    englishFragments: keptEnglish([store.hoursText, store.nameFr ? null : store.name], lang),
  };
}

export function correctableFields(place: PlaceRecord, lang: Lang): Array<{ id: string; label: string; group: string }> {
  const fields: Array<{ id: string; label: string; group: string }> = [];
  const add = (id: string, group: string) => fields.push({ id, label: label(id, lang), group });
  for (const id of IDENTITY_IDS) add(id, lang === "fr" ? "Identité" : "Identity");
  for (const id of DAY3_EXTRA_IDS) add(id, lang === "fr" ? "Entrée" : "Entrance");
  for (const id of ENTRANCE_IDS) add(id, lang === "fr" ? "Entrée" : "Entrance");
  for (const id of INTERIOR_IDS) add(id, lang === "fr" ? "Intérieur" : "Inside");
  for (const id of PARKING_IDS) add(id, lang === "fr" ? "Stationnement" : "Parking");
  for (const id of TRANSPORT_IDS) add(id, lang === "fr" ? "Transport" : "Transport");
  for (const washroom of place.washrooms) {
    for (const id of WASHROOM_IDS) {
      fields.push({
        id: `washroom:${washroom.id}:${id}`,
        label: `${washroom.name} — ${label(id, lang)}`,
        group: lang === "fr" ? "Toilettes" : "Washrooms",
      });
    }
  }
  if (place.trail) {
    for (const id of ["trail.surface", "trail.grade", "trail.width-mm", "trail.obstacles", "trail.rest"]) {
      add(id, lang === "fr" ? "Sentier" : "Trail");
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
