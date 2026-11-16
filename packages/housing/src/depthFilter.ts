import type { DepthRecord, DepthRoom, DepthUnit } from "./depth.js";
import type { Sourced } from "./types.js";

/**
 * Unit-level filters over depth records. Each criterion is evaluated as pass,
 * fail or unknown, and a unit is returned only when every active criterion
 * passes. Unknown never matches a filter.
 */
export interface DepthFilters {
  kind: "" | "dwelling" | "overnight";
  city: string;
  /** Every recorded doorway, including the building entrance, must be at least this wide. */
  minDoorWidthMm: string;
  maxEntranceStepMm: string;
  requireElevator: boolean;
  requireRollInShower: boolean;
  requireHoist: boolean;
  transferSide: "" | "left" | "right";
  minTransferSpaceMm: string;
  maxBedHeightMm: string;
}

export const NO_DEPTH_FILTERS: DepthFilters = {
  kind: "", city: "", minDoorWidthMm: "", maxEntranceStepMm: "", requireElevator: false, requireRollInShower: false,
  requireHoist: false, transferSide: "", minTransferSpaceMm: "", maxBedHeightMm: "",
};

export type Verdict = "pass" | "fail" | "unknown";
export type Criterion = "doorWidth" | "entranceStep" | "elevator" | "bathroom" | "bedroom";

export interface UnitMatch { record: DepthRecord; unit: DepthUnit }
export interface DepthSearch {
  matches: UnitMatch[];
  /** Units left out only because a fact a filter needs is Unknown. */
  excludedForUnknown: number;
  /** Units left out because a recorded fact does not meet a filter. */
  excludedForRecorded: number;
  /** True when a typed number could not be read; such a filter matches nothing. */
  invalidInput: boolean;
}

type Bound = { state: "off" } | { state: "invalid" } | { state: "on"; value: number };

function bound(text: string): Bound {
  const trimmed = text.trim();
  if (trimmed === "") return { state: "off" };
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? { state: "on", value } : { state: "invalid" };
}

function all(verdicts: readonly Verdict[]): Verdict {
  if (verdicts.includes("fail")) return "fail";
  return verdicts.includes("unknown") ? "unknown" : "pass";
}

/** Some room must pass. With no such room recorded, the answer is unknown, not fail. */
function some(verdicts: readonly Verdict[]): Verdict {
  if (verdicts.includes("pass")) return "pass";
  return verdicts.length === 0 || verdicts.includes("unknown") ? "unknown" : "fail";
}

function known<T>(fact: Sourced<T> | undefined, test: (value: T) => boolean): Verdict {
  if (!fact || fact.value === null) return "unknown";
  return test(fact.value) ? "pass" : "fail";
}

function rooms(unit: DepthUnit, type: DepthRoom["roomType"]): DepthRoom[] {
  return unit.rooms.filter((room) => room.roomType === type);
}

export function evaluateUnit(record: DepthRecord, unit: DepthUnit, filters: DepthFilters): Partial<Record<Criterion, Verdict>> {
  const verdicts: Partial<Record<Criterion, Verdict>> = {};
  const door = bound(filters.minDoorWidthMm);
  if (door.state === "on") {
    verdicts.doorWidth = all([
      known(record.building.entranceDoorClearWidthMm, (value) => value >= door.value),
      ...unit.rooms.map((room) => known(room.facts.doorClearWidthMm, (value) => value >= door.value)),
    ]);
  }
  const step = bound(filters.maxEntranceStepMm);
  if (step.state === "on") verdicts.entranceStep = known(record.building.entranceStepHeightMm, (value) => value <= step.value);
  if (filters.requireElevator) verdicts.elevator = known(record.building.elevator, (value) => value === "yes");

  const space = bound(filters.minTransferSpaceMm);
  if (filters.requireRollInShower || filters.transferSide !== "" || space.state === "on") {
    // One bathroom has to satisfy every bathroom filter together.
    verdicts.bathroom = some(rooms(unit, "bathroom").map((room) => all([
      ...(filters.requireRollInShower ? [known(room.facts.rollInShower, (value) => value === "yes")] : []),
      ...(filters.transferSide !== "" ? [known(room.facts.transferSide, (value) => value === filters.transferSide || value === "both")] : []),
      ...(space.state === "on" ? [known(room.facts.transferSpaceMm, (value) => value >= space.value)] : []),
    ])));
  }
  const bed = bound(filters.maxBedHeightMm);
  if (filters.requireHoist || bed.state === "on") {
    verdicts.bedroom = some(rooms(unit, "bedroom").map((room) => all([
      ...(filters.requireHoist ? [known(room.facts.hoist, (value) => value !== "none")] : []),
      ...(bed.state === "on" ? [known(room.facts.bedHeightMm, (value) => value <= bed.value)] : []),
    ])));
  }
  return verdicts;
}

export function searchUnits(records: readonly DepthRecord[], filters: DepthFilters): DepthSearch {
  const result: DepthSearch = { matches: [], excludedForUnknown: 0, excludedForRecorded: 0, invalidInput: false };
  result.invalidInput = [filters.minDoorWidthMm, filters.maxEntranceStepMm, filters.minTransferSpaceMm, filters.maxBedHeightMm]
    .some((text) => bound(text).state === "invalid");
  for (const record of records) {
    if (filters.kind !== "" && record.kind !== filters.kind) continue;
    if (filters.city !== "" && record.city !== filters.city) continue;
    for (const unit of record.units) {
      if (result.invalidInput) continue;
      const verdict = all(Object.values(evaluateUnit(record, unit, filters)));
      if (verdict === "pass") result.matches.push({ record, unit });
      else if (verdict === "unknown") result.excludedForUnknown += 1;
      else result.excludedForRecorded += 1;
    }
  }
  return result;
}
