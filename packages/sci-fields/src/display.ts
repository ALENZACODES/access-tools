import { ALIASES } from "./aliases";
import { CATALOG } from "./catalog";
import { validateFactShape } from "./schema";
import type { FieldDef, Lang, SciFieldFact, Tier } from "./types";

export const UNKNOWN: Record<Lang, string> = { en: "Unknown", fr: "Inconnu" };
const UI = {
  en: { source: "Source", licence: "Licence", checked: "Last checked", retrieved: "Retrieved", tier: "Tier", osm: "© OpenStreetMap contributors, ODbL" },
  fr: { source: "Source", licence: "Licence", checked: "Dernière vérification", retrieved: "Récupéré le", tier: "Niveau", osm: "© Contributeurs d’OpenStreetMap, ODbL" },
};

export function resolveId(id: string): string { return ALIASES[id] ?? id; }
export function getDef(id: string): FieldDef {
  const d = CATALOG.find((f) => f.id === resolveId(id));
  if (!d) throw new Error(`Unknown field id: ${id}`);
  return d;
}
export function label(id: string, lang: Lang): string { return getDef(id).label[lang]; }

/** Every field is UNKNOWN until a fact with provenance says otherwise. */
export function unknownFact(id: string): SciFieldFact { return { field: getDef(id).id, value: "UNKNOWN" }; }

/** This lane may only create tier 0 or 1 facts; tiers 2-3 need evidence recorded elsewhere. */
export function makeFact(f: SciFieldFact): SciFieldFact {
  if (f.tier === undefined || f.tier > 1) throw new Error("sci-fields does not assign tier 2 or 3, and a tier is required");
  const fact = { ...f, field: resolveId(f.field) };
  if (!validateFactShape(fact)) throw new Error(JSON.stringify(validateFactShape.errors));
  return fact;
}

function valueText(def: FieldDef, v: SciFieldFact["value"], lang: Lang): string | null {
  if (v === "UNKNOWN") return null;
  if (def.kind === "number") return typeof v === "number" ? `${v} ${def.unit ?? ""}`.trim() : null;
  if (def.kind === "text") return typeof v === "string" ? v : null;
  if (def.kind === "boolean") {
    if (typeof v !== "boolean") return null;
    return def.values?.[v ? "yes" : "no"]?.[lang] ?? null;
  }
  return typeof v === "string" ? (def.values?.[v]?.[lang] ?? null) : null;
}

/** Renders Unknown/Inconnu unless a valid tier 1+ fact exists. Tier 0 drafts never render as facts. */
export function formatFact(fact: SciFieldFact | null | undefined, lang: Lang): string {
  const unknown = UNKNOWN[lang];
  if (!fact || !validateFactShape(fact)) return unknown;
  const def = CATALOG.find((f) => f.id === fact.field)!;
  const text = valueText(def, fact.value, lang);
  const tier = fact.tier as Tier | undefined;
  if (text === null || tier === undefined || tier < 1) return unknown;
  const ui = UI[lang];
  const date = String(fact.retrieved_at).slice(0, 10);
  const dated = def.expiry === "visit" || def.expiry === "short" ? ui.checked : ui.retrieved;
  const parts = [`${text}`, `${ui.source}: ${fact.source_id}`, `${ui.licence}: ${fact.licence}`, `${dated}: ${date}`, `${ui.tier}: ${tier}`];
  if (fact.licence === "ODbL") parts.push(ui.osm);
  return parts.join(" \u2014 ");
}
