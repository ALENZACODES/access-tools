import { queryPackFinders, type FinderFact, type FinderKind, type PackFinderRow } from "./pack-finders.js";
import type { PackSource } from "./pack-types.js";

/**
 * Adapter for the access-main shell route `/finders`.
 *
 * Shape follows `FindersModule`, `FinderHit`, `ModuleResult`, and `Provenance`
 * in access-main `packages/shared/src`. The shell checks each result with
 * `checkModuleResult` before it lists anything. A finder hit keeps
 * `detail: "unknown"`; measurements are not claimed here.
 *
 * Provenance is taken only from a field the record already carries. A row
 * with no source, licence, date, or prototype-cache tier (0, 1, or E) is
 * left out. Nothing is filled in.
 */
export const SHELL_FINDER_KINDS = ["washroom", "parking", "charging", "repair", "adult-change"] as const;
export type ShellFinderKind = (typeof SHELL_FINDER_KINDS)[number];

export interface ShellFinderContext {
  locale: "en" | "fr";
  offline: boolean;
  nowIso: string;
  query?: string;
}

export interface ShellProvenance {
  source_name: string;
  source_url: string | null;
  licence: string;
  licence_url: string | null;
  source_date: string;
  retrieved_at: string;
  tier: 0 | 1 | "E";
  prototype_label: null;
  freshness: "unknown";
}

export interface ShellFinderHit {
  id: string;
  name: string;
  kind: ShellFinderKind;
  provenance: ShellProvenance;
  detail: "unknown";
}

export interface ShellFinderResult {
  moduleId: "finders";
  availability: "ready" | "error";
  items: ShellFinderHit[];
  messageKey: string;
  asOf: string | null;
  liveStatus: "unavailable";
}

function packKind(kind: ShellFinderKind): FinderKind {
  return kind === "adult-change" ? "changing" : kind;
}

function knownText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text === "UNKNOWN") return null;
  return text;
}

function knownDate(value: unknown): string | null {
  const text = knownText(value);
  if (!text || !/^\d{4}-\d{2}-\d{2}/.test(text)) return null;
  return text;
}

function cacheTier(value: unknown): 0 | 1 | "E" | null {
  if (value === 0 || value === "0") return 0;
  if (value === 1 || value === "1") return 1;
  if (value === "E") return "E";
  return null;
}

/** Null when the row does not already record a usable source, licence, date, and tier. */
export function provenanceFromRow(row: PackFinderRow): ShellProvenance | null {
  const field: FinderFact | undefined = row.fields.find((item) => item.key === "name") ?? row.fields[0];
  if (!field) return null;
  const source_name = knownText(field.source) ?? knownText(field.attribution);
  const licence = knownText(field.licence);
  const source_date = knownDate(field.retrieved);
  const tier = cacheTier(field.tier);
  if (!source_name || !licence || !source_date || tier === null) return null;
  return {
    source_name,
    source_url: null,
    licence,
    licence_url: null,
    source_date,
    retrieved_at: source_date,
    tier,
    prototype_label: null,
    freshness: "unknown",
  };
}

export function emptyFinderResult(messageKey: string, availability: "ready" | "error" = "error"): ShellFinderResult {
  return { moduleId: "finders", availability, items: [], messageKey, asOf: null, liveStatus: "unavailable" };
}

export async function searchFindersForShell(
  source: PackSource,
  query: { kind: ShellFinderKind; text: string },
  _ctx: ShellFinderContext,
): Promise<ShellFinderResult> {
  if (!(SHELL_FINDER_KINDS as readonly string[]).includes(query.kind)) {
    return emptyFinderResult("modules.error");
  }
  try {
    const found = await queryPackFinders(source, { kind: packKind(query.kind), text: query.text ?? "" });
    const items: ShellFinderHit[] = [];
    for (const row of found.rows) {
      const provenance = provenanceFromRow(row);
      if (!provenance) continue;
      items.push({
        id: row.id,
        name: typeof row.name === "string" && row.name.trim() ? row.name : "UNKNOWN",
        kind: query.kind,
        provenance,
        detail: "unknown",
      });
    }
    const dates = items.map((item) => item.provenance.source_date).sort();
    return {
      moduleId: "finders",
      availability: "ready",
      items,
      messageKey: "modules.ready",
      asOf: dates.at(-1) ?? null,
      liveStatus: "unavailable",
    };
  } catch {
    return emptyFinderResult("modules.error");
  }
}
