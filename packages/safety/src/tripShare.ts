/**
 * Local, time-limited trip share payload. There is no tracking server: the
 * payload is plain text the person copies themselves. After `expiresAt` the
 * payload is dead and decoding reveals nothing. A revoked id (kept on this
 * device only) is dead too.
 */
export const TRIP_SHARE_PREFIX = "ACCESS-TRIP-SHARE/1 ";
export const SHARE_GRACE_MS = 60 * 60 * 1000;
export const MAX_SHARE_LIFETIME_MS = 24 * 60 * 60 * 1000;
export const MAX_LABEL_LENGTH = 80;
export const MAX_NOTES_LENGTH = 280;

export interface TripShareInput {
  originLabel: string;
  destinationLabel: string;
  windowStart: Date;
  windowEnd: Date;
  notes?: string;
}

export interface TripShare {
  version: 1;
  id: string;
  originLabel: string;
  destinationLabel: string;
  windowStart: string;
  windowEnd: string;
  notes: string;
  createdAt: string;
  expiresAt: string;
}

export type TripShareError =
  | "origin-required"
  | "destination-required"
  | "label-long"
  | "notes-long"
  | "window-invalid"
  | "window-ended";

export type CreateTripShareResult = { ok: true; share: TripShare } | { ok: false; error: TripShareError };

export type DecodedTripShare =
  | { status: "live"; share: TripShare }
  | { status: "expired"; expiresAt: string }
  | { status: "revoked" }
  | { status: "invalid" };

function newId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function validDate(date: Date): boolean {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

export function createTripShare(input: TripShareInput, now: Date, id: string = newId()): CreateTripShareResult {
  const origin = input.originLabel.trim();
  const destination = input.destinationLabel.trim();
  const notes = (input.notes ?? "").trim();
  if (!origin) return { ok: false, error: "origin-required" };
  if (!destination) return { ok: false, error: "destination-required" };
  if (origin.length > MAX_LABEL_LENGTH || destination.length > MAX_LABEL_LENGTH) return { ok: false, error: "label-long" };
  if (notes.length > MAX_NOTES_LENGTH) return { ok: false, error: "notes-long" };
  if (!validDate(input.windowStart) || !validDate(input.windowEnd) || input.windowEnd.getTime() <= input.windowStart.getTime()) {
    return { ok: false, error: "window-invalid" };
  }
  if (input.windowEnd.getTime() <= now.getTime()) return { ok: false, error: "window-ended" };
  const expires = Math.min(input.windowEnd.getTime() + SHARE_GRACE_MS, now.getTime() + MAX_SHARE_LIFETIME_MS);
  return {
    ok: true,
    share: {
      version: 1,
      id,
      originLabel: origin,
      destinationLabel: destination,
      windowStart: input.windowStart.toISOString(),
      windowEnd: input.windowEnd.toISOString(),
      notes,
      createdAt: now.toISOString(),
      expiresAt: new Date(expires).toISOString(),
    },
  };
}

export function isTripShareExpired(share: Pick<TripShare, "expiresAt">, now: Date): boolean {
  return now.getTime() >= new Date(share.expiresAt).getTime();
}

export function encodeTripShare(share: TripShare): string {
  return TRIP_SHARE_PREFIX + JSON.stringify(share);
}

const isoDate = (value: unknown): value is string => typeof value === "string" && !Number.isNaN(Date.parse(value));

function parseShare(value: unknown): TripShare | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const labelsOk = [v.originLabel, v.destinationLabel].every((x) => typeof x === "string" && x.length > 0 && x.length <= MAX_LABEL_LENGTH);
  const notesOk = typeof v.notes === "string" && v.notes.length <= MAX_NOTES_LENGTH;
  if (v.version !== 1 || typeof v.id !== "string" || v.id.length === 0 || !labelsOk || !notesOk) return null;
  if (![v.windowStart, v.windowEnd, v.createdAt, v.expiresAt].every(isoDate)) return null;
  return value as TripShare;
}

/** Decode a pasted payload. Expired or revoked payloads reveal no trip details. */
export function decodeTripShare(text: string, now: Date, revokedIds: readonly string[] = []): DecodedTripShare {
  const trimmed = text.trim();
  if (!trimmed.startsWith(TRIP_SHARE_PREFIX)) return { status: "invalid" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed.slice(TRIP_SHARE_PREFIX.length));
  } catch {
    return { status: "invalid" };
  }
  const share = parseShare(parsed);
  if (!share) return { status: "invalid" };
  if (revokedIds.includes(share.id)) return { status: "revoked" };
  if (isTripShareExpired(share, now)) return { status: "expired", expiresAt: share.expiresAt };
  return { status: "live", share };
}

/** Returns a new revocation list that includes the id. */
export function revokeTripShare(revokedIds: readonly string[], id: string): string[] {
  return revokedIds.includes(id) ? [...revokedIds] : [...revokedIds, id];
}
