import { evidenceComplete } from "./evidence.js";
import type { ChargingPoint, DatasetStatus, Lang, ParkingBay, PlaceRecord, Provenance, Washroom } from "./types.js";

/**
 * A filled fixture is still not a recommendation.
 * "measured" is reserved for an access-maps record whose critical fields are peer or surveyor tier.
 * The UI must not shorten that to "usable".
 */
export type UseLabel = "not-a-recommendation" | "peer-or-surveyor-measurements";

function strong(provenance: Provenance | null, dataset: DatasetStatus): boolean {
  if (dataset !== "access-maps" || !provenance) return false;
  if (provenance.tier === 2) return true;
  if (provenance.tier === 3) return evidenceComplete(provenance.evidence);
  return false;
}

export function washroomUseLabel(dataset: DatasetStatus, washroom: Washroom): UseLabel {
  const door = washroom.doorClearWidthMm;
  const turning = washroom.turningDiameterMm;
  const transfer = washroom.transfer;
  const criticalKnown = door.value !== null && turning.value !== null && transfer.value !== null;
  const allStrong =
    strong(door.provenance, dataset) && strong(turning.provenance, dataset) && strong(transfer.provenance, dataset);
  return criticalKnown && allStrong ? "peer-or-surveyor-measurements" : "not-a-recommendation";
}

export function useLabelText(label: UseLabel, lang: Lang): string {
  if (label === "peer-or-surveyor-measurements") {
    return lang === "fr"
      ? "Mesures de pair ou d'enquêteur au dossier. Vérifiez la date. Ce n'est pas une garantie."
      : "Peer or surveyor measurements are on file. Check the date. This is not a guarantee.";
  }
  return lang === "fr"
    ? "Non vérifié — appelez avant d'y aller. Cette fiche n'est pas une recommandation."
    : "Unverified — call ahead. This record is not a recommendation.";
}

export function chargingUseLabel(dataset: DatasetStatus, point: ChargingPoint): UseLabel {
  const known = point.accessMethod.value !== null && point.locationNote.value !== null;
  const allStrong = strong(point.accessMethod.provenance, dataset) && strong(point.locationNote.provenance, dataset);
  return known && allStrong ? "peer-or-surveyor-measurements" : "not-a-recommendation";
}

export type VanLiftReading = "aisle-recorded" | "no-deployment-space" | "unknown" | "drop-off";

export function vanLiftReading(bay: ParkingBay): VanLiftReading {
  if (bay.kind === "drop-off") return "drop-off";
  if (bay.kind === "unverified") return "unknown";
  if (bay.kind === "type-b-standard") return "no-deployment-space";
  if (bay.widthMm.value === null || bay.aisleWidthMm.value === null) return "unknown";
  return "aisle-recorded";
}

export function vanLiftText(reading: VanLiftReading, lang: Lang): string {
  switch (reading) {
    case "aisle-recorded":
      return lang === "fr"
        ? "Une allée et une largeur sont enregistrées pour cette place de type A. Cela ne dit pas que votre hayon passe."
        : "An aisle and a width are recorded for this Type A bay. That does not say your lift will fit.";
    case "no-deployment-space":
      return lang === "fr"
        ? "Place de type B. Aucun espace de déploiement de hayon latéral n'est enregistré."
        : "Type B bay. No side-lift deployment space is recorded.";
    case "drop-off":
      return lang === "fr"
        ? "Point de dépose, pas une place de stationnement."
        : "Drop-off point, not a parking bay.";
    case "unknown":
      return lang === "fr" ? "Espace de hayon inconnu." : "Lift space is unknown.";
    default:
      return lang === "fr" ? "Inconnu" : "Unknown";
  }
}

export function privilegeText(bay: ParkingBay, lang: Lang): string {
  const privilege = bay.privilege;
  const complete = Boolean(
    privilege.municipality && privilege.bylaw && privilege.statement && privilege.checkedOn,
  );
  if (!complete) {
    return lang === "fr"
      ? "Privilège de stationnement inconnu. Cette fiche ne dit pas que le stationnement est gratuit ou illimité."
      : "Parking privilege is unknown. This record does not say that parking is free or unlimited.";
  }
  const page = privilege.page ? `, ${privilege.page}` : "";
  return lang === "fr"
    ? `${privilege.municipality} — ${privilege.bylaw}${page}, vérifié le ${privilege.checkedOn} : ${privilege.statement}`
    : `${privilege.municipality} — ${privilege.bylaw}${page}, checked ${privilege.checkedOn}: ${privilege.statement}`;
}

/**
 * The user's own tested range, compared with a straight-line distance.
 * Never a generic chair range, and never a statement that a route is within range.
 */
export function rangeNote(distanceMetres: number | null, userTestedRangeMetres: number | null, lang: Lang): string | null {
  if (userTestedRangeMetres === null) return null;
  const distance = distanceMetres === null ? (lang === "fr" ? "inconnue" : "unknown") : String(distanceMetres);
  return lang === "fr"
    ? `Vous avez saisi une autonomie essayée de ${userTestedRangeMetres} m. La distance à vol d'oiseau est ${distance} m. Ce n'est pas une garantie. L'application n'utilise pas d'autonomie générique de fauteuil.`
    : `You entered a tested range of ${userTestedRangeMetres} m. The straight-line distance is ${distance} m. This is not a guarantee. The application does not use a generic chair range.`;
}

export function transferSideMatches(side: "left" | "right" | "both" | null, needed: "left" | "right" | "both"): boolean {
  if (side === null) return false;
  if (needed === "both") return side === "both";
  return side === needed || side === "both";
}

export function placeHasAdultChangeTable(place: PlaceRecord): boolean {
  return place.washrooms.some((washroom) => washroom.changeTable.value?.present === "yes");
}

export function placeHasHoist(place: PlaceRecord): boolean {
  return place.washrooms.some((washroom) => washroom.hoist.value?.present === "yes");
}

export function placeHasVanBay(place: PlaceRecord): boolean {
  return place.parking.bays.some((bay) => vanLiftReading(bay) === "aisle-recorded");
}

export function placeHasStepFreeEntrance(place: PlaceRecord): boolean {
  return place.entrance.stepFree.value === "yes";
}

export const AVAILABILITY_DISCLAIMER = {
  en: "This list does not show whether a bay is free right now. No live availability feed is connected.",
  fr: "Cette liste ne dit pas si une place est libre maintenant. Aucun flux de disponibilité en direct n'est branché.",
} as const;

export const REPAIR_DISCLAIMER = {
  en: "The application lists services a record publishes. It does not recommend a repairer, a product, or a repair. It does not promise funding. It does not give medical or supply advice.",
  fr: "L'application liste les services publiés dans la fiche. Elle ne recommande ni réparateur, ni produit, ni réparation. Elle ne promet pas de financement. Elle ne donne pas de conseil médical ni de conseil sur les fournitures.",
} as const;

export const SUPPLY_STOCK_NOTE = {
  en: "A published category is not a statement that a specific product is in stock. Call the store to check stock.",
  fr: "Une catégorie publiée ne dit pas qu'un produit précis est en stock. Appelez le magasin pour vérifier le stock.",
} as const;

export const PROTOTYPE_NOTICE = {
  en: "PROTOTYPE-UNVERIFIED. This screen is a prototype. Unknown means unknown. A labelled fixture is not a real place and not a verified visit.",
  fr: "PROTOTYPE-UNVERIFIED. Cet écran est un prototype. Inconnu veut dire inconnu. Un jeu d'essai étiqueté n'est pas un lieu réel ni une visite vérifiée.",
} as const;
