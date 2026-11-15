import { useState } from "react";
import { displayedFields, importPlaces } from "./pipeline.js";
import type { ImportResult } from "./pipeline.js";
import { messages } from "./i18n.js";
import type { Language } from "./i18n.js";
import demo from "./demo.json";
import "./styles.css";

export function App() {
  const [language, setLanguage] = useState<Language>("en");
  const [input, setInput] = useState(JSON.stringify(demo, null, 2));
  const [result, setResult] = useState<ImportResult>(() => importPlaces(demo));
  const [error, setError] = useState("");
  const t = messages[language];
  const run = () => {
    try {
      const next = importPlaces(JSON.parse(input) as unknown);
      setResult(next);
      setError("");
    } catch {
      setError(t.invalidJson);
    }
  };
  return <main>
    <header>
      <h1>{t.title}</h1>
      <label htmlFor="lang">{t.language}</label>
      <select id="lang" value={language} onChange={(event) => {
        setLanguage(event.target.value as Language);
        document.documentElement.lang = event.target.value;
      }}>
        <option value="en">English</option><option value="fr">Français</option>
      </select>
    </header>
    <p>{t.introduction}</p>
    <p>{t.warning}</p>
    <label htmlFor="fixture">{t.input}</label>
    <textarea id="fixture" spellCheck={false} rows={8} value={input} onChange={(event) => setInput(event.target.value)} />
    <button type="button" onClick={run}>{t.run}</button>
    {error && <p role="alert">{error}</p>}
    <section aria-labelledby="report-title">
      <h2 id="report-title">{t.report}</h2>
      <dl className="stats">
        <div><dt>{t.accepted}</dt><dd>{result.report.accepted}</dd></div>
        <div><dt>{t.rejected}</dt><dd>{result.report.rejected}</dd></div>
        <div><dt>{t.unknownFields}</dt><dd>{result.report.unknownFields}</dd></div>
        <div><dt>{t.refused}</dt><dd>{result.report.refused}</dd></div>
      </dl>
      <h3>{t.reasons}</h3>
      <ul>{result.report.rejections.map((entry) => <li key={`rejected-${entry.index}`}>#{entry.index + 1}: {entry.reason}</li>)}</ul>
      <h3>{t.refusals}</h3>
      <ul>{result.report.refusals.map((entry, index) => <li key={`${entry.index}-${entry.field}-${index}`}>#{entry.index + 1}: {entry.field}</li>)}</ul>
    </section>
    <section aria-labelledby="places-title">
      <h2 id="places-title">{t.places}</h2>
      {result.places.length === 0 && <p>{t.noPlaces}</p>}
      {result.places.map((place) => <article key={place.id}>
        <h3>{place.identity.name}</h3>
        <div className="table-wrap"><table>
          <caption>{t.fields} — {place.identity.name}</caption>
          <thead><tr><th scope="col">{t.fields}</th><th scope="col">{t.value}</th><th scope="col">{t.source}</th><th scope="col">{t.licence}</th><th scope="col">{t.date}</th><th scope="col">{t.tier}</th></tr></thead>
          <tbody>{displayedFields(place).map(({ path, fact }) => <tr key={path}>
            <th scope="row">{path}</th><td>{fact.value === null ? t.unknown : String(fact.value)}</td>
            <td>{fact.provenance?.sourceName ?? t.none}</td><td>{fact.provenance?.licence ?? t.none}</td>
            <td>{fact.provenance?.sourceDate ?? t.none}</td><td>{fact.provenance?.tier ?? t.none}</td>
          </tr>)}</tbody>
        </table></div>
      </article>)}
    </section>
  </main>;
}
