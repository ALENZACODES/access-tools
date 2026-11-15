import { useEffect, useState } from "react";
import { auditRecords, recordManualCheck } from "./audit.js";
import { messages } from "./catalog.js";
import { assertHandoff, phoneHref } from "./handoff.js";
import type { DirectoryLike, Handoff, Language } from "./types.js";
import "./ui.css";

export interface HandoffAuditProps {
  initialRecords: readonly DirectoryLike[];
  handoff?: Handoff;
  asOf: string;
  initialLanguage?: Language;
}

export function HandoffAudit({ initialRecords, handoff, asOf, initialLanguage = "en" }: HandoffAuditProps) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [records, setRecords] = useState<DirectoryLike[]>(() => [...initialRecords]);
  const [done, setDone] = useState<number[]>([]);
  const [dates, setDates] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState<string[]>([]);
  const t = messages(language);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = `${t.app} — ${t.heading}`;
  }, [language, t.app, t.heading]);
  if (handoff) assertHandoff(handoff);
  const results = auditRecords(records, asOf);
  const origin = records.find((record) => record.id === handoff?.fromRecordId);
  const counts = { current: 0, ageing: 0, stale: 0, missing: 0 };
  results.forEach(({ status }) => { counts[status] += 1; });

  function saveCheck(record: DirectoryLike) {
    try {
      const updated = recordManualCheck(record, dates[record.id] ?? "", asOf);
      setRecords((previous) => previous.map((entry) => entry.id === record.id ? updated : entry));
      setErrors((previous) => ({ ...previous, [record.id]: false }));
      setSuccess((previous) => [...previous, record.id]);
    } catch {
      setErrors((previous) => ({ ...previous, [record.id]: true }));
      setSuccess((previous) => previous.filter((id) => id !== record.id));
    }
  }

  return (
    <main className="handoff-shell">
      <header className="topbar">
        <span className="app-name">{t.app}</span>
        <label htmlFor="language">{t.language}
          <select id="language" value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
            <option value="en">{t.english}</option><option value="fr">{t.french}</option>
          </select>
        </label>
      </header>
      <h1>{t.heading}</h1>
      <p>{t.intro}</p>
      <p className="demo-label">{t.demonstration}</p>
      <section aria-labelledby="handoff-heading">
        <h2 id="handoff-heading">{t.handoff}</h2>
        {handoff ? (
          <div className="panel">
            <h3>{handoff.title[language]}</h3>
            <dl className="metadata">
              <div><dt>{t.from}</dt><dd>{origin?.name[language] ?? handoff.fromRecordId}</dd></div>
              <div><dt>{t.checked}</dt><dd>{handoff.checkedOn}</dd></div>
              <div><dt>{t.source}</dt><dd>{handoff.sourceName}</dd></div>
              <div><dt>{t.licence}</dt><dd>{handoff.licenceNote[language]}</dd></div>
              <div><dt>{t.tier}</dt><dd>{handoff.verificationTier}</dd></div>
            </dl>
            <h4>{t.steps}</h4>
            <ol className="steps">
              {handoff.steps.map((step, index) => (
                <li key={`${step.kind}-${index}`}>
                  <div>
                    <span>{step.label[language]}</span>
                    <a href={step.kind === "link" ? step.url : phoneHref(step.number)}
                      rel={step.kind === "link" ? "noopener noreferrer" : undefined}
                      target={step.kind === "link" ? "_blank" : undefined}>
                      {step.kind === "link" ? t.open : `${t.call}: ${step.number}`}
                    </a>
                  </div>
                  <label className="completed">
                    <input type="checkbox" checked={done.includes(index)}
                      onChange={(event) => setDone((previous) => event.target.checked
                        ? [...previous, index] : previous.filter((item) => item !== index))} />
                    {t.completed}
                  </label>
                </li>
              ))}
            </ol>
          </div>
        ) : <p>{t.nothing}</p>}
      </section>
      <section aria-labelledby="audit-heading">
        <h2 id="audit-heading">{t.audit}</h2>
        <p>{t.asOf}: <time dateTime={asOf}>{asOf}</time></p>
        <ul className="summary" aria-label={t.status}>
          {(["current", "ageing", "stale", "missing"] as const).map((status) => (
            <li key={status}><strong>{t[status]}</strong><span>{counts[status]}</span></li>
          ))}
        </ul>
        <div className="audit-grid">
          {results.map(({ record, status, checkedOn, figureVisible, figureDate }) => (
            <article className="panel" key={record.id}>
              <h3>{record.name[language]}</h3>
              <p className={`status status-${status}`}><strong>{t[status]}</strong></p>
              <dl className="metadata">
                <div><dt>{t.checked}</dt><dd>{checkedOn ?? t.dateMissing}</dd></div>
                <div><dt>{t.source}</dt><dd>{record.sourceName}</dd></div>
                <div><dt>{t.licence}</dt><dd>{record.licenceNote[language]}</dd></div>
                <div><dt>{t.tier}</dt><dd>{record.verificationTier}</dd></div>
              </dl>
              {record.figure && (figureVisible ? (
                <p className="figure"><strong>{t.figure}: </strong>{record.figure.statement[language]} — {record.figure.qualifier[language]} ({figureDate})</p>
              ) : (
                <p className="figure-hidden">{t.noFigure}. {t.staleFigure}: {figureDate ?? t.dateMissing}.</p>
              ))}
              <div className="review">
                <h4>{t.recheck}</h4>
                <label htmlFor={`check-${record.id}`}>{t.checkDate}</label>
                <input id={`check-${record.id}`} type="date" max={asOf} value={dates[record.id] ?? ""}
                  onChange={(event) => setDates((previous) => ({ ...previous, [record.id]: event.target.value }))} />
                <button type="button" onClick={() => saveCheck(record)}>{t.save}</button>
                {errors[record.id] && <p role="alert">{t.invalid}</p>}
                {success.includes(record.id) && !errors[record.id] && <p role="status">{t.reviewed}</p>}
              </div>
            </article>
          ))}
        </div>
        <p>{t.notice}</p>
      </section>
    </main>
  );
}
