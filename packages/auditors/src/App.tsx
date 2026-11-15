import { useState } from "react";
import { FIELDS, appendEvent, blankAudit, isAudit, newProvenance, saveFact, serviceReport } from "./model.js";
import type { Action, Audit, AuditEvent, Field, Role } from "./model.js";
import { fieldName, words } from "./catalog.js";
import type { Lang } from "./catalog.js";
import "./style.css";

const VENUES = ["demo-hall", "demo-library"] as const;
const STORAGE = "access-auditors-demo-v1";
function readLocal(venue: string): Audit {
  try {
    const raw = localStorage.getItem(`${STORAGE}-${venue}`);
    if (raw) {
      const value: unknown = JSON.parse(raw);
      if (isAudit(value) && value.venueId === venue) return value;
    }
  } catch { /* Unavailable storage or corrupt data: fall back to empty. */ }
  return blankAudit(venue);
}
function storeLocal(audit: Audit): void {
  try { localStorage.setItem(`${STORAGE}-${audit.venueId}`, JSON.stringify(audit)); }
  catch { /* Browser may refuse local storage; no remote fallback. */ }
}

export function App() {
  const [lang, setLang] = useState<Lang>("en");
  const [role, setRole] = useState<Role>("auditor");
  const [venue, setVenue] = useState<string>(VENUES[0]);
  const [audit, setAudit] = useState<Audit>(() => readLocal(VENUES[0]));
  const [field, setField] = useState<Field>(FIELDS[0]);
  const [unknown, setUnknown] = useState(true);
  const [amount, setAmount] = useState("");
  const [photoId, setPhotoId] = useState("");
  const [filename, setFilename] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [action, setAction] = useState<"fix" | "dispute">("fix");
  const [status, setStatus] = useState("");
  const t = words[lang];
  const counts = serviceReport(audit, new Date());

  function commit(next: Audit): void {
    setAudit(next);
    storeLocal(next);
    setStatus(t.saved);
  }
  function event(kind: Action, detail: string, actor: Role = role): AuditEvent {
    return { id: crypto.randomUUID(), venueId: venue, action: kind, detail, actor, at: new Date().toISOString() };
  }
  function capture(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = amount.trim() === "" ? NaN : Number(amount);
    if (!unknown && (!Number.isFinite(value) || value < 0)) { setStatus(t.invalid); return; }
    if ([photoId, filename, description].some(Boolean) && ![photoId, filename, description].every((v) => v.trim())) {
      setStatus(t.invalid); return;
    }
    if (filename.includes("/") || filename.includes("\\")) { setStatus(t.invalid); return; }
    const stamp = new Date().toISOString();
    const photo = photoId.trim() ? { id: photoId.trim(), localFilename: filename.trim(), description: description.trim() } : undefined;
    const fact = {
      field, value: unknown ? null : value,
      provenance: newProvenance(stamp.slice(0, 10), `local-${crypto.randomUUID()}`),
      photoIds: photo ? [photo.id] : [],
    };
    commit(saveFact(audit, fact, event("measurement", `${field}: ${unknown ? "UNKNOWN" : `${value} mm`}`), photo));
  }
  function ownerEvent(kind: "claim" | "fix" | "dispute") {
    const detail = kind === "claim" ? t.claims : note.trim();
    if (!detail) return;
    commit(appendEvent(audit, event(kind, detail, "venue-owner")));
    setNote("");
  }
  return (
    <main>
      <header>
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
        <p><strong>PROTOTYPE-UNVERIFIED</strong></p>
        <div className="switches">
          <label>{t.language}<select value={lang} onChange={(e) => { const v = e.target.value as Lang; setLang(v); document.documentElement.lang = v; setStatus(""); }}><option value="en">English</option><option value="fr">Français</option></select></label>
          <label>{t.role}<select value={role} onChange={(e) => { setRole(e.target.value as Role); setStatus(""); }}><option value="auditor">{t.auditor}</option><option value="venue-owner">{t.owner}</option></select></label>
          <label>{t.venue}<select value={venue} onChange={(e) => { const id = e.target.value; setVenue(id); setAudit(readLocal(id)); setStatus(""); }}><option value="demo-hall">Demo Hall / Salle fictive</option><option value="demo-library">Demo Library / Bibliothèque fictive</option></select></label>
        </div>
      </header>
      <p>{t.local}</p>
      {role === "auditor" ? <section aria-labelledby="capture-heading">
        <h2 id="capture-heading">{t.capture}</h2><p>{t.factStatus}</p>
        <form onSubmit={capture}>
          <label>{t.field}<select value={field} onChange={(e) => setField(e.target.value as Field)}>{FIELDS.map((f) => <option key={f} value={f}>{fieldName(lang, f)}</option>)}</select></label>
          <label className="check"><input type="checkbox" checked={unknown} onChange={(e) => setUnknown(e.target.checked)} />{t.unknown}</label>
          <label>{t.measurement}<input type="number" min="0" step="any" disabled={unknown} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <label>{t.photoId}<input value={photoId} onChange={(e) => setPhotoId(e.target.value)} /></label>
          <label>{t.filename}<input value={filename} onChange={(e) => setFilename(e.target.value)} /></label>
          <label>{t.description}<input value={description} onChange={(e) => setDescription(e.target.value)} /></label>
          <button type="submit">{t.save}</button>
        </form>
        <ul>{audit.facts.map((f) => <li key={f.field}>{fieldName(lang, f.field)}: {f.value === null ? t.unknown : `${f.value} mm`} — {f.provenance.prototypeLabel}</li>)}</ul>
      </section> : <section aria-labelledby="owner-heading">
        <h2 id="owner-heading">{t.owner}</h2><p>{t.claims}</p>
        <button type="button" onClick={() => ownerEvent("claim")}>{t.claim}</button>
        <form onSubmit={(e) => { e.preventDefault(); ownerEvent(action); }}>
          <label>{t.note}<textarea required value={note} onChange={(e) => setNote(e.target.value)} /></label>
          <fieldset><legend>{t.submit}</legend><label className="check"><input type="radio" name="action" checked={action === "fix"} onChange={() => setAction("fix")} />{t.fix}</label><label className="check"><input type="radio" name="action" checked={action === "dispute"} onChange={() => setAction("dispute")} />{t.dispute}</label></fieldset>
          <button type="submit">{t.submit}</button>
        </form>
      </section>}
      <p role="status" aria-live="polite">{status}</p>
      <section aria-labelledby="service-heading"><h2 id="service-heading">{t.service}</h2><p>{t.target}</p>
        <dl className="metrics"><div><dt>{t.total}</dt><dd>{counts.submissions}</dd></div><div><dt>{t.responded}</dt><dd>{counts.responded}</dd></div><div><dt>{t.pending}</dt><dd>{counts.pending}</dd></div><div><dt>{t.misses}</dt><dd>{counts.misses}</dd></div></dl>
        <p>{t.intro}</p>
      </section>
      <section aria-labelledby="trail-heading"><h2 id="trail-heading">{t.trail}</h2>
        {audit.events.length === 0 ? <p>{t.empty}</p> : <ol>{audit.events.map((item) => <li key={item.id}><strong>{t.actor}:</strong> {item.actor === "auditor" ? t.auditor : t.owner}; <strong>{t.what}:</strong> {t.actions[item.action]} — {item.detail}; <strong>{t.when}:</strong> <time dateTime={item.at}>{new Date(item.at).toLocaleString(lang === "en" ? "en-CA" : "fr-CA")}</time></li>)}</ol>}
      </section>
      <section aria-labelledby="rules-heading"><h2 id="rules-heading">{t.rules}</h2><p>{t.policyTier}</p><p>{t.policyDecay}</p><p>{t.policyService}</p><p>{t.workflow}</p></section>
    </main>
  );
}
