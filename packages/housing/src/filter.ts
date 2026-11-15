import type { HousingRoom } from "./types.js";
export interface Filters { city: string; minimumDoorWidth: string; requireElevator: boolean }
export function filterRooms(rooms: readonly HousingRoom[], filters: Filters): HousingRoom[] {
  const min = filters.minimumDoorWidth.trim() === "" ? null : Number(filters.minimumDoorWidth);
  return rooms.filter((room) => {
    if (filters.city && room.city !== filters.city) return false;
    if (min !== null && (!Number.isFinite(min) || min < 0 || room.facts.doorClearWidthMm.value === null || room.facts.doorClearWidthMm.value < min)) return false;
    if (filters.requireElevator && room.facts.elevator.value !== "yes") return false;
    return true;
  });
}
