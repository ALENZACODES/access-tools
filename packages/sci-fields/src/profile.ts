import { ajv } from "./schema";
import type { DeviceProfile, Lang } from "./types";

/** On-device preferences only. No injury level, no clinical labels, and no default break interval. */
export const profileSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://access-tools.invalid/sci-fields/profile.schema.json",
  type: "object", additionalProperties: false,
  properties: {
    chairWidthMm: { type: "integer", minimum: 300, maximum: 1200 },
    maxSlopePercent: { type: "number", minimum: 0, maximum: 100 },
    transferSide: { enum: ["left", "right", "both"] },
    breakIntervalMinutes: { type: "integer", minimum: 1, maximum: 1440 },
  },
};
const validate = ajv.compile(profileSchema);

export function validateProfile(p: unknown): { ok: boolean; errors: string[] } {
  const ok = validate(p) as boolean;
  return { ok, errors: ok ? [] : (validate.errors ?? []).map((e) => `${e.instancePath} ${e.message}`) };
}

export const PROFILE_KEY = "sci-fields.profile";
type KV = { getItem(k: string): string | null; setItem(k: string, v: string): void };

export function loadProfile(storage: KV): DeviceProfile {
  try {
    const raw = storage.getItem(PROFILE_KEY);
    const p = raw ? JSON.parse(raw) : {};
    return validateProfile(p).ok ? p : {};
  } catch { return {}; }
}
export function saveProfile(storage: KV, p: DeviceProfile): boolean {
  if (!validateProfile(p).ok) return false;
  storage.setItem(PROFILE_KEY, JSON.stringify(p));
  return true;
}

/** A reminder is only ever "every N minutes because I set N". Returns null when unset. */
export function breakReminderText(p: DeviceProfile, lang: Lang): string | null {
  const n = p.breakIntervalMinutes;
  if (n === undefined) return null;
  return lang === "fr"
    ? `Rappel toutes les ${n} minutes (r�glage que vous avez choisi)`
    : `Reminder every ${n} minutes (set by you)`;
}
