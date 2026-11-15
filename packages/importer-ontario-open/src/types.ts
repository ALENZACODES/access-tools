export const OPEN_LICENCES = ['ODbL', 'OGL-Ontario', 'OGL-Canada', 'CC-BY', 'CC0'] as const;
export type OpenLicence = (typeof OPEN_LICENCES)[number];
export type SourceKind = 'facility' | 'address' | 'adult-change-held' | 'adult-change-open';
export type InputRow = Record<string, unknown>;

export interface SourceConfig {
  id: string;
  kind: SourceKind;
  licence: string;
  licence_confirmed: boolean;
  retrieved_at: string;
  input_origin: string;
}

export interface AccessFact {
  value: boolean | string | 'UNKNOWN';
  source_id: string;
  licence: OpenLicence;
  retrieved_at: string;
  tier: 0 | 1;
  source_key?: string;
  raw?: unknown;
  derived?: boolean;
}

export interface ImportedRecord {
  id: string;
  source_id: string;
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  cell_id: string;
  silo: 'odbl' | 'open';
  licence: OpenLicence;
  retrieved_at: string;
  tier: 0 | 1;
  fields: Record<string, AccessFact>;
  raw_publisher_score?: string;
  provenance: {
    source_id: string;
    input_origin: string;
    licence: OpenLicence;
    retrieved_at: string;
    share_alike: boolean;
    prototypeLabel: "SEEDED-OPEN-DATA";
  };
}

export interface RunReport {
  source_id: string;
  status: 'imported' | 'held';
  reason?: string;
  records: number;
  retrieved_at: string;
  licence: string;
}
