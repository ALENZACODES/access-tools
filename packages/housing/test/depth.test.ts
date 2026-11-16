import { describe, expect, it } from "vitest";
import { BUILDING_FIELDS, ROOM_FIELDS, assertDepthRecords, completeness, depthRecordErrors } from "../src/depth.js";
import type { DepthRecord } from "../src/depth.js";
import { NO_DEPTH_FILTERS, evaluateUnit, searchUnits } from "../src/depthFilter.js";
import type { DepthFilters } from "../src/depthFilter.js";
import { DEMONSTRATION_DEPTH_RECORDS } from "../src/depthFixtures.js";

const make = (index = 0): DepthRecord => structuredClone(DEMONSTRATION_DEPTH_RECORDS[index]!);
const ids = (filters: Partial<DepthFilters>) => searchUnits(DEMONSTRATION_DEPTH_RECORDS, { ...NO_DEPTH_FILTERS, ...filters }).matches.map((match) => match.unit.id);
const UNIT_A = "demo-depth-dwelling-01-unit-a";
const UNIT_B = "demo-depth-dwelling-01-unit-b";
const ROOM_A = "demo-depth-overnight-01-room-a";
const ROOM_B = "demo-depth-overnight-01-room-b";
const ROOM_E = "demo-depth-overnight-02-room-a";

describe("depth record schema", () => {
  it("accepts the labelled fixtures", () => {
    expect(() => assertDepthRecords(DEMONSTRATION_DEPTH_RECORDS)).not.toThrow();
    for (const record of DEMONSTRATION_DEPTH_RECORDS) {
      expect(record.datasetStatus).toBe("labelled-fixture");
      expect(record.recordProvenance.prototypeLabel).toBe("PROTOTYPE-UNVERIFIED");
      expect(record.id.startsWith("demo-")).toBe(true);
    }
  });

  it("gives every room exactly the fields of its room type, Unknown included", () => {
    for (const record of DEMONSTRATION_DEPTH_RECORDS) for (const unit of record.units) for (const room of unit.rooms) {
      expect(Object.keys(room.facts).sort()).toEqual([...ROOM_FIELDS[room.roomType]].sort());
    }
    const missing = make(); delete missing.units[0]!.rooms[2]!.facts.rollInShower;
    expect(depthRecordErrors(missing).join(" ")).toMatch(/rollInShower: fact required/);
    const extra = make(); extra.units[0]!.rooms[3]!.facts.bedHeightMm = { value: null, provenance: null, photoSlotIds: [] };
    expect(depthRecordErrors(extra).join(" ")).toMatch(/bedHeightMm: unexpected field/);
  });

  it("requires provenance on every recorded value and none on Unknown", () => {
    const a = make(); a.building.entranceDoorClearWidthMm.provenance = null;
    expect(depthRecordErrors(a).join(" ")).toMatch(/entranceDoorClearWidthMm\/provenance: provenance required/);
    const b = make(); b.building.parking.provenance = b.recordProvenance;
    expect(depthRecordErrors(b).join(" ")).toMatch(/parking: Unknown must have null provenance/);
    for (const field of ["sourceName", "licence", "sourceDate", "tier"] as const) {
      const c = make();
      delete (c.units[0]!.rooms[0]!.facts.doorClearWidthMm!.provenance as unknown as Record<string, unknown>)[field];
      expect(depthRecordErrors(c).join(" ")).toContain(`doorClearWidthMm/provenance/${field}`);
    }
  });

  it("rejects unsupported tiers, values, identifiers and statuses", () => {
    const a = make(); (a.recordProvenance as unknown as { tier: number }).tier = 3;
    expect(depthRecordErrors(a).join(" ")).toMatch(/recordProvenance\/tier/);
    const b = make(); (b.units[0]!.rooms[2]!.facts.rollInShower as { value: unknown }).value = "partly";
    expect(depthRecordErrors(b).join(" ")).toMatch(/rollInShower\/value/);
    const c = make(); (c.building.entranceStepHeightMm as { value: unknown }).value = -20;
    expect(depthRecordErrors(c).join(" ")).toMatch(/entranceStepHeightMm\/value/);
    const d = make(); d.id = "some-real-building";
    expect(depthRecordErrors(d).join(" ")).toMatch(/\/id/);
    const e = make(); (e as unknown as { datasetStatus: string }).datasetStatus = "verified";
    expect(depthRecordErrors(e).join(" ")).toMatch(/datasetStatus/);
    const f = make(); f.units[1]!.id = f.units[0]!.id;
    expect(depthRecordErrors(f).join(" ")).toMatch(/units\/1\/id/);
    const g = make(); g.units = [];
    expect(depthRecordErrors(g).join(" ")).toMatch(/at least one unit/);
    const h = make(); (h as unknown as Record<string, unknown>).accessible = true;
    expect(depthRecordErrors(h).join(" ")).toMatch(/accessible: unexpected field/);
  });

  it("counts recorded fields without counting Unknown", () => {
    const empty = completeness(DEMONSTRATION_DEPTH_RECORDS[2]!);
    expect(empty).toEqual({ known: 0, total: BUILDING_FIELDS.length + ROOM_FIELDS.bedroom.length + ROOM_FIELDS.bathroom.length });
    const first = completeness(DEMONSTRATION_DEPTH_RECORDS[0]!);
    expect(first.known).toBeGreaterThan(0);
    expect(first.known).toBeLessThan(first.total);
  });
});

describe("unit filters: Unknown never matches", () => {
  it("lists every unit when no filter is set", () => {
    expect(ids({})).toEqual([UNIT_A, UNIT_B, ROOM_A, ROOM_B, ROOM_E]);
  });

  it("filters by type of place and city without touching facts", () => {
    expect(ids({ kind: "overnight" })).toEqual([ROOM_A, ROOM_B, ROOM_E]);
    expect(ids({ kind: "dwelling", city: "Ottawa" })).toEqual([]);
    expect(ids({ city: "Toronto" })).toEqual([UNIT_A, UNIT_B, ROOM_E]);
  });

  it("needs every doorway to be recorded and wide enough", () => {
    // Unit B has a recorded 810 mm entry door but Unknown bedroom and bathroom doors.
    expect(ids({ minDoorWidthMm: "800" })).toEqual([UNIT_A, ROOM_A, ROOM_B]);
    expect(ids({ minDoorWidthMm: "880" })).toEqual([ROOM_A, ROOM_B]);
    expect(ids({ minDoorWidthMm: "2000" })).toEqual([]);
    const record = DEMONSTRATION_DEPTH_RECORDS[0]!;
    expect(evaluateUnit(record, record.units[1]!, { ...NO_DEPTH_FILTERS, minDoorWidthMm: "800" }).doorWidth).toBe("unknown");
    expect(evaluateUnit(record, record.units[1]!, { ...NO_DEPTH_FILTERS, minDoorWidthMm: "850" }).doorWidth).toBe("fail");
  });

  it("does not let an Unknown entrance step or elevator pass", () => {
    expect(ids({ maxEntranceStepMm: "0" })).toEqual([UNIT_A, UNIT_B, ROOM_A, ROOM_B]);
    expect(ids({ requireElevator: true })).not.toContain(ROOM_E);
    expect(ids({ maxEntranceStepMm: "100000" })).not.toContain(ROOM_E);
  });

  it("requires one bathroom to meet all bathroom filters together", () => {
    expect(ids({ requireRollInShower: true })).toEqual([UNIT_A, ROOM_A]);
    expect(ids({ requireRollInShower: true, transferSide: "left" })).toEqual([UNIT_A]);
    expect(ids({ requireRollInShower: true, transferSide: "right", minTransferSpaceMm: "850" })).toEqual([ROOM_A]);
    expect(ids({ transferSide: "right", minTransferSpaceMm: "900" })).toEqual([]);
    const both = make(1);
    both.units[0]!.rooms[1]!.facts.transferSide!.value = "both";
    expect(searchUnits([both], { ...NO_DEPTH_FILTERS, transferSide: "left" }).matches.map((match) => match.unit.id)).toEqual([ROOM_A]);
  });

  it("matches a hoist only when one is recorded, and a bed height only when recorded", () => {
    expect(ids({ requireHoist: true })).toEqual([]);
    const withHoist = make(1);
    withHoist.units[0]!.rooms[0]!.facts.hoist!.value = "ceiling-track";
    expect(searchUnits([withHoist], { ...NO_DEPTH_FILTERS, requireHoist: true }).matches.map((match) => match.unit.id)).toEqual([ROOM_A]);
    expect(ids({ maxBedHeightMm: "550" })).toEqual([ROOM_A]);
    expect(ids({ maxBedHeightMm: "700" })).toEqual([ROOM_A, ROOM_B]);
  });

  it("separates units left out for Unknown from units left out for a recorded fact", () => {
    const search = searchUnits(DEMONSTRATION_DEPTH_RECORDS, { ...NO_DEPTH_FILTERS, requireRollInShower: true });
    expect(search.matches).toHaveLength(2);
    expect(search.excludedForRecorded).toBe(1); // unit B: recorded "no"
    expect(search.excludedForUnknown).toBe(2); // rooms D-2 and E-1: Unknown
  });

  it("treats a unit with no recorded room of the needed type as Unknown, not as a match", () => {
    const record = make();
    record.units[1]!.rooms = record.units[1]!.rooms.filter((room) => room.roomType !== "bathroom");
    const search = searchUnits([record], { ...NO_DEPTH_FILTERS, requireRollInShower: true });
    expect(search.matches.map((match) => match.unit.id)).toEqual([UNIT_A]);
    expect(search.excludedForUnknown).toBe(1);
  });

  it("matches nothing when a typed number cannot be read", () => {
    for (const text of ["abc", "-1", "Infinity"]) {
      const search = searchUnits(DEMONSTRATION_DEPTH_RECORDS, { ...NO_DEPTH_FILTERS, minDoorWidthMm: text });
      expect(search.matches).toEqual([]);
      expect(search.invalidInput).toBe(true);
    }
  });
});
