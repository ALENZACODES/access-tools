/** Compatibility types only. Canonical pack contracts are owned by @access-main/data-client.
 * Keep this adapter local until integration; do not claim it defines the upstream schema.
 */
export type Licence = 'ODbL' | 'OGL-Ontario' | 'OGL-Canada' | 'CC-BY' | 'CC0';
export type Answer = 'yes' | 'no' | 'UNKNOWN';
export type EssentialKey =
  | 'washroom_wheelchair' | 'parking_accessible' | 'adult_change_table'
  | 'hoist' | 'open_without_purchase' | 'staff_refuel' | 'charging';

export interface PackFact {
  value: Answer;
  source_id: string;
  licence: Licence;
  retrieved_at: string;
  tier: 0 | 1 | 2 | 3;
  source_key?: string;
  raw?: unknown;
  derived?: boolean;
}
export interface PackRecord {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  /** Canonical field envelope; absent means UNKNOWN. */
  fields: Partial<Record<EssentialKey, PackFact>>;
  /** Hold any record pending licence verification; no default approval. */
  held?: boolean;
  licence?: Licence;
  source_id?: string;
}
export interface SourceRegistryEntry {
  name: string;
  licence?: Licence;
  confirmed: boolean;
  held?: boolean;
}
export type SourceRegistry = Readonly<Record<string, SourceRegistryEntry>>;
export type PackSource = Iterable<PackRecord> | AsyncIterable<PackRecord>;
