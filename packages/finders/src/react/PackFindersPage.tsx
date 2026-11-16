import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { finderCopy, finderFill, packFieldLabel } from "../i18n.js";
import { FINDER_KIND_KEYS, FINDER_KINDS, queryPackFinders, type FinderKind, type FinderLang, type PackFinderResult, type PackFinderRow } from "../pack-finders.js";
import type { PackSource } from "../pack-types.js";

const control: CSSProperties = { minHeight: 44, minWidth: 44, padding: 8, margin: 4, boxSizing: "border-box", font: "inherit" };
const checkLabel: CSSProperties = { display: "inline-flex", alignItems: "center", minHeight: 44, minWidth: 44, gap: 8, margin: 4 };
const checkBox: CSSProperties = { minHeight: 44, minWidth: 44, margin: 0, flex: "0 0 44px" };
const contributeLink: CSSProperties = { display: "inline-flex", alignItems: "center", minHeight: 44, minWidth: 44, padding: 8, boxSizing: "border-box" };

export interface PackFindersPageProps { source: PackSource; lang?: FinderLang }

function resultCountMessage(result: PackFinderResult, lang: FinderLang): string {
  if (result.kind === "changing" || result.unknownRows.length > 0) {
    return finderFill("finder.pack.count-groups", lang, { known: result.rows.length, unknown: result.unknownRows.length });
  }
  return finderFill("finder.pack.count", lang, { count: result.count });
}


function ResultList({ rows, lang, headingLevel = 2 }: { rows: PackFinderRow[]; lang: FinderLang; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  return <>
    {rows.map((row) => <article key={`${row.tranche}:${row.id}`} data-pack-row={row.id} style={{ border: "1px solid currentColor", padding: 12, marginBlock: 12 }}>
      <Heading>{row.name === "UNKNOWN" ? finderCopy("finder.unknown", lang) : row.name}</Heading>
      <p>{finderFill("finder.pack.summary", lang, { yes: row.knownYes, no: row.knownNo, unknown: row.unknownNeeds })}</p>
      <dl>{row.fields.map((field) => <div key={field.key} id={`field-${encodeURIComponent(row.id)}-${field.key}`} style={{ paddingBlock: 8 }}>
        <dt><strong>{packFieldLabel(field.key, lang)}</strong></dt>
        <dd>{field.unknown ? finderCopy("finder.unknown", lang) : String(field.value)}
          <small style={{ display: "block" }}>{finderFill("finder.pack.fact-meta", lang, { source: field.source, licence: field.licence, retrieved: field.retrieved, tier: field.tier, attribution: field.attribution })}</small>
        </dd>
      </div>)}</dl>
    </article>)}
  </>;
}

export function PackFindersPage({ source, lang = "en" }: PackFindersPageProps) {
  const [kind, setKind] = useState<FinderKind>("washroom");
  const [text, setText] = useState("");
  const [draft, setDraft] = useState("");
  const [near, setNear] = useState(false);
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [radius, setRadius] = useState("1500");
  const [needs, setNeeds] = useState("");
  const [broaden, setBroaden] = useState(false);
  const [result, setResult] = useState<PackFinderResult | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const validNear = !near || (Number.isFinite(Number(lat)) && lat.trim() !== "" && Math.abs(Number(lat)) <= 90 && Number.isFinite(Number(lon)) && lon.trim() !== "" && Math.abs(Number(lon)) <= 180 && Number(radius) > 0);
  useEffect(() => {
    const controller = new AbortController();
    if (!validNear) return () => controller.abort();
    setLoading(true);
    setError(false);
    void queryPackFinders(source, {
      kind, text, broaden,
      needs: needs.split(",").map((need) => need.trim()).filter(Boolean),
      ...(near ? { near: { lat: Number(lat), lon: Number(lon), radiusM: Number(radius) } } : {}),
      signal: controller.signal,
    }).then((next) => { if (!controller.signal.aborted) setResult(next); })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [source, kind, text, near, lat, lon, radius, needs, broaden, revision, validNear]);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setText(draft); setRevision((n) => n + 1); }
  const empty = !loading && !error && result !== null && result.rows.length === 0 && result.unknownRows.length === 0;
  return <main lang={lang} data-pack-finders="" style={{ maxWidth: 950, margin: "auto", padding: 16 }}>
    <h1>{finderCopy("finder.pack.title", lang)}</h1>
    <form onSubmit={submit}>
      <label htmlFor="finder-kind">{finderCopy("finder.pack.kind", lang)}</label>
      <select id="finder-kind" style={control} value={kind} onChange={(event) => setKind(event.target.value as FinderKind)}>
        {FINDER_KINDS.map((item) => <option key={item} value={item}>{finderCopy(FINDER_KIND_KEYS[item], lang)}</option>)}
      </select>
      <label htmlFor="finder-destination">{finderCopy("finder.destination", lang)}</label>
      <input id="finder-destination" style={control} value={draft} onChange={(event) => setDraft(event.target.value)} />
      <button type="submit" style={control}>{finderCopy("finder.pack.search", lang)}</button>
      <div>
        <label htmlFor="finder-near" style={checkLabel}>
          <input id="finder-near" type="checkbox" style={checkBox} checked={near} onChange={(event) => setNear(event.target.checked)} />
          {finderCopy("finder.pack.near", lang)}
        </label>
      </div>
      {near && <div>
        <label htmlFor="finder-lat">{finderCopy("finder.pack.lat", lang)}</label><input id="finder-lat" type="number" step="any" required style={control} value={lat} onChange={(event) => setLat(event.target.value)} />
        <label htmlFor="finder-lon">{finderCopy("finder.pack.lon", lang)}</label><input id="finder-lon" type="number" step="any" required style={control} value={lon} onChange={(event) => setLon(event.target.value)} />
        <label htmlFor="finder-radius">{finderCopy("finder.pack.radius", lang)}</label><input id="finder-radius" type="number" min="1" required style={control} value={radius} onChange={(event) => setRadius(event.target.value)} />
      </div>}
      <div><label htmlFor="finder-needs">{finderCopy("finder.pack.profile", lang)}</label><input id="finder-needs" style={control} value={needs} onChange={(event) => setNeeds(event.target.value)} /></div>
      <label htmlFor="finder-broaden" style={checkLabel}>
        <input id="finder-broaden" type="checkbox" style={checkBox} checked={broaden} onChange={(event) => setBroaden(event.target.checked)} />
        {finderCopy("finder.pack.broaden", lang)}
      </label>
    </form>
    {kind === "washroom" && <p>{finderCopy("finder.pack.availability", lang)}</p>}
    {kind === "parking" && <p>{finderCopy("finder.pack.parking-notice", lang)}</p>}
    <div role="status" aria-live="polite">{loading ? finderCopy("finder.pack.loading", lang) : error ? finderCopy("finder.pack.error", lang) : result ? resultCountMessage(result, lang) : null}</div>
    {empty && <p>{finderCopy("finder.pack.empty", lang)} <a href="/contribute" style={contributeLink}>{finderCopy("finder.pack.contribute", lang)}</a></p>}
    {!loading && !error && result && result.rows.length > 0 && (kind === "changing"
      ? <section data-pack-known-yes="" aria-labelledby="pack-known-yes">
          <h2 id="pack-known-yes">{finderCopy("finder.pack.known-yes", lang)}</h2>
          <ResultList rows={result.rows} lang={lang} headingLevel={3} />
        </section>
      : <ResultList rows={result.rows} lang={lang} />)}
    {!loading && !error && result && result.unknownRows.length > 0 && <section data-pack-unknown-group="" aria-labelledby="pack-unknown-group">
      <h2 id="pack-unknown-group">{finderCopy("finder.pack.unknown-group", lang)}</h2>
      <p>{finderCopy("finder.pack.unknown-group-note", lang)}</p>
      <ResultList rows={result.unknownRows} lang={lang} headingLevel={3} />
    </section>}
  </main>;
}
