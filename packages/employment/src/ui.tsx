import { useState } from "react";
import { catalog } from "./catalog.js";
import { CommuteCheck } from "./CommuteCheck.js";
import type { CommuteReport } from "./commute.js";
import { DEMONSTRATION_LISTING_RECORDS } from "./data.js";
import { depthCatalog } from "./depthCatalog.js";
import { commuteStatus } from "./join.js";
import { presentListing, presentListings } from "./record.js";
import type { DisplayFact, ListingRecord } from "./record.js";
import { describeFactValue } from "./referral.js";
import { ReferralExport } from "./ReferralExport.js";
import type { Language } from "./types.js";
import "./style.css";

function Fact({ fact, language }: { fact: DisplayFact; language: Language }) {
  const t = depthCatalog[language];
  const colon = language === "fr" ? "\u00a0:" : ":";
  return (
    <li className="fact">
      <strong>{t.facts[fact.key]}{colon} {describeFactValue(fact.value, t)}</strong>
      {fact.provenance ? (
        <dl>
          <div><dt>{t.source}</dt><dd>{fact.provenance.source}</dd></div>
          <div><dt>{t.licence}</dt><dd>{fact.provenance.licence}</dd></div>
          <div><dt>{t.date}</dt><dd>{fact.provenance.date}</dd></div>
          <div><dt>{t.tier}</dt><dd>{fact.provenance.tier}</dd></div>
        </dl>
      ) : <p>{t.noProvenance}</p>}
    </li>
  );
}

function Detail({ record, language }: { record: ListingRecord; language: Language }) {
  const t = catalog[language];
  const d = depthCatalog[language];
  const listing = record.listing;
  const shown = presentListing(record);
  const [commute, setCommute] = useState<CommuteReport | null>(null);
  return (
    <section className="detail" aria-labelledby="detail-title">
      <h2 id="detail-title">{t.detail}</h2>
      <h3>{listing.title[language]}</h3>
      <p className="notice">{t.demo}</p>
      <p><strong>{t.organisation}{language === "fr" ? "\u00a0:" : ":"}</strong> {listing.organisation[language]}</p>
      <p><strong>{t.location}{language === "fr" ? "\u00a0:" : ":"}</strong> {listing.location.city[language]}, {listing.location.province}</p>
      <p><a href={listing.officialUrl} target="_blank" rel="noopener noreferrer">{t.officialLink}</a></p>
      <h3>{t.place}</h3>
      {!record.accessRecord && <p>{t.noPlace}</p>}
      <h3>{t.access}</h3>
      <p className="badge">{d.accessLabels[shown.label]}</p>
      <p>{d.recordHeading}{language === "fr" ? "\u00a0:" : ":"} {d.knownSummary(shown.knownCount, shown.unknownCount)}</p>
      <ul className="facts">
        {shown.facts.map((fact) => <Fact key={fact.key} fact={fact} language={language}/>)}
      </ul>
      <h3>{t.commute}</h3>
      {commuteStatus(listing) === "Unknown" && <p>{t.commuteUnknown}</p>}
      <CommuteCheck record={record} language={language} report={commute} onReport={setCommute}/>
      <section aria-labelledby="handoff-title">
        <h3 id="handoff-title">{t.handoff}</h3>
        <p>{t.handoffIntro}</p>
        <p>{listing.handoff.note[language]}</p>
        <p><strong>{t.date}{language === "fr" ? "\u00a0:" : ":"}</strong> {listing.handoff.datedOn}</p>
        <a href={listing.handoff.url} rel="noopener noreferrer" target="_blank">{t.handoffLink}</a>
        <ReferralExport record={record} language={language} commute={commute}/>
      </section>
      <h3>{t.related}</h3>
      <ul>{listing.relatedNavigatorIds.map((id) => <li key={id}><code>{id}</code></li>)}</ul>
      <p>{t.noDecision}</p>
    </section>
  );
}

export function EmploymentView({ initialLanguage = "en" }: { initialLanguage?: Language }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const records = presentListings(DEMONSTRATION_LISTING_RECORDS);
  const [selectedId, setSelectedId] = useState(records[0]?.record.listing.id);
  const t = catalog[language];
  const selected = records.find((item) => item.record.listing.id === selectedId)?.record;
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
          <ul className="listing-list">{records.map(({ record: { listing: item }, label }) => (
            <li key={item.id}>
              <h3>{item.title[language]}</h3>
              <p>{item.kind === "job" ? t.job : t.programme} · {item.location.city[language]}</p>
              <p className="badge">{depthCatalog[language].accessLabels[label]}</p>
              <button type="button" aria-pressed={selectedId === item.id} onClick={() => setSelectedId(item.id)}>
                {t.select}: {item.title[language]}
              </button>
            </li>
          ))}</ul>
        </section>
        {selected && <Detail key={selected.listing.id} record={selected} language={language}/>}
      </div>
    </main>
  );
}
