import type { PlacePack, PlaceRecord, PlaceType, Provenance, Repairer, SupplyStore } from "./types.js";

/**
 * Canonical records for @access-main/schema.
 * Synthetic fixtures stay publication_context prototype and PROTOTYPE-UNVERIFIED.
 * They are examples. They are not open-data imports and they are not tier 3.
 */

export interface CanonicalFact {
  value: string | number | boolean | string[];
  source_id: string;
  licence: string;
  retrieved_at: string;
  tier: Provenance["tier"];
  source_name: string;
  unit?: "mm" | "m" | "kg";
}

function fact(
  value: string | number | boolean | string[] | null,
  provenance: Provenance,
  unit?: "mm" | "m" | "kg",
): CanonicalFact {
  const row: CanonicalFact = {
    value: value === null || value === "" ? "unknown" : value,
    source_id: provenance.sourceId,
    licence: provenance.licence,
    retrieved_at: provenance.retrievedAt,
    tier: provenance.tier,
    source_name: provenance.sourceName,
  };
  if (typeof row.value === "number" && unit) row.unit = unit;
  return row;
}

export function canonicalProvenance(provenance: Provenance): Record<string, unknown> {
  return {
    tier: provenance.tier,
    ...(provenance.prototypeLabel ? { prototype_label: provenance.prototypeLabel } : {}),
    source_name: provenance.sourceName,
    source_id: provenance.sourceId,
    source_date: provenance.sourceDate,
    record_date: provenance.recordDate,
    licence_id: provenance.sourceId,
    retrieved_at: provenance.retrievedAt,
    ...(provenance.evidence
      ? {
          evidence: {
            protocol_version: provenance.evidence.protocolVersion,
            verifier_role: provenance.evidence.verifierRole,
            method: provenance.evidence.method,
            observed_at: provenance.evidence.observedAt,
            photo_ids: provenance.evidence.photoIds,
          },
        }
      : {}),
  };
}

function placeTypeValue(placeType: PlaceType): string {
  switch (placeType) {
    case "simple-venue":
      return "venue";
    case "complex-venue":
      return "facility";
    case "transit-station":
      return "station_building";
    case "trailhead":
      return "trailhead";
    case "hotel-room":
      return "hospitality";
    case "parking-lot":
      return "other";
    case "skeleton":
      return "unknown";
    default:
      return "unknown";
  }
}

function hoistType(value: string | null | undefined): string {
  if (!value) return "unknown";
  if (/ceiling track/i.test(value)) return "ceiling_track";
  if (/mobile/i.test(value)) return "mobile";
  return "other";
}

function shell(
  recordType: string,
  schemaVersion: string,
  id: string,
  provenance: Provenance,
  extra: Record<string, unknown> = {},
  options?: { status?: boolean },
) {
  return {
    record_type: recordType,
    schema_version: schemaVersion,
    id,
    ...(options?.status === false ? {} : { record_status: "draft" }),
    publication_context: "prototype",
    example: true,
    provenance: canonicalProvenance(provenance),
    ...extra,
  };
}

function presentFlag(value: "yes" | "no" | null | undefined): boolean | "unknown" {
  if (value === "yes") return true;
  if (value === "no") return false;
  return "unknown";
}

export function canonicalPlace(place: PlaceRecord): Record<string, unknown> {
  const provenance = place.recordProvenance;
  const stepFree = place.entrance.stepFree.value;
  return shell("place", "place-1.0.0", place.id, provenance, {
    facts: {
      name_en: fact(place.identity.name, provenance),
      ...(place.nameFr ? { name_fr: fact(place.nameFr, provenance) } : {}),
      category_primary: fact(place.identity.category, provenance),
      place_type: fact(placeTypeValue(place.identity.placeType), provenance),
      address_street: fact(place.identity.address, provenance),
      address_city: fact(place.identity.municipality, provenance),
      step_free_route_exists: fact(stepFree === "yes" ? true : stepFree === "no" ? false : "unknown", provenance),
    },
  });
}

export function canonicalCitySkeleton(place: PlaceRecord): Record<string, unknown> {
  return shell(
    "city_skeleton",
    "city-skeleton-1.0.0",
    `${place.id}-city`,
    place.recordProvenance,
    {
      city_name: place.identity.municipality,
      province: "Ontario",
      transit_system_names: [],
      paratransit_name: "unknown",
      booking_contact: "unknown",
      not_yet_seeded: ["washrooms", "entrances", "parking", "charging", "repair"],
    },
    { status: false },
  );
}

export function canonicalWashroom(place: PlaceRecord, washroomId: string): Record<string, unknown> | null {
  const washroom = place.washrooms.find((item) => item.id === washroomId);
  if (!washroom) return null;
  const provenance = washroom.transfer.provenance ?? washroom.changeTable.provenance ?? place.recordProvenance;
  const transfer = washroom.transfer.value?.side ?? "unknown";
  const change = washroom.changeTable.value;
  const hoist = washroom.hoist.value;
  return shell("washroom", "washroom-1.0.0", washroom.id, provenance, {
    place_id: place.id,
    facts: {
      washroom_name: fact(washroom.name, provenance),
      transfer_side: fact(transfer, provenance),
      turning_space_diameter_mm: fact(washroom.turningDiameterMm.value, provenance, "mm"),
      adult_change_table_present: fact(presentFlag(change?.present), provenance),
      adult_change_table_load_kg: fact(change?.loadKg ?? null, provenance, "kg"),
      hoist_present: fact(presentFlag(hoist?.present), provenance),
      hoist_type: fact(hoistType(hoist?.type), provenance),
      hoist_sling_policy: fact(hoist?.slingPolicy ?? null, provenance),
      door_lock_type: fact("unknown", provenance),
    },
  });
}

export function canonicalParking(place: PlaceRecord, bayId: string): Record<string, unknown> | null {
  const bay = place.parking.bays.find((item) => item.id === bayId);
  if (!bay) return null;
  const provenance = bay.widthMm.provenance ?? place.recordProvenance;
  const bayType =
    bay.kind === "type-a-van"
      ? "type_a_van_accessible"
      : bay.kind === "type-b-standard"
        ? "type_b_standard_accessible"
        : "unknown_recorded";
  return shell("parking", "parking-1.0.0", bay.id, provenance, {
    place_id: place.id,
    facts: {
      record_level: fact("bay", provenance),
      bay_type: fact(bayType, provenance),
      distance_to_entrance_m: fact(bay.distanceToEntranceM.value, provenance, "m"),
    },
  });
}

export function canonicalCharging(place: PlaceRecord, pointId: string): Record<string, unknown> | null {
  const point = place.chargingPoints.find((item) => item.id === pointId);
  if (!point) return null;
  const provenance = point.outletType.provenance ?? place.recordProvenance;
  return shell("charging", "charging-1.0.0", point.id, provenance, {
    place_id: place.id,
    facts: {
      charging_present: fact(true, provenance),
      connector_type: fact(point.outletType.value, provenance),
      plug_type: fact(point.outletType.value, provenance),
    },
  });
}

export function canonicalRepairer(repairer: Repairer): Record<string, unknown> {
  return shell("repair_supply", "repair-supply-1.0.0", repairer.id, repairer.provenance, {
    facts: {
      name_en: fact(repairer.name, repairer.provenance),
      ...(repairer.nameFr ? { name_fr: fact(repairer.nameFr, repairer.provenance) } : {}),
      service_kind: fact("repair", repairer.provenance),
      mobile_service: fact(repairer.servicesPublished.includes("mobile"), repairer.provenance),
      hours: fact(repairer.hoursText, repairer.provenance),
      phone: fact(repairer.phone, repairer.provenance),
    },
  });
}

export function canonicalSupplyStore(store: SupplyStore): Record<string, unknown> {
  const kind = store.storeType === "pharmacy" ? "pharmacy" : "supply";
  return shell("repair_supply", "repair-supply-1.0.0", store.id, store.provenance, {
    facts: {
      name_en: fact(store.name, store.provenance),
      ...(store.nameFr ? { name_fr: fact(store.nameFr, store.provenance) } : {}),
      service_kind: fact(kind, store.provenance),
      mobile_service: fact("unknown", store.provenance),
      hours: fact(store.hoursText, store.provenance),
      phone: fact(store.phone, store.provenance),
    },
  });
}

/** Every labelled fixture, as the canonical records the shared schema can validate. */
export function canonicalFixtureRecords(pack: PlacePack): Record<string, unknown>[] {
  const records: Record<string, unknown>[] = [];
  for (const place of pack.places) {
    records.push(canonicalPlace(place));
    if (place.depth === "skeleton") records.push(canonicalCitySkeleton(place));
    for (const washroom of place.washrooms) {
      const row = canonicalWashroom(place, washroom.id);
      if (row) records.push(row);
    }
    for (const bay of place.parking.bays) {
      const row = canonicalParking(place, bay.id);
      if (row) records.push(row);
    }
    for (const point of place.chargingPoints) {
      const row = canonicalCharging(place, point.id);
      if (row) records.push(row);
    }
  }
  for (const repairer of pack.repairers) records.push(canonicalRepairer(repairer));
  for (const store of pack.supplyStores) records.push(canonicalSupplyStore(store));
  return records;
}
