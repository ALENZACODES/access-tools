import { copy, labelOf, type CopyKey } from "./i18n.js";
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
  return copy("value.unknown", lang);
}

export function notApplicableLabel(lang: Lang): string {
  return copy("value.not-applicable", lang);
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
  return value === "yes" ? copy("value.yes", lang) : copy("value.no", lang);
}

function part(label: string, value: string, lang: Lang): string {
  return `${label}${copy("sep.colon", lang)}${value}`;
}

function named(key: CopyKey, value: string, lang: Lang): string {
  return part(copy(key, lang), value, lang);
}

export function formatDoor(door: DoorFact | null, lang: Lang): string {
  if (!door) return unknownLabel(lang);
  const u = unknownLabel(lang);
  const operator = door.operator === null ? u : labelOf(`door.operator.${door.operator}`, lang);
  const swing = door.swing === null ? u : labelOf(`door.swing.${door.swing}`, lang);
  const lock = door.lock === null ? u : labelOf(`door.lock.${door.lock}`, lang);
  return [
    named("format.operator", operator, lang),
    named("format.push-plate", formatMm(door.pushPlateHeightMm, lang), lang),
    named("format.force", door.forceNote ?? u, lang),
    named("format.closing-speed", door.closingSpeedNote ?? u, lang),
    named("format.swing", swing, lang),
    named("format.lock", lock, lang),
  ].join(". ");
}

export function formatRampGeometry(ramp: RampGeometry | null, lang: Lang): string {
  if (!ramp) return unknownLabel(lang);
  const u = unknownLabel(lang);
  return [
    named("format.slope", ramp.slopeRatio ?? u, lang),
    named("format.width", formatMm(ramp.widthMm, lang), lang),
    named("format.landing", formatMm(ramp.landingMm, lang), lang),
    named("format.handrails", formatYesNo(ramp.handrails, lang), lang),
    named("format.surface", ramp.surface ?? u, lang),
    named("format.drainage", ramp.drainage ?? u, lang),
  ].join(". ");
}

export function formatRampLength(ramp: RampLengthRise | null, lang: Lang): string {
  if (!ramp) return unknownLabel(lang);
  const u = unknownLabel(lang);
  return [
    named("format.length", formatMm(ramp.lengthMm, lang), lang),
    named("format.rise", formatMm(ramp.riseMm, lang), lang),
    named("format.rest-landings", ramp.restLandings ?? u, lang),
    named("format.wet-winter", ramp.surfaceWetWinter ?? u, lang),
  ].join(". ");
}

export function formatElevator(elevator: ElevatorFact | null, lang: Lang): string {
  if (!elevator) return unknownLabel(lang);
  const u = unknownLabel(lang);
  return [
    named("format.present", formatYesNo(elevator.present, lang), lang),
    named("format.car-width", formatMm(elevator.carWidthMm, lang), lang),
    named("format.car-depth", formatMm(elevator.carDepthMm, lang), lang),
    named("format.door-width", formatMm(elevator.doorWidthMm, lang), lang),
    named("format.control-height", formatMm(elevator.controlHeightMm, lang), lang),
    named("format.signals", elevator.signals ?? u, lang),
  ].join(". ");
}

export function formatTransfer(transfer: TransferFact | null, lang: Lang): string {
  if (!transfer) return unknownLabel(lang);
  const side =
    transfer.side === "left"
      ? copy("transfer.side.left", lang)
      : transfer.side === "right"
        ? copy("transfer.side.right", lang)
        : copy("transfer.side.both", lang);
  return [
    named("format.side", side, lang),
    named("format.clear-floor", formatMm(transfer.clearFloorBesideMm, lang), lang),
  ].join(". ");
}

export function formatGrabBars(bars: GrabBarFact | null, lang: Lang): string {
  if (!bars) return unknownLabel(lang);
  const u = unknownLabel(lang);
  return [
    named("format.configuration", bars.configuration ?? u, lang),
    named("format.side", bars.side ?? u, lang),
    named("format.height", formatMm(bars.heightMm, lang), lang),
    named("format.length", formatMm(bars.lengthMm, lang), lang),
    named("format.sturdiness", bars.sturdinessNote ?? u, lang),
  ].join(". ");
}

export function formatSink(sink: SinkFact | null, lang: Lang): string {
  if (!sink) return unknownLabel(lang);
  const u = unknownLabel(lang);
  return [
    named("format.sink-height", formatMm(sink.heightMm, lang), lang),
    named("format.knee-depth", formatMm(sink.kneeClearanceDepthMm, lang), lang),
    named("format.knee-height", formatMm(sink.kneeClearanceHeightMm, lang), lang),
    named("format.tap", sink.tap ?? u, lang),
    named("format.mirror-height", formatMm(sink.mirrorHeightMm, lang), lang),
  ].join(". ");
}

export function formatCord(cord: EmergencyCordFact | null, lang: Lang): string {
  if (!cord) return unknownLabel(lang);
  const working =
    cord.working === "not-tested" || cord.working === null
      ? cord.working === "not-tested"
        ? copy("format.cord.not-tested", lang)
        : unknownLabel(lang)
      : formatYesNo(cord.working, lang);
  return [
    named("format.present", formatYesNo(cord.present, lang), lang),
    named("format.reaches-floor", formatYesNo(cord.reachesFloor, lang), lang),
    named("format.working", working, lang),
  ].join(". ");
}

export function formatChangeTable(table: ChangeTableFact | null, lang: Lang): string {
  if (!table) return unknownLabel(lang);
  const u = unknownLabel(lang);
  const present = table.present === "yes" ? copy("format.table.present", lang) : copy("format.table.absent", lang);
  return [
    present,
    named("format.length", formatMm(table.lengthMm, lang), lang),
    named("format.width", formatMm(table.widthMm, lang), lang),
    named("format.height-range", table.heightRange ?? u, lang),
    named("format.load", table.loadKg === null ? u : `${table.loadKg} kg`, lang),
    named("format.product-label", table.productLabel ?? u, lang),
  ].join(". ");
}

export function formatHoist(hoist: HoistFact | null, lang: Lang): string {
  if (!hoist) return unknownLabel(lang);
  const u = unknownLabel(lang);
  const present = hoist.present === "yes" ? copy("format.hoist.present", lang) : copy("format.hoist.absent", lang);
  const sling =
    hoist.slingProvided === "yes"
      ? copy("value.yes", lang)
      : hoist.slingProvided === "no"
        ? copy("format.sling.absent", lang)
        : u;
  return [
    present,
    named("format.hoist-type", hoist.type ?? u, lang),
    named("format.working", formatYesNo(hoist.working, lang), lang),
    named("format.sling-policy", hoist.slingPolicy ?? u, lang),
    named("format.sling-provided", sling, lang),
    named("format.operator-availability", hoist.operatorAvailability ?? u, lang),
    named("format.weight-capacity", hoist.weightCapacityKg === null ? u : `${hoist.weightCapacityKg} kg`, lang),
  ].join(". ");
}

export function joinKnown(parts: Array<string | null>, lang: Lang): string {
  const kept = parts.filter((part): part is string => part !== null && part.length > 0);
  if (kept.length === 0) return unknownLabel(lang);
  return kept.join(". ");
}
