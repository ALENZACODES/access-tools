import { useState } from "react";
import { CATALOG, FIELD_KEYS } from "./catalog.js";
import { DEMONSTRATION_ROOMS } from "./fixtures.js";
import { filterRooms } from "./filter.js";
import { DepthFinder } from "./DepthFinder.js";
import { EvidenceForm } from "./EvidenceForm.js";
import type { HousingRoom, Language } from "./types.js";
import "./styles.css";

function describeValue(value: string | number | null, lang: Language): string {
  const t = CATALOG[lang];
  if (value === null) return t.unknown;
  if (typeof value === "number") return String(value);
  if (value in t.sides) return t.sides[value as keyof typeof t.sides];
  return value;
}

function RoomCard({ room, lang }: { room: HousingRoom; lang: Language }) {
  const t = CATALOG[lang];
  return <article className="room" aria-labelledby={`${room.id}-title`}>
    <h3 id={`${room.id}-title`}>{room.name[lang]}</h3>
    <p>{room.city}, ON · {t.types[room.placeType]}</p>
    <dl>{FIELD_KEYS.map((key) => {
      const fact = room.facts[key];
      const provenance = fact.provenance;
      return <div className="fact" key={key}>
        <dt>{t.fields[key]}</dt>
        <dd><strong>{describeValue(fact.value, lang)}</strong>
          {provenance && <span className="provenance">{t.tier}: {provenance.tier} · {t.source}: {provenance.sourceName} · {t.date}: {provenance.sourceDate} · {t.licence}: {provenance.licence}</span>}
          {!provenance && <span className="provenance">{t.source}: {t.unknown} · {t.date}: {t.unknown} · {t.tier}: {t.unknown} · {t.licence}: {t.unknown}</span>}
        </dd>
      </div>;
    })}</dl>
  </article>;
}

export function HousingFinder() {
  const [lang, setLang] = useState<Language>("en");
  const [city, setCity] = useState("");
  const [minimumDoorWidth, setMinimumDoorWidth] = useState("");
  const [requireElevator, setRequireElevator] = useState(false);
  const t = CATALOG[lang];
  const matches = filterRooms(DEMONSTRATION_ROOMS, { city, minimumDoorWidth, requireElevator });
  const reset = () => { setCity(""); setMinimumDoorWidth(""); setRequireElevator(false); };
  return <main>
    <header>
      <label htmlFor="language">{t.language}</label>
      <select id="language" value={lang} onChange={(e) => setLang(e.target.value as Language)}>
        <option value="en">English</option><option value="fr">Français</option>
      </select>
      <h1>{t.title}</h1>
      <p className="notice">{t.demo}</p>
      <p className="notice">{t.boundary}</p>
    </header>
    <section aria-labelledby="filters-heading">
      <h2 id="filters-heading">{t.filters}</h2>
      <div className="controls">
        <div><label htmlFor="city">{t.city}</label><select id="city" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">{t.allCities}</option>{[...new Set(DEMONSTRATION_ROOMS.map((r) => r.city))].map((name) => <option key={name}>{name}</option>)}
        </select></div>
        <div><label htmlFor="door-width">{t.width}</label><input id="door-width" type="number" min="0" step="1" inputMode="numeric" value={minimumDoorWidth} onChange={(e) => setMinimumDoorWidth(e.target.value)} /></div>
        <div className="checkbox"><input type="checkbox" id="elevator" checked={requireElevator} onChange={(e) => setRequireElevator(e.target.checked)} /><label htmlFor="elevator">{t.elevator}</label></div>
      </div>
      <p>{t.explanation}</p>
    </section>
    <section aria-labelledby="results-heading">
      <h2 id="results-heading">{t.results}</h2>
      <p role="status">{matches.length} {t.found}</p>
      {matches.length === 0 ? <div className="empty">
        <p>{t.noResults} {t.city}: {city || t.allCities}; {t.width}: {minimumDoorWidth || "—"}; {t.elevator}: {requireElevator ? t.sides.yes : t.sides.no}.</p>
        <button type="button" onClick={reset}>{t.broaden}</button>
      </div> : <div className="rooms">{matches.map((room) => <RoomCard key={room.id} room={room} lang={lang} />)}</div>}
    </section>
    <DepthFinder lang={lang} />
    <EvidenceForm lang={lang} />
  </main>;
}
