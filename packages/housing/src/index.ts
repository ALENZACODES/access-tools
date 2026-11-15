import { DEMONSTRATION_ROOMS } from "./fixtures.js";
import { assertRooms } from "./validate.js";
assertRooms(DEMONSTRATION_ROOMS);
export { HousingFinder } from "./HousingFinder.js";
export { DEMONSTRATION_ROOMS } from "./fixtures.js";
export { filterRooms } from "./filter.js";
export { aggregate, readReports, saveReport, validReport, STORAGE_KEY } from "./reports.js";
export { assertRooms, roomErrors } from "./validate.js";
export type { HousingRoom, RoomFacts, Sourced, Provenance, BarrierReport, BarrierCategory, Language } from "./types.js";
