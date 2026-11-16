/** Contract owned by @access-main/data-client; duplicated until publication. */
export type PackTranche = "venue" | "washroom" | "transit" | "path";

export interface PackField {
  value: unknown | "UNKNOWN";
  source_id: string;
  licence: string;
  retrieved_at: string;
  tier: string | number;
  source_key?: string;
  raw?: unknown;
  derived?: unknown;
}

export interface PackRecord {
  id: string;
  tranche: PackTranche;
  region: string;
  fields: Record<string, PackField>;
}

export interface PackSourceEntry {
  sourceId: string;
  name: string;
  licence: string;
  licenceUrl?: string | null;
  attribution?: string | null;
  retrieved?: string;
  shareAlike?: boolean;
  inWebPack?: boolean;
  heldReason?: string | null;
}
