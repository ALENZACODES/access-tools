import { useState } from "react";
import { catalog } from "./catalog.js";
import { DEMONSTRATION_LISTINGS } from "./data.js";
import { commuteStatus, joinWorkplace } from "./join.js";
import type { EmploymentListing, Language, SourcedFact } from "./types.js";
import "./style.css";

function Fact({ fact, label, language }: { fact: SourcedFact; label: string; language: Language }) {
  const t = catalog[language];
  return (
    <li className="fact">
      <strong>{label}{language === "fr" ? "\u00a0:" : ":"} {fact.value === "Unknown" ? t.unknown : String(fact.value)}</strong>
      <dl>
        <div><dt>{t.source}</dt><dd>{fact.source}</dd></div>
        <div><dt>{t.licence}</dt><dd>{fact.licence}</dd></div>
        <div><dt>{t.date}</dt><dd>{fact.date}</dd></div>
        <div><dt>{t.tier}</dt><dd>{fact.tier}</dd></div>
      </dl>
    </li>
  );
}

function Detail({ listing, language }: { listing: EmploymentListing; language: Language }) {
  const t = catalog[language];
  const place = joinWorkplace(listing, []);
  const access = place ?? listing.access;
  return (
    <section className="detail" aria-labelledby="detail-title">
      <h2 id="detail-title">{t.detail}</h2>
      <h3>{listing.title[language]}</h3>
      <p className="notice">{t.demo}</p>
      <p><strong>{t.organisation}{language === "fr" ? "\u00a0:" : ":"}</strong> {listing.organisation[language]}</p>
      <p><strong>{t.location}{language === "fr" ? "\u00a0:" : ":"}</strong> {listing.location.city[language]}, {listing.location.province}</p>
      <p><a href={listing.officialUrl} target="_blank" rel="noopener noreferrer">{t.officialLink}</a></p>
      <h3>{t.place}</h3>
      {!place && <p>{t.noPlace}</p>}
      <h3>{t.access}</h3>
      <ul className="facts">
        <Fact fact={access.stepFreeEntry} label={t.entry} language={language}/>
        <Fact fact={access.accessibleWashroom} label={t.washroom} language={language}/>
        <Fact fact={access.workstation} label={t.workstation} language={language}/>
      </ul>
      <h3>{t.commute}</h3>
      {commuteStatus(listing) === "Unknown" && <p role="status">{t.commuteUnknown}</p>}
      <section aria-labelledby="handoff-title">
        <h3 id="handoff-title">{t.handoff}</h3>
        <p>{t.handoffIntro}</p>
        <p>{listing.handoff.note[language]}</p>
        <p><strong>{t.date}{language === "fr" ? "\u00a0:" : ":"}</strong> {listing.handoff.datedOn}</p>
        <a href={listing.handoff.url} rel="noopener noreferrer" target="_blank">{t.handoffLink}</a>
      </section>
      <h3>{t.related}</h3>
      <ul>{listing.relatedNavigatorIds.map((id) => <li key={id}><code>{id}</code></li>)}</ul>
      <p>{t.noDecision}</p>
    </section>
  );
}

export function EmploymentView({ initialLanguage = "en" }: { initialLanguage?: Language }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [selectedId, setSelectedId] = useState(DEMONSTRATION_LISTINGS[0]?.id);
  const t = catalog[language];
  const selected = DEMONSTRATION_LISTINGS.find((item) => item.id === selectedId);
  return (
    <main className="employment" lang={language}>
      <header>
        <h1>{t.pageTitle}</h1>
        <label htmlFor="language">{t.language}</label>
        <select id="language" value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
          <option value="en">{t.english}</option>
          <option value="fr">{t.french}</option>
        </select>
        <p>{t.intro}</p>
      </header>
      <div className="columns">
        <section aria-labelledby="list-title">
          <h2 id="list-title">{t.listings}</h2>
          <ul className="listing-list">{DEMONSTRATION_LISTINGS.map((item) => (
            <li key={item.id}>
              <h3>{item.title[language]}</h3>
              <p>{item.kind === "job" ? t.job : t.programme} · {item.location.city[language]}</p>
              <button type="button" aria-pressed={selectedId === item.id} onClick={() => setSelectedId(item.id)}>
                {t.select}: {item.title[language]}
              </button>
            </li>
          ))}</ul>
        </section>
        {selected && <Detail key={selected.id} listing={selected} language={language}/>}
      </div>
    </main>
  );
}
