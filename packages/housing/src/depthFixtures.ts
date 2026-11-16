import type { DepthRecord, RoomFacts, RoomType } from "./depth.js";
import { ROOM_FIELDS } from "./depth.js";
import type { Provenance, Sourced } from "./types.js";

/** Every record and value here is an invented demonstration, NOT a real building, room or measurement. */
const provenance: Provenance = {
  sourceName: "Synthetic demonstration authored for the App",
  sourceId: "demo-housing-depth-2026-11-16",
  licence: "CC0-1.0 synthetic demonstration data",
  sourceDate: "2026-11-16", recordDate: "2026-11-16", retrievedAt: "2026-11-16",
  tier: 0, prototypeLabel: "PROTOTYPE-UNVERIFIED", verifierType: "fixture-author",
};
const unknown = <T>(): Sourced<T> => ({ value: null, provenance: null, photoSlotIds: [] });
const demo = <T>(value: T): Sourced<T> => ({ value, provenance: { ...provenance }, photoSlotIds: [] });

/** A room of the given type with every field Unknown unless a demonstration value is given. */
function room(id: string, roomType: RoomType, values: RoomFacts = {}) {
  const facts: RoomFacts = {};
  for (const key of ROOM_FIELDS[roomType]) (facts as Record<string, Sourced<unknown>>)[key] = values[key] ?? unknown();
  return { id, roomType, facts };
}

export const DEMONSTRATION_DEPTH_RECORDS: DepthRecord[] = [
  {
    schemaVersion: "housing-depth-1", id: "demo-depth-dwelling-01", kind: "dwelling",
    name: { en: "Demonstration apartment building C", fr: "Immeuble d’appartements de démonstration C" },
    city: "Toronto", province: "ON", datasetStatus: "labelled-fixture", recordProvenance: { ...provenance },
    building: {
      entranceStepHeightMm: demo(0), entranceDoorClearWidthMm: demo(915), elevator: demo<"yes" | "no">("yes"),
      elevatorReliabilityNote: unknown(), parking: unknown(),
    },
    units: [
      {
        id: "demo-depth-dwelling-01-unit-a", name: { en: "Demonstration unit C-1", fr: "Logement de démonstration C-1" },
        rooms: [
          room("demo-depth-dwelling-01-unit-a-entry", "entry", { doorClearWidthMm: demo(900), thresholdHeightMm: demo(10) }),
          room("demo-depth-dwelling-01-unit-a-bedroom", "bedroom", { doorClearWidthMm: demo(860) }),
          room("demo-depth-dwelling-01-unit-a-bathroom", "bathroom", {
            doorClearWidthMm: demo(860), transferSide: demo<"left" | "right" | "both">("left"), transferSpaceMm: demo(900), rollInShower: demo<"yes" | "no">("yes"),
          }),
          room("demo-depth-dwelling-01-unit-a-kitchen", "kitchen", { doorClearWidthMm: demo(900) }),
        ],
      },
      {
        id: "demo-depth-dwelling-01-unit-b", name: { en: "Demonstration unit C-2", fr: "Logement de démonstration C-2" },
        rooms: [
          room("demo-depth-dwelling-01-unit-b-entry", "entry", { doorClearWidthMm: demo(810) }),
          room("demo-depth-dwelling-01-unit-b-bedroom", "bedroom"),
          room("demo-depth-dwelling-01-unit-b-bathroom", "bathroom", { rollInShower: demo<"yes" | "no">("no") }),
        ],
      },
    ],
  },
  {
    schemaVersion: "housing-depth-1", id: "demo-depth-overnight-01", kind: "overnight",
    name: { en: "Demonstration overnight property D", fr: "Établissement d’hébergement de démonstration D" },
    city: "Ottawa", province: "ON", datasetStatus: "labelled-fixture", recordProvenance: { ...provenance },
    building: {
      entranceStepHeightMm: demo(0), entranceDoorClearWidthMm: demo(950), elevator: demo<"yes" | "no">("yes"),
      elevatorReliabilityNote: unknown(), parking: demo("Illustrative parking note"),
    },
    units: [
      {
        id: "demo-depth-overnight-01-room-a", name: { en: "Demonstration guest room D-1", fr: "Chambre de démonstration D-1" },
        rooms: [
          room("demo-depth-overnight-01-room-a-bedroom", "bedroom", {
            doorClearWidthMm: demo(900), turningDiameterMm: demo(1500), bedHeightMm: demo(520), bedSideClearanceMm: demo(900),
            underBedClearanceMm: demo(150), hoist: demo<"ceiling-track" | "mobile" | "none">("none"),
          }),
          room("demo-depth-overnight-01-room-a-bathroom", "bathroom", {
            doorClearWidthMm: demo(900), turningDiameterMm: demo(1500), transferSide: demo<"left" | "right" | "both">("right"),
            transferSpaceMm: demo(850), rollInShower: demo<"yes" | "no">("yes"),
          }),
        ],
      },
      {
        id: "demo-depth-overnight-01-room-b", name: { en: "Demonstration guest room D-2", fr: "Chambre de démonstration D-2" },
        rooms: [
          room("demo-depth-overnight-01-room-b-bedroom", "bedroom", { doorClearWidthMm: demo(900), bedHeightMm: demo(680) }),
          room("demo-depth-overnight-01-room-b-bathroom", "bathroom", { doorClearWidthMm: demo(900) }),
        ],
      },
    ],
  },
  {
    schemaVersion: "housing-depth-1", id: "demo-depth-overnight-02", kind: "overnight",
    name: { en: "Demonstration overnight property E", fr: "Établissement d’hébergement de démonstration E" },
    city: "Toronto", province: "ON", datasetStatus: "labelled-fixture", recordProvenance: { ...provenance },
    building: {
      entranceStepHeightMm: unknown(), entranceDoorClearWidthMm: unknown(), elevator: unknown(),
      elevatorReliabilityNote: unknown(), parking: unknown(),
    },
    units: [
      {
        id: "demo-depth-overnight-02-room-a", name: { en: "Demonstration guest room E-1", fr: "Chambre de démonstration E-1" },
        rooms: [room("demo-depth-overnight-02-room-a-bedroom", "bedroom"), room("demo-depth-overnight-02-room-a-bathroom", "bathroom")],
      },
    ],
  },
];
