/** Contract owner: @access-main/data-client. Keep in sync until published. */
export type Tranche = "venue" | "washroom" | "transit" | "path";
export interface FieldValue {
  value: unknown | "UNKNOWN";
  source_id: string;
  licence: string;
  retrieved_at: string;
  tier: string;
  source_key?: string;
  raw?: unknown;
  derived?: boolean;
}
export interface PackRecord {
  id: string;
  tranche: Tranche;
  region: string;
  fields: Record<string, FieldValue>;
}
export interface PackSourceEntry {
  sourceId: string;
  name: string;
  licence: string;
  licenceUrl?: string;
  attribution?: string;
  retrieved: string;
  shareAlike?: boolean;
  inWebPack: boolean;
  heldReason?: string | null;
}
export interface PackManifest {
  version: number;
  builtAt: string;
  sourceCommit: string;
  sources: PackSourceEntry[];
  regions: Array<{ id: string; label: { en: string; fr: string }; bbox: [number, number, number, number]; cells: string[] }>;
  tranches: Partial<Record<Tranche, { cells: Record<string, { bbox: [number, number, number, number]; parts: Array<{ sourceId: string; count: number; path: string }> }> }>>;
  search: Record<string, { path: string; count: number }>;
  counts: { records: number; byTranche: Record<string, number>; bySource: Record<string, number> };
}
export interface SearchHit { id: string; tranche: Tranche; name: string | null; nameNorm: string; lat: number; lon: number }
export interface RegionStatus { id: string; [key: string]: unknown }
export interface PackSource {
  manifest(): Promise<PackManifest>;
  cellsFor(area: { bbox: [number, number, number, number] } | { lat: number; lon: number; radiusM: number }): Promise<string[]>;
  records(tranche: Tranche, cell: string, signal?: AbortSignal): AsyncIterable<PackRecord>;
  search(text: string, opts: { near?: { lat: number; lon: number }; tranches?: Tranche[]; limit?: number }): Promise<SearchHit[]>;
  get(id: string): Promise<PackRecord | null>;
  sourcesFor(record: PackRecord): PackSourceEntry[];
  regions(): Promise<RegionStatus[]>;
  downloadRegion(id: string, onProgress?: (done: number, total: number) => void): Promise<RegionStatus>;
  deleteRegion(id: string): Promise<void>;
}
