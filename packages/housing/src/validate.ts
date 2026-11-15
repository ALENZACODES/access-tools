import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import schema from "./schema.json";
import type { HousingRoom } from "./types.js";
const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);
export function roomErrors(value: unknown): string[] {
  if (!validate(value)) return (validate.errors ?? []).map((e) => `${e.instancePath || "/"}: ${e.message ?? "invalid"}`);
  // Null is the only representation of Unknown; do not attach unsupported evidence to it.
  const room = value as unknown as HousingRoom;
  const errors: string[] = [];
  for (const [field, fact] of Object.entries(room.facts)) {
    if (fact.value === null && fact.provenance !== null) errors.push(`${field}: Unknown must have null provenance`);
  }
  return errors;
}
export function assertRooms(records: unknown): asserts records is HousingRoom[] {
  if (!Array.isArray(records)) throw new Error("Expected a room array");
  records.forEach((room, index) => {
    const errors = roomErrors(room);
    if (errors.length) throw new Error(`Room ${index}: ${errors.join("; ")}`);
  });
}
