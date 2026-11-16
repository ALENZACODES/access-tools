import { useState } from "react";
import { FIELDS, appendEvent, blankAudit, isAudit, newProvenance, saveFact } from "./model.js";
import type { Action, Audit, AuditEvent, Field, Role } from "./model.js";
import { fieldName, words } from "./catalog.js";
import type { Lang } from "./catalog.js";
import { copy, fill } from "./copy.js";
import { DEFAULT_TIER_RULES } from "./observations.js";
import type { FieldObservation } from "./observations.js";
import { trainingComplete } from "./programme.js";
import { windowDays } from "./tiers.js";
import type { VenueResponse } from "./venue.js";
import { DEFAULT_SERVICE_LEVELS, toClock } from "./workflow.js";
import { DEVICE_AUDITOR, loadWorkspace, saveWorkspace, seedWorkspace } from "./workspace.js";
import type { Workspace } from "./workspace.js";
import { CasesPanel } from "./ui/CasesPanel.js";
import { ProgrammePanel } from "./ui/ProgrammePanel.js";
import { RecordPanel } from "./ui/RecordPanel.js";
import { ServicePanel } from "./ui/ServicePanel.js";
import { VenuePanel } from "./ui/VenuePanel.js";
import "./style.css";

const VENUES = ["demo-hall", "demo-library"] as const;
const STORAGE = "access-auditors-demo-v1";
type View = Role | "coordinator";

function storage(): Storage | null {
  try { return typeof localStorage === "undefined" ? null : localStorage; }
  catch { return null; }
}
function readLocal(venue: string): Audit {
  try {
    const raw = storage()?.getItem(`${STORAGE}-${venue}`);
    if (raw) {
      const value: unknown = JSON.parse(raw);
      if (isAudit(value) && value.venueId === venue) return value;
    }
  } catch { /* Unavailable storage or corrupt data: fall back to empty. */ }
  return blankAudit(venue);
}
function storeLocal(audit: Audit): void {
  try { storage()?.setItem(`${STORAGE}-${audit.venueId}`, JSON.stringify(audit)); }
  catch { /* Browser may refuse local storage; no remote fallback. */ }
}

/** `clock` exists so that tests can fix the date. The screen reads the device clock by default. */
export function App({ clock = () => new Date() }: { clock?: () => Date } = {}) {
  const now = () => toClock(clock().getTime());
  const today = now().slice(0, 10);
  const [lang, setLang] = useState<Lang>("en");
  const [role, setRole] = useState<View>("auditor");
  const [venue, setVenue] = useState<string>(VENUES[0]);
  const [audit, setAudit] = useState<Audit>(() => readLocal(VENUES[0]));
  const [workspace, setWorkspace] = useState<Workspace>(() => loadWorkspace(storage(), today));
  const [field, setField] = useState<Field>(FIELDS[0]);
  const [unknown, setUnknown] = useState(true);
  const [amount, setAmount] = useState("");
  const [photoId, setPhotoId] = useState("");
  const [filename, setFilename] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [resetting, setResetting] = useState(false);
  const t = words[lang];
  const c = copy[lang];
  const newId = () => crypto.randomUUID();

  function commit(next: Audit): void {
    setAudit(next);
    storeLocal(next);
    setStatus(t.saved);
  }
  function update(next: Workspace, message: string): void {
    setWorkspace(next);
    saveWorkspace(storage(), next);
    setStatus(message);
  }
  function event(kind: Action, detail: string, actor: Role): AuditEvent {
    return { id: newId(), venueId: venue, action: kind, detail, actor, at: clock().toISOString() };
  }
  function capture(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = amount.trim() === "" ? NaN : Number(amount);
    if (!unknown && (!Number.isFinite(value) || value < 0)) { setStatus(t.invalid); return; }
    if ([photoId, filename, description].some(Boolean) && ![photoId, filename, description].every((v) => v.trim())) {
      setStatus(t.invalid); return;
    }
    if (filename.includes("/") || filename.includes("\\")) { setStatus(t.invalid); return; }
    const photo = photoId.trim() ? { id: photoId.trim(), localFilename: filename.trim(), description: description.trim() } : undefined;
    const provenance = newProvenance(today, `local-${newId()}`);
    const fact = { field, value: unknown ? null : value, provenance, photoIds: photo ? [photo.id] : [] };
    const observation: FieldObservation = {
      id: `obs-${newId()}`, placeId: venue, field, value: fact.value,
      // Training ticked on this device is self-declared. Tier 3 still needs a review by another person.
      observerRole: trainingComplete(workspace.training) ? "trained_verifier" : "peer",
      observerId: DEVICE_AUDITOR, observedOn: today,
      source: { sourceName: provenance.sourceName, sourceId: provenance.sourceId, licence: provenance.licence, recordDate: today },
      origin: "device", label: "PROTOTYPE-UNVERIFIED",
      ...(photo ? { photo: { ...photo, takenOn: today } } : {}),
    };
    commit(saveFact(audit, fact, event("measurement", `${field}: ${unknown ? "UNKNOWN" : `${value} mm`}`, "auditor"), photo));
    update({ ...workspace, observations: [...workspace.observations, observation] }, t.saved);
  }
  function claim() {
    commit(appendEvent(audit, event("claim", t.claims, "venue-owner")));
  }
  function responded(next: Workspace, message: string, response: VenueResponse) {
    const about = next.cases.find((item) => item.id === response.caseId)?.description ?? response.caseId;
    const action: Action = response.kind === "fixed" ? "fix" : response.kind;
    const detail = response.kind === "fixed" ? `${response.fixedOn}: ${about}` : response.kind === "dispute" ? `${response.reason}: ${about}` : about;
    commit(appendEvent(audit, event(action, detail, "venue-owner")));
    update(next, message);
  }
  function reset() {
    for (const id of VENUES) storeLocal(blankAudit(id));
    setAudit(blankAudit(venue));
    setResetting(false);
    update(seedWorkspace(today), c.resetDone);
  }
  const policy = {
    tolerance: DEFAULT_TIER_RULES.agreementToleranceMm, ageing: Math.round(DEFAULT_TIER_RULES.ageingFraction * 100),
    tier1: windowDays(1, "doorClearWidthMm") ?? "?", tier2: windowDays(2, "doorClearWidthMm") ?? "?",
    washroom: windowDays(2, "turningDiameterMm") ?? "?", tier3: windowDays(3, "doorClearWidthMm") ?? "?",
    triage: DEFAULT_SERVICE_LEVELS.triageDays, recheck: DEFAULT_SERVICE_LEVELS.recheckStartDays, close: DEFAULT_SERVICE_LEVELS.closeDays,
  };
  return (
    <main>
      <header>
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
        <p><strong>PROTOTYPE-UNVERIFIED</strong></p>
        <div className="switches">
          <label>{t.language}<select value={lang} onChange={(e) => { const v = e.target.value as Lang; setLang(v); document.documentElement.lang = v; setStatus(""); }}><option value="en">English</option><option value="fr">Français</option></select></label>
          <label>{t.role}<select value={role} onChange={(e) => { setRole(e.target.value as View); setStatus(""); }}><option value="auditor">{t.auditor}</option><option value="venue-owner">{t.owner}</option><option value="coordinator">{c.coordinator}</option></select></label>
          <label>{t.venue}<select value={venue} onChange={(e) => { const id = e.target.value; setVenue(id); setAudit(readLocal(id)); setStatus(""); }}><option value="demo-hall">Demo Hall / Salle fictive</option><option value="demo-library">Demo Library / Bibliothèque fictive</option></select></label>
        </div>
      </header>
      <p>{t.local}</p>
      <p role="status" aria-live="polite" className="status">{status}</p>
      <RecordPanel lang={lang} observations={workspace.observations} placeId={venue} today={today} />
      {role === "auditor" ? <>
        <section aria-labelledby="capture-heading">
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
        </section>
        <ProgrammePanel lang={lang} workspace={workspace} placeId={venue} today={today} onChange={update} />
      </> : null}
      {role === "venue-owner" ? <>
        <section aria-labelledby="owner-heading">
          <h2 id="owner-heading">{t.owner}</h2><p>{t.claims}</p>
          <button type="button" onClick={claim}>{t.claim}</button>
        </section>
        <VenuePanel lang={lang} workspace={workspace} placeId={venue} now={now} newId={newId} onRespond={responded} />
      </> : null}
      <CasesPanel lang={lang} workspace={workspace} placeId={venue} actor={role} now={now} newId={newId} onChange={update} />
      <ServicePanel lang={lang} cases={workspace.cases} asOf={now()} />
      <section aria-labelledby="trail-heading"><h2 id="trail-heading">{t.trail}</h2>
        {audit.events.length === 0 ? <p>{t.empty}</p> : <ol className="trail">{audit.events.map((item) => <li key={item.id}><strong>{t.actor}:</strong> {item.actor === "auditor" ? t.auditor : t.owner}; <strong>{t.what}:</strong> {t.actions[item.action]} — {item.detail}; <strong>{t.when}:</strong> <time dateTime={item.at}>{new Date(item.at).toLocaleString(lang === "en" ? "en-CA" : "fr-CA")}</time></li>)}</ol>}
      </section>
      <section aria-labelledby="rules-heading"><h2 id="rules-heading">{t.rules}</h2><p>{fill(t.policyTier, policy)}</p><p>{fill(t.policyDecay, policy)}</p><p>{fill(t.policyService, policy)}</p><p>{t.workflow}</p></section>
      <section aria-labelledby="data-heading">
        <h2 id="data-heading">{c.dataHeading}</h2>
        {resetting ? <>
          <p>{c.resetWarning}</p>
          <button type="button" onClick={reset}>{c.resetConfirm}</button>{" "}
          <button type="button" className="quiet" onClick={() => setResetting(false)}>{c.resetCancel}</button>
        </> : <button type="button" className="quiet" onClick={() => setResetting(true)}>{c.reset}</button>}
      </section>
    </main>
  );
}
