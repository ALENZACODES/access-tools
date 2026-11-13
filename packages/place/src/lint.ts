import type { PhotoSlot, PlacePack, PlaceRecord, Sourced } from "./types.js";

export interface SourcedRef {
  path: string;
  sourced: Sourced<unknown>;
}

function push(refs: SourcedRef[], path: string, sourced: Sourced<unknown>): void {
  refs.push({ path, sourced });
}

export function collectSourced(place: PlaceRecord): SourcedRef[] {
  const refs: SourcedRef[] = [];
  const entrance = place.entrance;
  push(refs, "entrance.stepCount", entrance.stepCount);
  push(refs, "entrance.stepHeightMm", entrance.stepHeightMm);
  push(refs, "entrance.thresholdHeightMm", entrance.thresholdHeightMm);
  push(refs, "entrance.rampPresent", entrance.rampPresent);
  push(refs, "entrance.namedLocation", entrance.namedLocation);
  push(refs, "entrance.streetDirections", entrance.streetDirections);
  push(refs, "entrance.doorClearWidthMm", entrance.doorClearWidthMm);
  push(refs, "entrance.doorOperation", entrance.doorOperation);
  push(refs, "entrance.rampGeometry", entrance.rampGeometry);
  push(refs, "entrance.rampLengthRise", entrance.rampLengthRise);
  push(refs, "entrance.elevator", entrance.elevator);
  push(refs, "entrance.lightingSignage", entrance.lightingSignage);
  push(refs, "entrance.stepFree", entrance.stepFree);
  place.washrooms.forEach((washroom, index) => {
    const prefix = `washrooms[${index}]`;
    push(refs, `${prefix}.locationAndRoute`, washroom.locationAndRoute);
    push(refs, `${prefix}.door`, washroom.door);
    push(refs, `${prefix}.doorClearWidthMm`, washroom.doorClearWidthMm);
    push(refs, `${prefix}.turningDiameterMm`, washroom.turningDiameterMm);
    push(refs, `${prefix}.transfer`, washroom.transfer);
    push(refs, `${prefix}.grabBars`, washroom.grabBars);
    push(refs, `${prefix}.seatHeightMm`, washroom.seatHeightMm);
    push(refs, `${prefix}.sink`, washroom.sink);
    push(refs, `${prefix}.shelfHookSupplies`, washroom.shelfHookSupplies);
    push(refs, `${prefix}.privacyLock`, washroom.privacyLock);
    push(refs, `${prefix}.emergencyCord`, washroom.emergencyCord);
    push(refs, `${prefix}.changeTable`, washroom.changeTable);
    push(refs, `${prefix}.hoist`, washroom.hoist);
    push(refs, `${prefix}.accessPolicy`, washroom.accessPolicy);
    push(refs, `${prefix}.hoursReliability`, washroom.hoursReliability);
  });
  const interior = place.interior;
  push(refs, "interior.routes", interior.routes);
  push(refs, "interior.counters", interior.counters);
  push(refs, "interior.seating", interior.seating);
  push(refs, "interior.sensory", interior.sensory);
  push(refs, "interior.assistancePolicy", interior.assistancePolicy);
  push(refs, "interior.assistiveListening", interior.assistiveListening);
  push(refs, "interior.restSpace", interior.restSpace);
  const parking = place.parking;
  push(refs, "parking.route", parking.route);
  push(refs, "parking.surfaceSnow", parking.surfaceSnow);
  push(refs, "parking.payment", parking.payment);
  push(refs, "parking.dropOff", parking.dropOff);
  push(refs, "parking.curbCuts", parking.curbCuts);
  push(refs, "parking.approachObstacles", parking.approachObstacles);
  parking.bays.forEach((bay, index) => {
    const prefix = `parking.bays[${index}]`;
    push(refs, `${prefix}.widthMm`, bay.widthMm);
    push(refs, `${prefix}.aisleWidthMm`, bay.aisleWidthMm);
    push(refs, `${prefix}.aisleSide`, bay.aisleSide);
    push(refs, `${prefix}.surface`, bay.surface);
    push(refs, `${prefix}.gradient`, bay.gradient);
    push(refs, `${prefix}.distanceToEntranceM`, bay.distanceToEntranceM);
    push(refs, `${prefix}.stepFreeRoute`, bay.stepFreeRoute);
    push(refs, `${prefix}.snowClearedOn`, bay.snowClearedOn);
    push(refs, `${prefix}.signage`, bay.signage);
  });
  place.chargingPoints.forEach((point, index) => {
    const prefix = `chargingPoints[${index}]`;
    push(refs, `${prefix}.locationNote`, point.locationNote);
    push(refs, `${prefix}.outletType`, point.outletType);
    push(refs, `${prefix}.outletCount`, point.outletCount);
    push(refs, `${prefix}.accessMethod`, point.accessMethod);
    push(refs, `${prefix}.permissionContact`, point.permissionContact);
    push(refs, `${prefix}.seating`, point.seating);
    push(refs, `${prefix}.setting`, point.setting);
    push(refs, `${prefix}.hoursText`, point.hoursText);
    push(refs, `${prefix}.cost`, point.cost);
    push(refs, `${prefix}.stepFreeRoute`, point.stepFreeRoute);
  });
  const transport = place.transport;
  push(refs, "transport.nearestStop", transport.nearestStop);
  push(refs, "transport.elevatorStatus", transport.elevatorStatus);
  push(refs, "transport.paratransit", transport.paratransit);
  push(refs, "transport.chargingSummary", transport.chargingSummary);
  push(refs, "transport.repairSupplySummary", transport.repairSupplySummary);
  push(refs, "transport.emergencyContacts", transport.emergencyContacts);
  if (place.trail) {
    push(refs, "trail.surface", place.trail.surface);
    push(refs, "trail.grade", place.trail.grade);
    push(refs, "trail.widthMm", place.trail.widthMm);
    push(refs, "trail.obstacles", place.trail.obstacles);
    push(refs, "trail.rest", place.trail.rest);
  }
  return refs;
}

function photoById(photos: PhotoSlot[], id: string): PhotoSlot | undefined {
  return photos.find((photo) => photo.id === id);
}

/** Honesty invariants. Real places are not invented here; fixtures must say they are fixtures. */
export function lintPlace(place: PlaceRecord): string[] {
  const errors: string[] = [];
  if (!place.honestyNote.trim()) errors.push(`${place.id}: honesty note is empty`);
  if (!place.recordProvenance.sourceName.trim()) errors.push(`${place.id}: record source name is empty`);
  if (!place.recordProvenance.licence.trim()) errors.push(`${place.id}: record licence is empty`);
  if (place.datasetStatus !== "access-maps" && !/fixture|seed|skeleton|not a real/i.test(place.honestyNote)) {
    errors.push(`${place.id}: a non-access-maps record must say it is a fixture or seed`);
  }
  if (place.identity.latitude !== null || place.identity.longitude !== null) {
    if (!place.identity.coordinateNote) errors.push(`${place.id}: coordinates need a coordinate note`);
  }
  if (place.identity.placeType === "trailhead" && place.trail === null) {
    errors.push(`${place.id}: a trailhead needs the trail template`);
  }
  if (place.identity.placeType !== "trailhead" && place.trail !== null) {
    errors.push(`${place.id}: trail fields are only for a trailhead`);
  }
  if (place.entrance.stepFree.value === "yes" && place.entrance.stepCount.value !== null && place.entrance.stepCount.value > 0) {
    errors.push(`${place.id}: step-free yes conflicts with a step count above zero`);
  }
  if (
    place.entrance.stepFree.value === "yes" &&
    place.entrance.stepHeightMm.value !== null &&
    place.entrance.stepHeightMm.value > 0
  ) {
    errors.push(`${place.id}: step-free yes conflicts with a step height above zero`);
  }
  for (const ref of collectSourced(place)) {
    if (ref.sourced.value !== null && ref.sourced.provenance === null) {
      errors.push(`${place.id}: ${ref.path} has a value without provenance`);
    }
    if (ref.sourced.value === null && ref.sourced.photoSlotIds.length > 0) {
      errors.push(`${place.id}: ${ref.path} attaches a photograph slot to an unknown value`);
    }
    for (const photoId of ref.sourced.photoSlotIds) {
      const photo = photoById(place.photos, photoId);
      if (!photo) errors.push(`${place.id}: ${ref.path} names a missing photograph slot ${photoId}`);
      else if (photo.status === "described" && !photo.description) {
        errors.push(`${place.id}: photograph ${photoId} is described without an access description`);
      }
    }
  }
  return errors;
}

export function lintPack(pack: PlacePack): string[] {
  const errors: string[] = [];
  if (pack.kind !== "labelled-fixture") errors.push("pack kind must be labelled-fixture in this package");
  if (!pack.notice.trim()) errors.push("pack notice is empty");
  const ids = new Set<string>();
  for (const place of pack.places) {
    if (ids.has(place.id)) errors.push(`duplicate place id ${place.id}`);
    ids.add(place.id);
    errors.push(...lintPlace(place));
    if (place.datasetStatus === "access-maps") {
      errors.push(`${place.id}: this package's fixture pack cannot contain an access-maps record`);
    }
  }
  const repairIds = new Set(pack.repairers.map((repairer) => repairer.id));
  const storeIds = new Set(pack.supplyStores.map((store) => store.id));
  for (const place of pack.places) {
    for (const repairerId of place.linkedRepairerIds) {
      if (!repairIds.has(repairerId)) errors.push(`${place.id}: missing repairer ${repairerId}`);
    }
    for (const storeId of place.linkedSupplyStoreIds) {
      if (!storeIds.has(storeId)) errors.push(`${place.id}: missing supply store ${storeId}`);
    }
  }
  for (const repairer of pack.repairers) {
    if (!repairer.honestyNote.trim()) errors.push(`${repairer.id}: honesty note is empty`);
    if (!repairer.provenance.licence.trim()) errors.push(`${repairer.id}: licence is empty`);
    if ((repairer.latitude !== null || repairer.longitude !== null) && !repairer.coordinateNote) {
      errors.push(`${repairer.id}: coordinates need a coordinate note`);
    }
  }
  for (const store of pack.supplyStores) {
    if (!store.honestyNote.trim()) errors.push(`${store.id}: honesty note is empty`);
    if (!store.provenance.licence.trim()) errors.push(`${store.id}: licence is empty`);
  }
  return errors;
}
