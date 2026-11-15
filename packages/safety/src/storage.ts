/** Light per-device storage. Reads and writes never throw. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const KEYS = {
  checkIn: "access-safety.check-in",
  share: "access-safety.trip-share",
  revoked: "access-safety.revoked-shares",
} as const;

export function defaultStore(): KeyValueStore | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function readJson<T>(store: KeyValueStore | null, key: string, guard: (value: unknown) => value is T): T | null {
  try {
    const raw = store?.getItem(key);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return guard(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeJson(store: KeyValueStore | null, key: string, value: unknown): void {
  try {
    if (value === null) store?.removeItem(key);
    else store?.setItem(key, JSON.stringify(value));
  } catch {
    /* storage can be unavailable or full; the app keeps working in memory */
  }
}
