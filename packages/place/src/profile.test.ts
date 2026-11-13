import { describe, expect, it } from "vitest";
import { fixturePack, placeById } from "./fixtures.js";
import {
  EQUIPMENT_PROFILE_KEY,
  deleteProfile,
  doorClears,
  judgeDoorWidth,
  parseProfile,
  profilePlaceNotes,
  profilePlaceReasons,
  profileStepFreeReason,
  profileWashroomNotes,
  profileWashroomReasons,
  readProfile,
  saveProfile,
  type EquipmentProfile,
} from "./profile.js";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

function saved(overrides: Partial<EquipmentProfile> = {}): EquipmentProfile {
  return {
    schemaVersion: "equipment-profile-1.0.0",
    chairType: "power",
    widthMm: 800,
    stepFreeRequired: false,
    adultChangeTable: false,
    ...overrides,
  };
}

describe("equipment profile storage", () => {
  it("saves, edits, and deletes only the equipment fields", () => {
    const storage = memoryStorage();
    const first = saveProfile(storage, { chairType: "manual", widthMm: 800, stepFreeRequired: true, adultChangeTable: false });
    expect(first.ok).toBe(true);
    expect(readProfile(storage)?.chairType).toBe("manual");
    const edited = saveProfile(storage, { chairType: "scooter", widthMm: null, stepFreeRequired: false, adultChangeTable: true });
    expect(edited.ok).toBe(true);
    expect(readProfile(storage)).toMatchObject({ chairType: "scooter", widthMm: null, adultChangeTable: true });
    const stored = JSON.parse(storage.getItem(EQUIPMENT_PROFILE_KEY) ?? "{}") as Record<string, unknown>;
    expect(Object.keys(stored).sort()).toEqual(["adultChangeTable", "chairType", "schemaVersion", "stepFreeRequired", "widthMm"]);
    deleteProfile(storage);
    expect(storage.getItem(EQUIPMENT_PROFILE_KEY)).toBeNull();
    expect(readProfile(storage)).toBeNull();
  });

  it("drops a health field instead of keeping it", () => {
    const storage = memoryStorage();
    storage.setItem(
      EQUIPMENT_PROFILE_KEY,
      JSON.stringify({ ...saved(), name: "Day chair", washroomInterval: 90 }),
    );
    const profile = readProfile(storage);
    expect(profile).toEqual(saved());
    expect(profile).not.toHaveProperty("name");
    expect(JSON.stringify(profile)).not.toContain("washroomInterval");
  });

  it("keeps every field optional and refuses a width that is not a whole number of millimetres", () => {
    const storage = memoryStorage();
    expect(saveProfile(storage, { chairType: null, widthMm: null, stepFreeRequired: false, adultChangeTable: false }).ok).toBe(true);
    expect(saveProfile(storage, { chairType: null, widthMm: 0, stepFreeRequired: false, adultChangeTable: false }).ok).toBe(false);
    expect(parseProfile({ schemaVersion: "equipment-profile-1.0.0", name: "Day chair", chairType: null, widthMm: null, stepFreeRequired: "yes", adultChangeTable: false })).toBeNull();
  });
});

describe("equipment profile filtering", () => {
  it("treats unknown door width, step-free, and change-table values as not a match", () => {
    const centre = placeById("fix-community-centre");
    const cafe = placeById("fix-cafe");
    expect(centre).toBeTruthy();
    expect(cafe).toBeTruthy();
    expect(doorClears(null, 800)).toBe(false);
    expect(doorClears(860, 900)).toBe(false);
    expect(doorClears(860, 800)).toBe(true);
    expect(judgeDoorWidth(null, 800)).toBe("missing");
    expect(judgeDoorWidth(860, 900)).toBe("narrower");
    expect(judgeDoorWidth(860, 800)).toBe("clears");
    const wide: EquipmentProfile = saved({ widthMm: 900, stepFreeRequired: true, adultChangeTable: true });
    const centreReasons = profilePlaceReasons(centre!, wide, "en");
    expect(centreReasons.join(" ")).toMatch(/narrower than the saved chair width/);
    expect(centreReasons.join(" ")).toMatch(/change table/);
    expect(centreReasons.join(" ")).not.toMatch(/Step-free/);
    expect(centreReasons.join(" ")).not.toMatch(/measurement missing/);
    expect(profilePlaceReasons(cafe!, saved({ widthMm: 700 }), "en")).toEqual([]);
    expect(profilePlaceNotes(cafe!, saved({ widthMm: 700 }), "en").join(" ")).toMatch(/Cannot judge, measurement missing/);
    expect(profilePlaceNotes(cafe!, saved({ widthMm: 700 }), "fr").join(" ")).toMatch(/mesure manquante/);
    expect(profilePlaceNotes(centre!, saved({ widthMm: 800 }), "en")).toEqual([]);
    expect(profilePlaceReasons(centre!, saved({ widthMm: 800 }), "en")).toEqual([]);
    const washroom = centre!.washrooms[0];
    const unknownWashroom = centre!.washrooms[1];
    expect(washroom && unknownWashroom).toBeTruthy();
    expect(profileWashroomReasons(centre!, unknownWashroom!, saved({ widthMm: 700 }), "en")).toEqual([]);
    expect(profileWashroomNotes(unknownWashroom!, saved({ widthMm: 700 }), "en").join(" ")).toMatch(/Cannot judge, measurement missing/);
    expect(profileWashroomReasons(centre!, washroom!, saved({ widthMm: 900 }), "en").join(" ")).toMatch(/narrower than the saved chair width/);
    expect(profileStepFreeReason(null, saved({ stepFreeRequired: true }), "en")).toMatch(/Step-free/);
    expect(profileStepFreeReason("yes", saved({ stepFreeRequired: true }), "en")).toBeNull();
    expect(profilePlaceReasons(centre!, null, "en")).toEqual([]);
    expect(fixturePack.places.length).toBeGreaterThan(0);
  });
});
