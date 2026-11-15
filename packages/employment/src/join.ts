import type { EmploymentListing, SourcedFact } from "./types.js";

// This package has no real place registry. A join is by explicit ID only;
// absent or unmatched records must never be interpreted as accessibility.
export interface WorkplaceAccessRecord {
  placeId: string;
  stepFreeEntry: SourcedFact;
  accessibleWashroom: SourcedFact;
  workstation: SourcedFact;
}

export function joinWorkplace(
  listing: EmploymentListing,
  places: readonly WorkplaceAccessRecord[],
): WorkplaceAccessRecord | undefined {
  if (!listing.workplacePlaceId) return undefined;
  return places.find((place) => place.placeId === listing.workplacePlaceId);
}

export function commuteStatus(_listing: EmploymentListing): "Unknown" {
  return "Unknown";
}
