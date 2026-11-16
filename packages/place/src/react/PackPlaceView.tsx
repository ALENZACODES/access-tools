import { useState } from "react";
import type { EquipmentProfile } from "../profile.js";
import { fetchCommonsPhoto, commonsTitle, type CommonsPhoto } from "../pack/commons.js";
import { copy } from "../i18n.js";
import { fitItemLine, packFieldLabel, photoCreditLine, recordedLine, sourceIdIsOsm } from "../pack/catalog.js";
import { fitWithProfile } from "../pack/fit.js";
import type { PackField, PackRecord, PackSourceEntry } from "../pack/pack-types.js";
import { fromPackRecord, type PackDetail } from "../pack/projection.js";
import type { Lang } from "../types.js";

export interface PackPlaceViewProps {
  record: PackRecord;
  sources: PackSourceEntry[];
  lang?: Lang;
  profile?: EquipmentProfile | null;
  /** Optional for tests; by default no network is used until the visitor requests a photo. */
  photoRequest?: typeof fetch;
}


const targetStyle = { display: "inline-flex", alignItems: "center", minHeight: 44, minWidth: 44, padding: 8, boxSizing: "border-box" } as const;

function acceptedSources(sources: PackSourceEntry[]): PackSourceEntry[] {
  return sources.filter((source) => !source.heldReason && source.inWebPack !== false);
}

function dropHeldFields(record: PackRecord, sources: PackSourceEntry[]): PackRecord {
  const allowed = new Set(sources.map((source) => source.sourceId));
  return {
    ...record,
    fields: Object.fromEntries(Object.entries(record.fields).filter(([, field]) => allowed.has(field.source_id))),
  };
}

function formatValue(value: unknown, lang: Lang): string {
  if (value === null || value === undefined || value === "UNKNOWN" || value === "") return copy("pack.unknown", lang);
  if (typeof value === "boolean") return value ? copy("pack.yes", lang) : copy("pack.no", lang);
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value) ?? copy("pack.unknown", lang);
}

function isOsm(source: PackSourceEntry | null, field: PackField | null): boolean {
  return Boolean(source?.sourceId.startsWith("osm") || /openstreetmap|odbl/i.test(`${source?.attribution ?? ""} ${field?.licence ?? ""}`));
}

function Evidence({ detail, lang }: { detail: PackDetail; lang: Lang }) {
  const { field, source } = detail;
  if (!field) return <span>{copy("pack.unknown", lang)}</span>;
  const licence = source?.licence || field.licence;
  return (
    <span>
      {source?.name ?? field.source_id ?? copy("pack.source-missing", lang)} · {licence} · {field.retrieved_at || source?.retrieved || copy("pack.unknown", lang)} · {copy("pack.tier", lang)} {String(field.tier ?? copy("pack.unknown", lang))}
      {source?.licenceUrl?.startsWith("https://") ? <>{" "}<a href={source.licenceUrl} rel="noopener noreferrer" style={targetStyle}>{copy("pack.licence", lang)}</a></> : null}
      {isOsm(source, field) ? <>{" · "}<a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer" style={targetStyle}>{copy("pack.osm", lang)}</a></> : null}
    </span>
  );
}

function FactRow({ detail, lang }: { detail: PackDetail; lang: Lang }) {
  return (
    <tr id={`pack-field-${encodeURIComponent(detail.key)}`}>
      <th scope="row">{packFieldLabel(detail.key, lang)}</th>
      <td>{formatValue(detail.value, lang)}</td>
      <td><Evidence detail={detail} lang={lang} /></td>
    </tr>
  );
}

function FactTable({ rows, lang, title }: { rows: PackDetail[]; lang: Lang; title: string }) {
  if (!rows.length) return <p>{copy("pack.no-fields", lang)}</p>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table>
        <caption>{title}</caption>
        <thead><tr><th scope="col">{copy("pack.field", lang)}</th><th scope="col">{copy("pack.value", lang)}</th><th scope="col">{copy("pack.source", lang)}, {copy("pack.licence", lang)}, {copy("pack.retrieved", lang)}, {copy("pack.tier", lang)}</th></tr></thead>
        <tbody>{rows.map((row) => <FactRow key={row.id} detail={row} lang={lang} />)}</tbody>
      </table>
    </div>
  );
}

function PhotoPanel({ record, lang, request }: { record: PackRecord; lang: Lang; request?: typeof fetch }) {
  const field = record.fields.wikimedia_commons ?? record.fields.image;
  const title = commonsTitle(field?.value);
  const [state, setState] = useState<"idle" | "loading" | "unavailable" | "error" | "ready">("idle");
  const [photo, setPhoto] = useState<CommonsPhoto | null>(null);
  // A new record remounts this keyed component; stale responses cannot replace another place's photograph.
  async function show(): Promise<void> {
    if (!title || state === "loading") return;
    setState("loading");
    try {
      const result = await fetchCommonsPhoto(title, request);
      setPhoto(result);
      setState(result ? "ready" : "unavailable");
    } catch {
      setState("error");
    }
  }
  if (!title) return <p>{copy("pack.photo-none", lang)}. <a href="/contribute" style={targetStyle}>{copy("pack.photo-add", lang)}</a></p>;
  return (
    <section aria-live="polite">
      {state === "idle" || state === "error" ? <button type="button" onClick={() => void show()} style={{ minWidth: 44, minHeight: 44 }}>{copy("pack.photo-show", lang)}</button> : null}
      {state === "loading" ? <p>{copy("pack.photo-loading", lang)}</p> : null}
      {state === "error" ? <p>{copy("pack.photo-error", lang)}</p> : null}
      {state === "unavailable" ? <p>{copy("pack.photo-unavailable", lang)}. <a href="/contribute" style={targetStyle}>{copy("pack.photo-add", lang)}</a></p> : null}
      {state === "ready" && photo ? (
        <figure>
          <a href={photo.pageUrl} rel="noopener noreferrer" target="_blank"><img src={photo.thumbUrl} alt={photo.title.slice(5)} loading="lazy" /></a>
          <figcaption>{photoCreditLine(photo.author || copy("pack.commons-credit", lang), lang)}. <a href={photo.licenceUrl} rel="noopener noreferrer" style={targetStyle}>{photo.licence}</a></figcaption>
        </figure>
      ) : null}
    </section>
  );
}

/** Place detail for real venue, washroom, and transit web-pack records. */
export function PackPlaceView({ record, sources, lang = "en", profile = null, photoRequest }: PackPlaceViewProps) {
  const visibleSources = acceptedSources(sources);
  const visibleRecord = dropHeldFields(record, visibleSources);
  const place = fromPackRecord(visibleRecord, visibleSources);
  const fit = fitWithProfile(place, profile);
  const present = new Set(place.allDetails.map((item) => item.key));
  const coreDetails = Object.values(place.facts).filter((detail) => present.has(detail.key));
  const showDetails = [...coreDetails, ...Object.values(place.facts).filter((detail) => !present.has(detail.key))];
  const category = copy(record.tranche === "washroom" ? "pack.washroom" : record.tranche === "transit" ? "pack.transit" : record.tranche === "path" ? "pack.path" : "pack.venue", lang);
  const osm = place.allDetails.some((detail) => isOsm(detail.source, detail.field)) || sources.some((source) => sourceIdIsOsm(source.sourceId));
  return (
    <article lang={lang}>
      <header>
        <h1>{place.name ?? copy("pack.unnamed", lang)}</h1>
        <p>{category} · {place.region} · {recordedLine(place.id, lang)}</p>
        {osm ? <p><a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer" style={targetStyle}>{copy("pack.osm", lang)}</a></p> : null}
      </header>
      <section aria-labelledby="pack-fit-heading">
        <h2 id="pack-fit-heading">{copy("pack.fit", lang)}</h2>
        <p>{copy("pack.profile", lang)}</p>
        <ul>{fit.map((item) => (
          <li key={item.need}>
            {fitItemLine(item.need, item.status, lang)}{" "}
            <a href={`#pack-field-${encodeURIComponent(item.decidingField)}`} style={targetStyle}>{packFieldLabel(item.decidingField, lang)}</a>
          </li>
        ))}</ul>
      </section>
      <section aria-labelledby="pack-detail-heading">
        <h2 id="pack-detail-heading">{copy("pack.details", lang)}</h2>
        <FactTable rows={showDetails} title={copy("pack.details", lang)} lang={lang} />
      </section>
      <section aria-labelledby="pack-other-heading">
        <h2 id="pack-other-heading">{copy("pack.other", lang)}</h2>
        <FactTable rows={place.otherDetails} title={copy("pack.other", lang)} lang={lang} />
      </section>
      <PhotoPanel key={visibleRecord.id} record={visibleRecord} lang={lang} request={photoRequest} />
      <nav aria-label={copy("pack.correction", lang)}>
        <a href={`/contribute?place=${encodeURIComponent(visibleRecord.id)}&action=correction`} style={targetStyle}>{copy("pack.correction", lang)}</a>{" · "}
        <a href={`/contribute?place=${encodeURIComponent(visibleRecord.id)}&action=photo`} style={targetStyle}>{copy("pack.photo-add", lang)}</a>
      </nav>
    </article>
  );
}
