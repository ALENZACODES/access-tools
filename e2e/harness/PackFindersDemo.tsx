import { useEffect, useState } from "react";
import { PackFindersPage } from "../../packages/finders/src/react/PackFindersPage.js";
import type { FinderLang } from "../../packages/finders/src/pack-finders.js";
import type { PackManifest, PackRecord, PackSource, PackSourceEntry, Tranche } from "../../packages/finders/src/pack-types.js";

const open: PackSourceEntry = {
  sourceId: "osm-ontario",
  name: "OpenStreetMap",
  licence: "ODbL-1.0",
  retrieved: "2026-11-01",
  attribution: "© OpenStreetMap contributors, ODbL",
  inWebPack: true,
};

function record(id: string, tranche: Tranche, fields: Record<string, unknown>): PackRecord {
  return {
    id,
    tranche,
    region: "toronto",
    fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, { value, source_id: open.sourceId, licence: "ODbL-1.0", retrieved_at: "2026-11-01", tier: "source" }])),
  };
}

const fixtures: PackRecord[] = [
  record("adult-yes", "washroom", { name: "Kingston washroom", adult_changing_table: "yes", wheelchair: "yes" }),
  record("generic-yes", "washroom", { name: "Public toilet", changing_table: "yes" }),
  record("parking", "venue", { name: "Parking lot", amenity: "parking", capacity_disabled: 3 }),
];

const manifest: PackManifest = {
  version: 1,
  builtAt: "2026-11-01",
  sourceCommit: "test",
  sources: [open],
  regions: [{ id: "toronto", label: { en: "Toronto", fr: "Toronto" }, bbox: [-80, 43, -79, 44], cells: ["n43.5_w079.5"] }],
  tranches: {},
  search: {},
  counts: { records: fixtures.length, byTranche: {}, bySource: {} },
};

const source: PackSource = {
  manifest: async () => manifest,
  cellsFor: async () => ["n43.5_w079.5"],
  async *records(tranche) { for (const value of fixtures) if (value.tranche === tranche) yield value; },
  search: async (text) => fixtures.filter((value) => String(value.fields.name?.value).toLowerCase().includes(text.toLowerCase())).map((value) => ({ id: value.id, tranche: value.tranche, name: String(value.fields.name?.value), nameNorm: "", lat: 43.7, lon: -79.5 })),
  get: async (id) => fixtures.find((value) => value.id === id) ?? null,
  sourcesFor: () => [open],
  regions: async () => [],
  downloadRegion: async () => ({ id: "toronto" }),
  deleteRegion: async () => {},
};

const toggleStyle = { minHeight: 44, minWidth: 44, padding: 8, font: "inherit" as const };

/** Harness-only host. The shell module does not import this file. */
export function PackFindersDemo() {
  const [lang, setLang] = useState<FinderLang>("en");
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  return (
    <div data-screen="pack-finders">
      <button type="button" style={toggleStyle} onClick={() => setLang((current) => current === "en" ? "fr" : "en")}>
        {lang === "en" ? "Français" : "English"}
      </button>
      <PackFindersPage source={source} lang={lang} />
    </div>
  );
}
