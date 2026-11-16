import { useState } from "react";
import type { CommuteReport } from "./commute.js";
import { depthCatalog } from "./depthCatalog.js";
import type { ListingRecord } from "./record.js";
import { NOTE_LIMIT, REFERRAL_SECTIONS, buildReferralSummary, referralText } from "./referral.js";
import type { ReferralFailure, ReferralSection, ReferralSummary } from "./referral.js";
import type { Language } from "./types.js";

interface Props {
  record: ListingRecord;
  language: Language;
  commute: CommuteReport | null;
  /** Calendar date for the summary; defaults to today on this device. */
  today?: string;
}

type Message = { kind: "error"; reason: ReferralFailure } | { kind: "created" | "copied" | "copyFailed" | "removed" } | null;

export function ReferralExport({ record, language, commute, today }: Props) {
  const t = depthCatalog[language];
  const [include, setInclude] = useState<Record<ReferralSection, boolean>>({ listing: false, accessFacts: false, commute: false, note: false });
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const labels: Record<ReferralSection, string> = { listing: t.includeListing, accessFacts: t.includeAccess, commute: t.includeCommute, note: t.includeNote };
  const create = (event: React.FormEvent) => {
    event.preventDefault();
    const result = buildReferralSummary({
      record, commute, note,
      consent: { include, confirmed },
      createdOn: today ?? new Date().toISOString().slice(0, 10),
    });
    if (result.ok) { setSummary(result.summary); setMessage({ kind: "created" }); }
    else { setSummary(null); setMessage({ kind: "error", reason: result.reason }); }
  };
  const text = summary ? referralText(summary, language) : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ kind: "copied" });
    } catch { setMessage({ kind: "copyFailed" }); }
  };
  const messageText = !message ? "" : message.kind === "error" ? t.errors[message.reason] : t[message.kind];
  return (
    <section className="own-check" aria-labelledby="referral-export-title">
      <h4 id="referral-export-title">{t.referralHeading}</h4>
      <p>{t.referralIntro}</p>
      <form onSubmit={create} className="stack">
        <fieldset>
          <legend>{t.include}</legend>
          {REFERRAL_SECTIONS.map((section) => (
            <div className="check" key={section}>
              <input type="checkbox" id={`referral-${section}`} checked={include[section]} onChange={(event) => setInclude({ ...include, [section]: event.target.checked })}/>
              <label htmlFor={`referral-${section}`}>{labels[section]}</label>
            </div>
          ))}
        </fieldset>
        <div>
          <label htmlFor="referral-note-text">{t.note}</label>
          <textarea id="referral-note-text" rows={4} maxLength={NOTE_LIMIT} aria-describedby="referral-note-hint" value={note} onChange={(event) => setNote(event.target.value)}/>
          <p id="referral-note-hint">{t.noteHint}</p>
        </div>
        <div className="check">
          <input type="checkbox" id="referral-consent" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/>
          <label htmlFor="referral-consent">{t.consent}</label>
        </div>
        <button type="submit">{t.create}</button>
      </form>
      <p role="status" className={message?.kind === "error" ? "notice" : undefined}>{messageText}</p>
      {summary && <div className="stack">
        <label htmlFor="referral-output">{t.output}</label>
        <textarea id="referral-output" readOnly rows={12} value={text}/>
        <button type="button" onClick={() => { void copy(); }}>{t.copy}</button>
        <a download={`summary-${summary.createdOn}.txt`} href={`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`}>{t.download}</a>
        <button type="button" onClick={() => { setSummary(null); setMessage({ kind: "removed" }); }}>{t.remove}</button>
      </div>}
    </section>
  );
}
