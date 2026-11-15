export type OutageStatus = "unknown" | "clear" | "disrupted";

/** This prototype may only store these tiers. VERIFIED and tier 3 need an evidence block it does not produce. */
export const PROTOTYPE_TIERS = ["PROTOTYPE-UNVERIFIED", "SEEDED-OPEN-DATA"] as const;
export type PrototypeTier = (typeof PROTOTYPE_TIERS)[number];

export interface OutageSnapshot {
  status: OutageStatus;
  stationOrSegmentId: string | null;
  source: string | null;
  licence: string | null;
  retrievedAt: string | null;
  expiresAt: string | null;
  tier: PrototypeTier;
}

/** No live feed is connected on this branch. The default is unknown, never a guessed outage. */
export const DEFAULT_OUTAGE_SNAPSHOT: OutageSnapshot = {
  status: "unknown",
  stationOrSegmentId: null,
  source: null,
  licence: null,
  retrievedAt: null,
  expiresAt: null,
  tier: "PROTOTYPE-UNVERIFIED",
};

export interface ResolvedOutage {
  status: OutageStatus;
  /** True when the status shown is the honest default, not a usable snapshot. */
  isDefault: boolean;
  snapshot: OutageSnapshot;
}

const timestamp = (x: unknown): x is string => typeof x === "string" && !Number.isNaN(Date.parse(x));
const text = (x: unknown): x is string => typeof x === "string" && x.trim().length > 0;

export function isUsableSnapshot(value: unknown, now: Date): value is OutageSnapshot {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.status !== "clear" && v.status !== "disrupted") return false;
  if (!PROTOTYPE_TIERS.includes(v.tier as PrototypeTier)) return false;
  if (!text(v.stationOrSegmentId) || !text(v.source) || !text(v.licence)) return false;
  if (!timestamp(v.retrievedAt) || !timestamp(v.expiresAt)) return false;
  if (Date.parse(v.expiresAt) <= Date.parse(v.retrievedAt)) return false;
  return now.getTime() < Date.parse(v.expiresAt);
}

/** Anything incomplete, unlicensed, expired or above prototype tiers falls back to unknown. */
export function resolveOutage(snapshot: OutageSnapshot | null | undefined, now: Date): ResolvedOutage {
  if (snapshot && isUsableSnapshot(snapshot, now)) return { status: snapshot.status, isDefault: false, snapshot };
  return { status: "unknown", isDefault: true, snapshot: DEFAULT_OUTAGE_SNAPSHOT };
}
