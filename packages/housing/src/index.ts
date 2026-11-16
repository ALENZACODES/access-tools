import { DEMONSTRATION_ROOMS } from "./fixtures.js";
import { assertRooms } from "./validate.js";
import { assertDepthRecords } from "./depth.js";
import { DEMONSTRATION_DEPTH_RECORDS } from "./depthFixtures.js";
assertRooms(DEMONSTRATION_ROOMS);
assertDepthRecords(DEMONSTRATION_DEPTH_RECORDS);
export { HousingFinder } from "./HousingFinder.js";
export { DEMONSTRATION_ROOMS } from "./fixtures.js";
export { filterRooms } from "./filter.js";
export { aggregate, readReports, saveReport, validReport, STORAGE_KEY } from "./reports.js";
export { assertRooms, roomErrors } from "./validate.js";
export type { HousingRoom, RoomFacts, Sourced, Provenance, BarrierReport, BarrierCategory, Language } from "./types.js";
export { DepthFinder } from "./DepthFinder.js";
export { EvidenceForm } from "./EvidenceForm.js";
export { DEMONSTRATION_DEPTH_RECORDS } from "./depthFixtures.js";
export { BUILDING_FIELDS, ROOM_FIELDS, assertDepthRecords, completeness, depthRecordErrors } from "./depth.js";
export type { BuildingFacts, DepthRecord, DepthRoom, DepthUnit, HoistKind, RoomFactKey, RoomFacts as DepthRoomFacts, RoomType } from "./depth.js";
export { NO_DEPTH_FILTERS, evaluateUnit, searchUnits } from "./depthFilter.js";
export type { DepthFilters, DepthSearch, UnitMatch, Verdict } from "./depthFilter.js";
export {
  BARRIER_TYPES, EVIDENCE_STORAGE_KEY, SETTINGS, SUPPRESSION_THRESHOLD, WAIT_BANDS, aggregateEvidence, buildEvidence, clearEvidence,
  quarterOf, readEvidence, saveEvidence, suppressCounts, suppressPartition, validEvidence,
} from "./evidence.js";
export type { BarrierType, EvidenceAggregate, EvidenceDraft, EvidenceReport, EvidenceSetting, WaitBand } from "./evidence.js";
