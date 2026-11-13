import { labelOf } from "./i18n.js";
import type { Lang } from "./types.js";
import type {
  ChangeTableFact,
  DoorFact,
  ElevatorFact,
  EmergencyCordFact,
  GrabBarFact,
  HoistFact,
  RampGeometry,
  RampLengthRise,
  SinkFact,
  TransferFact,
} from "./types.js";

export function unknownLabel(lang: Lang): string {
  return lang === "fr" ? "Inconnu" : "Unknown";
}

export function notApplicableLabel(lang: Lang): string {
  return lang === "fr" ? "Sans objet" : "Not applicable";
}

export function formatMm(mm: number | null, lang: Lang): string {
  if (mm === null || Number.isNaN(mm)) return unknownLabel(lang);
  const inches = (Math.round((mm / 25.4) * 10) / 10).toFixed(1);
  return `${mm} mm (${inches} in)`;
}

export function formatMetres(m: number | null, lang: Lang): string {
  if (m === null || Number.isNaN(m)) return unknownLabel(lang);
  return `${m} m`;
}

export function formatYesNo(value: "yes" | "no" | null, lang: Lang): string {
  if (value === null) return unknownLabel(lang);
  if (lang === "fr") return value === "yes" ? "Oui" : "Non";
  return value === "yes" ? "Yes" : "No";
}

function part(label: string, value: string): string {
  return `${label}: ${value}`;
}

export function formatDoor(door: DoorFact | null, lang: Lang): string {
  if (!door) return unknownLabel(lang);
  const u = unknownLabel(lang);
  const operator = door.operator === null ? u : labelOf(`door.operator.${door.operator}`, lang);
  const swing = door.swing === null ? u : labelOf(`door.swing.${door.swing}`, lang);
  const lock = door.lock === null ? u : labelOf(`door.lock.${door.lock}`, lang);
  return [
    part(lang === "fr" ? "Opérateur" : "Operator", operator),
    part(lang === "fr" ? "Hauteur de la plaque" : "Push-plate height", formatMm(door.pushPlateHeightMm, lang)),
    part(lang === "fr" ? "Force" : "Force", door.forceNote ?? u),
    part(lang === "fr" ? "Vitesse de fermeture" : "Closing speed", door.closingSpeedNote ?? u),
    part(lang === "fr" ? "Sens" : "Swing", swing),
    part(lang === "fr" ? "Verrou" : "Lock", lock),
  ].join(". ");
}

export function formatRampGeometry(ramp: RampGeometry | null, lang: Lang): string {
  if (!ramp) return unknownLabel(lang);
  const u = unknownLabel(lang);
  return [
    part(lang === "fr" ? "Pente" : "Slope", ramp.slopeRatio ?? u),
    part(lang === "fr" ? "Largeur" : "Width", formatMm(ramp.widthMm, lang)),
    part(lang === "fr" ? "Palier" : "Landing", formatMm(ramp.landingMm, lang)),
    part(lang === "fr" ? "Mains courantes" : "Handrails", formatYesNo(ramp.handrails, lang)),
    part(lang === "fr" ? "Surface" : "Surface", ramp.surface ?? u),
    part(lang === "fr" ? "Drainage" : "Drainage", ramp.drainage ?? u),
  ].join(". ");
}

export function formatRampLength(ramp: RampLengthRise | null, lang: Lang): string {
  if (!ramp) return unknownLabel(lang);
  const u = unknownLabel(lang);
  return [
    part(lang === "fr" ? "Longueur" : "Length", formatMm(ramp.lengthMm, lang)),
    part(lang === "fr" ? "Dénivelé" : "Rise", formatMm(ramp.riseMm, lang)),
    part(lang === "fr" ? "Paliers de repos" : "Rest landings", ramp.restLandings ?? u),
    part(lang === "fr" ? "Surface mouillée et hiver" : "Wet and winter surface", ramp.surfaceWetWinter ?? u),
  ].join(". ");
}

export function formatElevator(elevator: ElevatorFact | null, lang: Lang): string {
  if (!elevator) return unknownLabel(lang);
  const u = unknownLabel(lang);
  return [
    part(lang === "fr" ? "Présent" : "Present", formatYesNo(elevator.present, lang)),
    part(lang === "fr" ? "Largeur de cabine" : "Car width", formatMm(elevator.carWidthMm, lang)),
    part(lang === "fr" ? "Profondeur de cabine" : "Car depth", formatMm(elevator.carDepthMm, lang)),
    part(lang === "fr" ? "Largeur de porte" : "Door width", formatMm(elevator.doorWidthMm, lang)),
    part(lang === "fr" ? "Hauteur des commandes" : "Control height", formatMm(elevator.controlHeightMm, lang)),
    part(lang === "fr" ? "Signaux" : "Signals", elevator.signals ?? u),
  ].join(". ");
}

export function formatTransfer(transfer: TransferFact | null, lang: Lang): string {
  if (!transfer) return unknownLabel(lang);
  const side =
    lang === "fr"
      ? transfer.side === "left"
        ? "gauche"
        : transfer.side === "right"
          ? "droite"
          : "les deux"
      : transfer.side;
  return [
    part(lang === "fr" ? "Côté" : "Side", side),
    part(lang === "fr" ? "Dégagement au sol" : "Clear floor beside the toilet", formatMm(transfer.clearFloorBesideMm, lang)),
  ].join(". ");
}

export function formatGrabBars(bars: GrabBarFact | null, lang: Lang): string {
  if (!bars) return unknownLabel(lang);
  const u = unknownLabel(lang);
  return [
    part(lang === "fr" ? "Configuration" : "Configuration", bars.configuration ?? u),
    part(lang === "fr" ? "Côté" : "Side", bars.side ?? u),
    part(lang === "fr" ? "Hauteur" : "Height", formatMm(bars.heightMm, lang)),
    part(lang === "fr" ? "Longueur" : "Length", formatMm(bars.lengthMm, lang)),
    part(lang === "fr" ? "Solidité" : "Sturdiness", bars.sturdinessNote ?? u),
  ].join(". ");
}

export function formatSink(sink: SinkFact | null, lang: Lang): string {
  if (!sink) return unknownLabel(lang);
  const u = unknownLabel(lang);
  return [
    part(lang === "fr" ? "Hauteur du lavabo" : "Sink height", formatMm(sink.heightMm, lang)),
    part(lang === "fr" ? "Profondeur du dégagement" : "Knee clearance depth", formatMm(sink.kneeClearanceDepthMm, lang)),
    part(lang === "fr" ? "Hauteur du dégagement" : "Knee clearance height", formatMm(sink.kneeClearanceHeightMm, lang)),
    part(lang === "fr" ? "Robinet" : "Tap", sink.tap ?? u),
    part(lang === "fr" ? "Hauteur du miroir" : "Mirror height", formatMm(sink.mirrorHeightMm, lang)),
  ].join(". ");
}

export function formatCord(cord: EmergencyCordFact | null, lang: Lang): string {
  if (!cord) return unknownLabel(lang);
  const working =
    cord.working === "not-tested"
      ? lang === "fr"
        ? "Non testé. L'application ne déclenche pas les alarmes."
        : "Not tested. The application does not activate emergency alarms."
      : formatYesNo(cord.working, lang);
  return [
    part(lang === "fr" ? "Présent" : "Present", formatYesNo(cord.present, lang)),
    part(lang === "fr" ? "Descend au sol" : "Reaches the floor", formatYesNo(cord.reachesFloor, lang)),
    part(lang === "fr" ? "Fonctionnement" : "Working", working),
  ].join(". ");
}

export function formatChangeTable(table: ChangeTableFact | null, lang: Lang): string {
  if (!table) return unknownLabel(lang);
  const u = unknownLabel(lang);
  const present =
    table.present === "yes"
      ? lang === "fr"
        ? "Table de change adulte enregistrée comme présente"
        : "Adult change table recorded as present"
      : lang === "fr"
        ? "Aucune table de change adulte enregistrée"
        : "No adult change table recorded";
  return [
    present,
    part(lang === "fr" ? "Longueur" : "Length", formatMm(table.lengthMm, lang)),
    part(lang === "fr" ? "Largeur" : "Width", formatMm(table.widthMm, lang)),
    part(lang === "fr" ? "Plage de hauteur" : "Height range", table.heightRange ?? u),
    part(lang === "fr" ? "Charge" : "Load", table.loadKg === null ? u : `${table.loadKg} kg`),
    part(lang === "fr" ? "Étiquette produit" : "Product label", table.productLabel ?? u),
  ].join(". ");
}

export function formatHoist(hoist: HoistFact | null, lang: Lang): string {
  if (!hoist) return unknownLabel(lang);
  const u = unknownLabel(lang);
  const present =
    hoist.present === "yes"
      ? lang === "fr"
        ? "Lève-personne enregistré comme présent"
        : "Hoist recorded as present"
      : lang === "fr"
        ? "Aucun lève-personne enregistré"
        : "No hoist recorded";
  const sling =
    hoist.slingProvided === "yes"
      ? lang === "fr"
        ? "Oui"
        : "Yes"
      : hoist.slingProvided === "no"
        ? lang === "fr"
          ? "Non. Le harnais n'est pas fourni selon cette fiche."
          : "No. The sling is recorded as not provided."
        : u;
  return [
    present,
    part(lang === "fr" ? "Type" : "Type", hoist.type ?? u),
    part(lang === "fr" ? "Fonctionnement" : "Working", formatYesNo(hoist.working, lang)),
    part(lang === "fr" ? "Politique du harnais" : "Sling policy", hoist.slingPolicy ?? u),
    part(lang === "fr" ? "Harnais fourni" : "Sling provided", sling),
    part(lang === "fr" ? "Opérateur" : "Operator availability", hoist.operatorAvailability ?? u),
    part(lang === "fr" ? "Capacité" : "Weight capacity", hoist.weightCapacityKg === null ? u : `${hoist.weightCapacityKg} kg`),
  ].join(". ");
}

export function joinKnown(parts: Array<string | null>, lang: Lang): string {
  const kept = parts.filter((part): part is string => part !== null && part.length > 0);
  if (kept.length === 0) return unknownLabel(lang);
  return kept.join(". ");
}
