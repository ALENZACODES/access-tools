import { useState } from "react";
import { CATALOG } from "./catalog.js";
import { DEPTH_CATALOG } from "./depthCatalog.js";
import { BARRIER_TYPES, SETTINGS, WAIT_BANDS, aggregateEvidence, buildEvidence, clearEvidence, readEvidence, saveEvidence } from "./evidence.js";
import type { BarrierType, Cells, EvidenceReport, EvidenceSetting, WaitBand } from "./evidence.js";
import { CATEGORIES } from "./reports.js";
import type { BarrierCategory, Language } from "./types.js";

type MessageKey = "" | "saved" | "needAgree" | "invalidCity" | "storageFailed" | "cleared";

function load(): EvidenceReport[] {
  try { return readEvidence(window.localStorage); } catch { return []; }
}

function CellList<K extends string>({ heading, cells, labels, suppressed }: { heading: string; cells: Cells<K>; labels: Record<K, string>; suppressed: string }) {
  return <>
    <h4>{heading}</h4>
    <dl>{(Object.keys(cells) as K[]).map((key) => <div className="fact" key={key}><dt>{labels[key]}</dt><dd>{cells[key] ?? suppressed}</dd></div>)}</dl>
  </>;
}

/**
 * Saves the aggregate counts as a file. The file is made only when the person asks for it, so the page
 * holds no data: link (a host may refuse links that are not http, https, tel or mailto).
 */
function saveAggregate(json: string): void {
  try {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "housing-aggregate.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch {
    // Saving files is not available in this browser. Nothing is saved, and the counts stay on screen.
  }
}

export function EvidenceForm({ lang, today }: { lang: Language; today?: string }) {
  const t = DEPTH_CATALOG[lang];
  const [category, setCategory] = useState<BarrierCategory>("applied");
  const [setting, setSetting] = useState<EvidenceSetting>("unknown");
  const [waitBand, setWaitBand] = useState<WaitBand>("unknown");
  const [barriers, setBarriers] = useState<BarrierType[]>([]);
  const [city, setCity] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [message, setMessage] = useState<MessageKey>("");
  const [reports, setReports] = useState(load);
  const summary = aggregateEvidence(reports);
  const toggle = (item: BarrierType, on: boolean) => setBarriers(on ? [...barriers, item] : barriers.filter((entry) => entry !== item));
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!agreed) { setMessage("needAgree"); return; }
    const result = buildEvidence({ category, setting, waitBand, barriers, city }, today ?? new Date().toISOString().slice(0, 10));
    if (!result.ok) { setMessage("invalidCity"); return; }
    try {
      saveEvidence(window.localStorage, result.report);
      setReports(load());
      setBarriers([]); setCity(""); setAgreed(false);
      setMessage("saved");
    } catch { setMessage("storageFailed"); }
  };
  const clear = () => {
    try { clearEvidence(window.localStorage); setReports([]); setMessage("cleared"); } catch { setMessage("storageFailed"); }
  };
  return <section aria-labelledby="barriers-heading">
    <h2 id="barriers-heading">{t.evidenceHeading}</h2>
    <p>{t.privacy}</p>
    <form onSubmit={save}>
      <label htmlFor="category">{t.category}</label>
      <select id="category" value={category} onChange={(e) => setCategory(e.target.value as BarrierCategory)}>
        {CATEGORIES.map((item) => <option key={item} value={item}>{CATALOG[lang].categories[item]}</option>)}
      </select>
      <label htmlFor="evidence-setting">{t.setting}</label>
      <select id="evidence-setting" value={setting} onChange={(e) => setSetting(e.target.value as EvidenceSetting)}>
        {SETTINGS.map((item) => <option key={item} value={item}>{t.settings[item]}</option>)}
      </select>
      <label htmlFor="evidence-wait">{t.waitBand}</label>
      <select id="evidence-wait" value={waitBand} onChange={(e) => setWaitBand(e.target.value as WaitBand)}>
        {WAIT_BANDS.map((item) => <option key={item} value={item}>{t.waitBands[item]}</option>)}
      </select>
      <fieldset>
        <legend>{t.barriers}</legend>
        {BARRIER_TYPES.map((item) => <div className="checkbox" key={item}>
          <input type="checkbox" id={`barrier-${item}`} checked={barriers.includes(item)} onChange={(e) => toggle(item, e.target.checked)} />
          <label htmlFor={`barrier-${item}`}>{t.barrierTypes[item]}</label>
        </div>)}
      </fieldset>
      <label htmlFor="report-city">{t.optionalCity}</label>
      <input id="report-city" maxLength={60} value={city} onChange={(e) => setCity(e.target.value)} />
      <div className="checkbox">
        <input type="checkbox" id="evidence-agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <label htmlFor="evidence-agree">{t.agree}</label>
      </div>
      <button type="submit">{t.save}</button>
    </form>
    <p role="status">{message ? t[message] : ""}</p>
    <h3>{t.aggregate}</h3>
    <p>{t.aggregateNote}</p>
    <dl><div className="fact"><dt>{t.total}</dt><dd>{summary.total ?? t.suppressed}</dd></div></dl>
    <CellList heading={t.byCategory} cells={summary.byCategory} labels={CATALOG[lang].categories} suppressed={t.suppressed} />
    <CellList heading={t.bySetting} cells={summary.bySetting} labels={t.settings} suppressed={t.suppressed} />
    <CellList heading={t.byWaitBand} cells={summary.byWaitBand} labels={t.waitBands} suppressed={t.suppressed} />
    <CellList heading={t.byBarrier} cells={summary.byBarrier} labels={t.barrierTypes} suppressed={t.suppressed} />
    <p><button type="button" className="download" onClick={() => saveAggregate(JSON.stringify(summary, null, 2))}>{t.download}</button></p>
    <button type="button" onClick={clear}>{t.clear}</button>
  </section>;
}
