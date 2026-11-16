import { useState } from "react";
import { BUILDING_FIELDS, ROOM_FIELDS, completeness } from "./depth.js";
import type { DepthRecord } from "./depth.js";
import { DEPTH_CATALOG } from "./depthCatalog.js";
import { NO_DEPTH_FILTERS, searchUnits } from "./depthFilter.js";
import type { DepthFilters, UnitMatch } from "./depthFilter.js";
import { DEMONSTRATION_DEPTH_RECORDS } from "./depthFixtures.js";
import type { Language, Sourced } from "./types.js";

function FactRow({ label, fact, lang }: { label: string; fact: Sourced<string | number> | undefined; lang: Language }) {
  const t = DEPTH_CATALOG[lang];
  const value = !fact || fact.value === null ? t.unknown : typeof fact.value === "number" ? String(fact.value) : t.values[fact.value] ?? fact.value;
  const provenance = fact?.provenance ?? null;
  return <div className="fact">
    <dt>{label}</dt>
    <dd><strong>{value}</strong>
      {provenance
        ? <span className="provenance">{t.tier}: {provenance.tier} ({provenance.prototypeLabel}) · {t.source}: {provenance.sourceName} · {t.date}: {provenance.sourceDate} · {t.licence}: {provenance.licence}</span>
        : <span className="provenance">{t.source}: {t.unknown} · {t.date}: {t.unknown} · {t.tier}: {t.unknown} · {t.licence}: {t.unknown}</span>}
    </dd>
  </div>;
}

function UnitCard({ match: { record, unit }, lang }: { match: UnitMatch; lang: Language }) {
  const t = DEPTH_CATALOG[lang];
  const filled = completeness(record);
  return <article className="unit-card" aria-labelledby={`${unit.id}-title`}>
    <h3 id={`${unit.id}-title`}>{unit.name[lang]}</h3>
    <p>{record.name[lang]} · {record.city}, ON · {t.kindNames[record.kind]}</p>
    <p className="label">{t.fixture}</p>
    <p>{t.boundaries[record.kind]}</p>
    <p>{t.completeness(filled.known, filled.total)}</p>
    <h4>{t.building}</h4>
    <dl>{BUILDING_FIELDS.map((key) => <FactRow key={key} label={t.fields[key]} fact={record.building[key]} lang={lang} />)}</dl>
    {unit.rooms.map((room) => <div className="room-facts" key={room.id}>
      <h4 id={`${room.id}-title`}>{t.roomTypes[room.roomType]}</h4>
      <dl>{ROOM_FIELDS[room.roomType].map((key) => <FactRow key={key} label={t.fields[key]} fact={room.facts[key]} lang={lang} />)}</dl>
    </div>)}
  </article>;
}

export function DepthFinder({ lang, records = DEMONSTRATION_DEPTH_RECORDS }: { lang: Language; records?: readonly DepthRecord[] }) {
  const t = DEPTH_CATALOG[lang];
  const [filters, setFilters] = useState<DepthFilters>(NO_DEPTH_FILTERS);
  const set = <K extends keyof DepthFilters>(key: K, value: DepthFilters[K]) => setFilters({ ...filters, [key]: value });
  const search = searchUnits(records, filters);
  const number = (key: "minDoorWidthMm" | "maxEntranceStepMm" | "minTransferSpaceMm" | "maxBedHeightMm", label: string) => <div>
    <label htmlFor={`depth-${key}`}>{label}</label>
    <input id={`depth-${key}`} type="number" min="0" step="1" inputMode="numeric" value={filters[key]} onChange={(e) => set(key, e.target.value)} />
  </div>;
  const check = (key: "requireElevator" | "requireRollInShower" | "requireHoist", label: string) => <div className="checkbox">
    <input type="checkbox" id={`depth-${key}`} checked={filters[key]} onChange={(e) => set(key, e.target.checked)} />
    <label htmlFor={`depth-${key}`}>{label}</label>
  </div>;
  return <>
    <section aria-labelledby="depth-filters-heading">
      <h2 id="depth-filters-heading">{t.filters}</h2>
      <p>{t.intro}</p>
      <div className="controls">
        <div><label htmlFor="depth-kind">{t.kind}</label><select id="depth-kind" value={filters.kind} onChange={(e) => set("kind", e.target.value as DepthFilters["kind"])}>
          <option value="">{t.kinds[""]}</option><option value="dwelling">{t.kinds.dwelling}</option><option value="overnight">{t.kinds.overnight}</option>
        </select></div>
        <div><label htmlFor="depth-city">{t.city}</label><select id="depth-city" value={filters.city} onChange={(e) => set("city", e.target.value)}>
          <option value="">{t.allCities}</option>{[...new Set(records.map((record) => record.city))].map((name) => <option key={name}>{name}</option>)}
        </select></div>
        {number("minDoorWidthMm", t.minDoor)}
        {number("maxEntranceStepMm", t.maxStep)}
        <div><label htmlFor="depth-side">{t.side}</label><select id="depth-side" value={filters.transferSide} onChange={(e) => set("transferSide", e.target.value as DepthFilters["transferSide"])}>
          <option value="">{t.anySide}</option><option value="left">{t.values.left}</option><option value="right">{t.values.right}</option>
        </select></div>
        {number("minTransferSpaceMm", t.minSpace)}
        {number("maxBedHeightMm", t.maxBed)}
        {check("requireElevator", t.elevator)}
        {check("requireRollInShower", t.rollIn)}
        {check("requireHoist", t.hoist)}
      </div>
      <p>{t.explanation}</p>
      <button type="button" onClick={() => setFilters(NO_DEPTH_FILTERS)}>{t.reset}</button>
    </section>
    <section aria-labelledby="depth-results-heading">
      <h2 id="depth-results-heading">{t.results}</h2>
      <div role="status">
        <p>{t.found(search.matches.length)}</p>
        {search.invalidInput && <p>{t.invalid}</p>}
        {search.excludedForUnknown > 0 && <p>{t.excludedUnknown(search.excludedForUnknown)}</p>}
        {search.excludedForRecorded > 0 && <p>{t.excludedRecorded(search.excludedForRecorded)}</p>}
      </div>
      {search.matches.length === 0
        ? <div className="empty"><p>{t.noResults}</p></div>
        : <div className="rooms">{search.matches.map((match) => <UnitCard key={match.unit.id} match={match} lang={lang} />)}</div>}
    </section>
  </>;
}
