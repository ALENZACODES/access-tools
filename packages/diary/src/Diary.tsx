import { useEffect, useState, type FormEvent } from "react";
import { COPY } from "./catalog.js";
import { aggregate, CATEGORIES, CONSEQUENCES, isEntry, type Category, type Consequence, type Language } from "./model.js";
import { addEntry, deleteAllEntries, deleteEntry, listEntries, openDiary, readConsent, setConsent, type StoredEntry } from "./storage.js";
import "./style.css";

export function Diary() {
  const [language, setLanguage] = useState<Language>("en");
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [consented, setConsented] = useState(false);
  const [rows, setRows] = useState<StoredEntry[]>([]);
  const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [category, setCategory] = useState<Category>("catheters");
  const [amount, setAmount] = useState("");
  const [unknown, setUnknown] = useState(true);
  const [rationed, setRationed] = useState(false);
  const [consequence, setConsequence] = useState<Consequence>("none");
  const [preview, setPreview] = useState(false);
  const [notice, setNotice] = useState("");
  const t = COPY[language];
  const report = aggregate(rows.map((r) => r.entry));

  useEffect(() => {
    let active = true;
    let connection: IDBDatabase | undefined;
    void (async () => {
      try {
        connection = await openDiary();
        const [consent, entries] = await Promise.all([readConsent(connection), listEntries(connection)]);
        if (active) { setDb(connection); setConsented(consent?.granted ?? false); setRows(entries); }
        else connection.close();
      } catch { if (active) setNotice("storage-error"); }
    })();
    return () => { active = false; connection?.close(); };
  }, []);

  async function changeConsent(granted: boolean) {
    if (!db) return;
    try {
      await setConsent(db, granted);
      setConsented(granted);
      setNotice("");
    } catch { setNotice("storage-error"); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!db || !consented) return;
    const entry: unknown = { date, category, amount: unknown ? "Unknown" : Number(amount), rationed, consequence };
    if (!isEntry(entry) || (!unknown && amount.trim() === "")) return;
    try {
      await addEntry(db, entry);
      setRows(await listEntries(db));
      setNotice("saved");
      setPreview(false);
    } catch { setNotice("storage-error"); setConsented((await readConsent(db))?.granted ?? false); }
  }

  async function remove(id?: number) {
    if (!db) return;
    try {
      if (id === undefined) await deleteAllEntries(db);
      else await deleteEntry(db, id);
      setRows(await listEntries(db));
      setPreview(false);
      setNotice("");
    } catch { setNotice("storage-error"); }
  }

  function download() {
    // No raw records are passed into the Blob; only the suppressing aggregate result.
    const json = JSON.stringify(report, null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "diary-aggregates.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main lang={language}>
      <header>
        <label htmlFor="language">{t.language}</label>
        <select id="language" value={language} onChange={(e) => { setLanguage(e.target.value as Language); setNotice(""); }}>
          <option value="en">English</option><option value="fr">Français</option>
        </select>
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
        <p>{t.disclaimer}</p>
        <p>{t.onDevice}</p>
      </header>
      <section aria-labelledby="consent-title">
        <h2 id="consent-title">{t.consentTitle}</h2>
        <p>{t.consentCopy}</p>
        {consented ? <><p role="status">{t.consentOn}</p><button type="button" onClick={() => void changeConsent(false)}>{t.revoke}</button></>
          : <><p role="status">{t.revoked}</p><button type="button" disabled={!db} onClick={() => void changeConsent(true)}>{t.grant}</button></>}
      </section>
      {consented && <section aria-labelledby="new-entry-title">
        <h2 id="new-entry-title">{t.save}</h2>
        <form onSubmit={(event) => void save(event)}>
          <label htmlFor="entry-date">{t.date}</label>
          <input id="entry-date" type="date" value={date} required onChange={(e) => setDate(e.target.value)} />
          <label htmlFor="entry-category">{t.category}</label>
          <select id="entry-category" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((item) => <option key={item} value={item}>{t.categoryNames[item]}</option>)}
          </select>
          <label htmlFor="entry-amount">{t.amount}</label>
          <p id="amount-help">{t.amountHelp}</p>
          <input id="entry-amount" type="number" min="0" max="1000000" step="0.01" disabled={unknown} required={!unknown} value={amount} aria-describedby="amount-help" onChange={(e) => setAmount(e.target.value)} />
          <label className="check"><input type="checkbox" checked={unknown} onChange={(e) => setUnknown(e.target.checked)} />{t.unknown}</label>
          <label className="check"><input type="checkbox" checked={rationed} onChange={(e) => setRationed(e.target.checked)} />{t.rationing}</label>
          <label htmlFor="entry-consequence">{t.consequence}</label>
          <select id="entry-consequence" value={consequence} onChange={(e) => setConsequence(e.target.value as Consequence)}>
            {CONSEQUENCES.map((item) => <option key={item} value={item}>{t.consequenceNames[item]}</option>)}
          </select>
          <button type="submit">{t.save}</button>
        </form>
      </section>}
      <section aria-labelledby="entries-title">
        <h2 id="entries-title">{t.entries}</h2>
        {rows.length === 0 ? <p>{t.empty}</p> : <>
          <ul>{rows.map(({ id, entry }) => <li key={id}>
            <span>{entry.date} — {t.categoryNames[entry.category]} — {entry.amount === "Unknown" ? t.unknown : `${entry.amount} CAD`} — {t.consequenceNames[entry.consequence]}</span>
            <button type="button" aria-label={`${t.delete}: ${entry.date}, ${t.categoryNames[entry.category]}`} onClick={() => void remove(id)}>{t.delete}</button>
          </li>)}</ul>
          <button type="button" onClick={() => void remove()}>{t.deleteAll}</button>
        </>}
      </section>
      <section aria-labelledby="export-title">
        <h2 id="export-title">{t.exportTitle}</h2>
        <p>{t.exportHelp}</p>
        <button type="button" onClick={() => setPreview(true)}>{t.preview}</button>
        {preview && <div aria-live="polite">
          {report.cells.length === 0 ? <p>{t.noCells}</p> : <>
            <ul>{report.cells.map((cell) => <li key={`${cell.month}:${cell.category}`}>{cell.month} — {t.categoryNames[cell.category]} — {cell.count}</li>)}</ul>
            <button type="button" onClick={download}>{t.download}</button>
          </>}
        </div>}
      </section>
      <p role="status" aria-live="polite">{notice === "saved" ? t.saved : notice === "storage-error" ? t.failed : ""}</p>
    </main>
  );
}
