import { useEffect, useId, useState, type CSSProperties } from "react";
import { EMERGENCY_PATHWAYS } from "../../../timing/src/emergency.js";
import {
  CHECKIN_MINUTE_OPTIONS,
  IDLE_CHECKIN,
  buildHelpSummary,
  closeCheckIn,
  isCheckInOverdue,
  isCheckInState,
  markNeedHelp,
  markOk,
  startCheckIn,
  type CheckInState,
} from "../checkin.js";
import { DEFAULT_OUTAGE_SNAPSHOT, resolveOutage, type OutageSnapshot } from "../disruption.js";
import { formatDateTime } from "../format.js";
import { safetyCopy, type SafetyCopyKey } from "../i18n.js";
import { KEYS, defaultStore, readJson, writeJson, type KeyValueStore } from "../storage.js";
import {
  createTripShare,
  decodeTripShare,
  encodeTripShare,
  isTripShareExpired,
  revokeTripShare,
  type TripShare,
} from "../tripShare.js";
import type { Language } from "../types.js";

export interface SafetyPanelProps {
  language: Language;
  onLanguage: (language: Language) => void;
  /** Injectable clock for tests. */
  now?: () => Date;
  /** Outage snapshot. Defaults to the honest "unknown" snapshot. */
  snapshot?: OutageSnapshot;
  /** Defaults to window.localStorage. Pass null to keep everything in memory. */
  store?: KeyValueStore | null;
}

const isShare = (value: unknown): value is TripShare => decodeTripShare("ACCESS-TRIP-SHARE/1 " + JSON.stringify(value), new Date(0)).status !== "invalid";
const isStringList = (value: unknown): value is string[] => Array.isArray(value) && value.every((x) => typeof x === "string");

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function SafetyPanel(props: SafetyPanelProps): JSX.Element {
  const { language } = props;
  const clock = props.now ?? (() => new Date());
  const store = props.store === undefined ? defaultStore() : props.store;
  const id = useId();
  const t = (key: SafetyCopyKey, vars?: Record<string, string | number>) => safetyCopy(key, language, vars);

  const [, setTick] = useState(0);
  const [checkIn, setCheckIn] = useState<CheckInState>(() => readJson(store, KEYS.checkIn, isCheckInState) ?? IDLE_CHECKIN);
  const [minutes, setMinutes] = useState(60);
  const [share, setShare] = useState<TripShare | null>(() => readJson(store, KEYS.share, isShare));
  const [revoked, setRevoked] = useState<string[]>(() => readJson(store, KEYS.revoked, isStringList) ?? []);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [start, setStart] = useState(() => toLocalInput(clock()));
  const [end, setEnd] = useState(() => toLocalInput(new Date(clock().getTime() + 60 * 60_000)));
  const [notes, setNotes] = useState("");
  const [shareError, setShareError] = useState<SafetyCopyKey | null>(null);
  const [pasted, setPasted] = useState("");
  const [checkResult, setCheckResult] = useState<string>("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 15_000);
    return () => clearInterval(timer);
  }, []);

  const now = clock();
  const updateCheckIn = (next: CheckInState) => {
    setCheckIn(next);
    writeJson(store, KEYS.checkIn, next.status === "idle" ? null : next);
  };
  const updateShare = (next: TripShare | null) => {
    setShare(next);
    writeJson(store, KEYS.share, next);
  };
  const doCopy = async (text: string) => setMessage(t((await copyText(text)) ? "copy.done" : "copy.failed"));

  const overdue = isCheckInOverdue(checkIn, now);
  const shareRevoked = share !== null && revoked.includes(share.id);
  const shareExpired = share !== null && isTripShareExpired(share, now);
  const liveShare = share !== null && !shareRevoked && !shareExpired ? share : null;
  const outage = resolveOutage(props.snapshot ?? DEFAULT_OUTAGE_SNAPSHOT, now);

  const statusText = (): string => {
    if (checkIn.status === "idle") return t("checkin.status-idle");
    if (checkIn.status === "ok") return t("checkin.status-ok", { time: formatDateTime(checkIn.resolvedAt ?? "", language) });
    if (checkIn.status === "needs-help") return t("checkin.status-help");
    const time = formatDateTime(checkIn.dueAt ?? "", language);
    return t(overdue ? "checkin.status-overdue" : "checkin.status-active", { time });
  };

  const onCreateShare = () => {
    const result = createTripShare(
      { originLabel: origin, destinationLabel: destination, windowStart: new Date(start), windowEnd: new Date(end), notes },
      clock(),
    );
    if (!result.ok) {
      setShareError(`error.${result.error}`);
      return;
    }
    setShareError(null);
    setMessage("");
    updateShare(result.share);
  };

  const onRevoke = () => {
    if (!share) return;
    const next = revokeTripShare(revoked, share.id);
    setRevoked(next);
    writeJson(store, KEYS.revoked, next);
  };

  const onCheck = () => {
    const decoded = decodeTripShare(pasted, clock(), revoked);
    if (decoded.status === "live") {
      setCheckResult(
        t("trip.check-live", {
          time: formatDateTime(decoded.share.expiresAt, language),
          origin: decoded.share.originLabel,
          destination: decoded.share.destinationLabel,
        }),
      );
    } else if (decoded.status === "expired") {
      setCheckResult(t("trip.check-expired", { time: formatDateTime(decoded.expiresAt, language) }));
    } else {
      setCheckResult(t(decoded.status === "revoked" ? "trip.check-revoked" : "trip.check-invalid"));
    }
  };

  return (
    <main lang={language} style={mainStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>{t("safety.title")}</h1>
        <button type="button" onClick={() => props.onLanguage(language === "en" ? "fr" : "en")} style={buttonStyle}>
          {language === "en" ? t("lang.show-french") : safetyCopy("lang.show-english", "fr")}
        </button>
      </div>
      <p role="note" style={noteStyle}>
        {t("safety.boundary")}
      </p>
      <p role="status" aria-live="polite" style={{ margin: 0, minHeight: "1.5rem" }}>
        {message}
      </p>

      <section aria-labelledby={`${id}-checkin`} style={sectionStyle}>
        <h2 id={`${id}-checkin`} style={h2Style}>
          {t("checkin.heading")}
        </h2>
        <p style={pStyle}>{t("checkin.intro")}</p>
        <p style={pStyle} data-testid="checkin-status">
          {statusText()}
        </p>
        {checkIn.status === "idle" ? (
          <div style={rowStyle}>
            <label htmlFor={`${id}-minutes`}>{t("checkin.duration-label")}</label>
            <select id={`${id}-minutes`} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} style={fieldStyle}>
              {CHECKIN_MINUTE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {t("checkin.minutes", { n })}
                </option>
              ))}
            </select>
            <button type="button" style={buttonStyle} onClick={() => updateCheckIn(startCheckIn(clock(), minutes))}>
              {t("checkin.start")}
            </button>
          </div>
        ) : null}
        {checkIn.status === "active" ? (
          <div style={rowStyle}>
            <button type="button" style={buttonStyle} onClick={() => updateCheckIn(markOk(checkIn, clock()))}>
              {t("checkin.ok")}
            </button>
            <button type="button" style={buttonStyle} onClick={() => updateCheckIn(markNeedHelp(checkIn, clock()))}>
              {t("checkin.help")}
            </button>
          </div>
        ) : null}
        {checkIn.status === "ok" || checkIn.status === "needs-help" ? (
          <div style={rowStyle}>
            <button type="button" style={buttonStyle} onClick={() => updateCheckIn(closeCheckIn())}>
              {t("checkin.close")}
            </button>
          </div>
        ) : null}
        {checkIn.status === "needs-help" ? (
          <div style={{ display: "grid", gap: "0.75rem" }} data-testid="help-panel">
            <h3 style={{ margin: 0 }}>{t("help.heading")}</h3>
            <label htmlFor={`${id}-summary`}>{t("help.summary-label")}</label>
            <textarea id={`${id}-summary`} readOnly rows={7} style={fieldStyle} value={buildHelpSummary(checkIn, liveShare, language)} />
            <p style={pStyle}>{t("help.summary-note")}</p>
            <div>
              <button type="button" style={buttonStyle} onClick={() => void doCopy(buildHelpSummary(checkIn, liveShare, language))}>
                {t("help.copy")}
              </button>
            </div>
            <div role="group" aria-label={t("help.links-label")} style={{ display: "grid", gap: "0.75rem" }}>
              {EMERGENCY_PATHWAYS.map((pathway) => (
                <article key={pathway.id} style={articleStyle}>
                  <h4 style={{ margin: 0 }}>{pathway.name[language]}</h4>
                  <p style={pStyle}>{pathway.detail[language]}</p>
                  <a href={pathway.href} style={linkStyle}>
                    {pathway.action[language]}
                  </a>
                  {pathway.textHref && pathway.textAction ? (
                    <a href={pathway.textHref} style={linkStyle}>
                      {pathway.textAction[language]}
                    </a>
                  ) : null}
                  {pathway.sourceUrl ? (
                    <a href={pathway.sourceUrl} style={{ ...linkStyle, background: "transparent", color: "#102a43", fontWeight: 400 }}>
                      {t("help.source")}
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section aria-labelledby={`${id}-trip`} style={sectionStyle}>
        <h2 id={`${id}-trip`} style={h2Style}>
          {t("trip.heading")}
        </h2>
        <p style={pStyle}>{t("trip.intro")}</p>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <label htmlFor={`${id}-origin`}>{t("trip.origin")}</label>
          <input id={`${id}-origin`} value={origin} onChange={(e) => setOrigin(e.target.value)} style={fieldStyle} autoComplete="off" />
          <label htmlFor={`${id}-destination`}>{t("trip.destination")}</label>
          <input id={`${id}-destination`} value={destination} onChange={(e) => setDestination(e.target.value)} style={fieldStyle} autoComplete="off" />
          <label htmlFor={`${id}-start`}>{t("trip.start")}</label>
          <input id={`${id}-start`} type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} style={fieldStyle} />
          <label htmlFor={`${id}-end`}>{t("trip.end")}</label>
          <input id={`${id}-end`} type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} style={fieldStyle} />
          <label htmlFor={`${id}-notes`}>{t("trip.notes")}</label>
          <textarea id={`${id}-notes`} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} style={fieldStyle} />
          {shareError ? (
            <p role="alert" style={{ ...pStyle, color: "#8a1c1c", fontWeight: 700 }}>
              {t(shareError)}
            </p>
          ) : null}
          <div>
            <button type="button" style={buttonStyle} onClick={onCreateShare}>
              {t("trip.create")}
            </button>
          </div>
        </div>
        {share && shareRevoked ? <p style={pStyle}>{t("trip.revoked")}</p> : null}
        {share && !shareRevoked && shareExpired ? <p style={pStyle}>{t("trip.expired", { time: formatDateTime(share.expiresAt, language) })}</p> : null}
        {liveShare ? (
          <div style={{ display: "grid", gap: "0.5rem" }} data-testid="trip-share">
            <label htmlFor={`${id}-payload`}>{t("trip.payload-label")}</label>
            <textarea id={`${id}-payload`} readOnly rows={5} style={fieldStyle} value={encodeTripShare(liveShare)} />
            <p style={pStyle}>{t("trip.expires", { time: formatDateTime(liveShare.expiresAt, language) })}</p>
            <p style={pStyle}>{t("trip.revoke-note")}</p>
            <div style={rowStyle}>
              <button type="button" style={buttonStyle} onClick={() => void doCopy(encodeTripShare(liveShare))}>
                {t("trip.copy")}
              </button>
              <button type="button" style={buttonStyle} onClick={onRevoke}>
                {t("trip.revoke")}
              </button>
            </div>
          </div>
        ) : null}
        <h3 style={{ margin: 0 }}>{t("trip.check-heading")}</h3>
        <label htmlFor={`${id}-pasted`}>{t("trip.check-label")}</label>
        <textarea id={`${id}-pasted`} rows={3} value={pasted} onChange={(e) => setPasted(e.target.value)} style={fieldStyle} />
        <div>
          <button type="button" style={buttonStyle} onClick={onCheck}>
            {t("trip.check-button")}
          </button>
        </div>
        <p role="status" aria-live="polite" style={{ ...pStyle, minHeight: "1.5rem" }} data-testid="check-result">
          {checkResult}
        </p>
      </section>

      <section aria-labelledby={`${id}-disruption`} style={sectionStyle}>
        <h2 id={`${id}-disruption`} style={h2Style}>
          {t("disruption.heading")}
        </h2>
        <p style={pStyle} data-testid="outage-status">
          {t("disruption.status-line", { status: t(`disruption.${outage.status}`) })}
        </p>
        <p style={pStyle}>{t(outage.isDefault ? "disruption.unknown-copy" : "disruption.snapshot-copy")}</p>
        {!outage.isDefault ? (
          <dl style={{ margin: 0, display: "grid", gap: "0.25rem" }}>
            <dt>{t("disruption.id")}</dt>
            <dd style={ddStyle}>{outage.snapshot.stationOrSegmentId}</dd>
            <dt>{t("disruption.source")}</dt>
            <dd style={ddStyle}>{outage.snapshot.source}</dd>
            <dt>{t("disruption.licence")}</dt>
            <dd style={ddStyle}>{outage.snapshot.licence}</dd>
            <dt>{t("disruption.retrieved")}</dt>
            <dd style={ddStyle}>{formatDateTime(outage.snapshot.retrievedAt ?? "", language)}</dd>
            <dt>{t("disruption.expires")}</dt>
            <dd style={ddStyle}>{formatDateTime(outage.snapshot.expiresAt ?? "", language)}</dd>
            <dt>{t("disruption.tier")}</dt>
            <dd style={ddStyle}>{outage.snapshot.tier}</dd>
          </dl>
        ) : null}
        <p style={pStyle}>
          {t("disruption.tier-line", { tier: outage.snapshot.tier })}
        </p>
      </section>
    </main>
  );
}

const mainStyle: CSSProperties = { boxSizing: "border-box", width: "100%", maxWidth: "44rem", overflowWrap: "anywhere", fontFamily: "system-ui, sans-serif", color: "#1a1a1a", background: "#fff", display: "grid", gap: "1rem" };
const sectionStyle: CSSProperties = { border: "3px solid #102a43", padding: "0.75rem", display: "grid", gap: "0.75rem", minWidth: 0 };
const articleStyle: CSSProperties = { border: "2px solid #102a43", padding: "0.75rem", display: "grid", gap: "0.4rem" };
const h2Style: CSSProperties = { margin: 0 };
const pStyle: CSSProperties = { margin: 0 };
const ddStyle: CSSProperties = { margin: "0 0 0.5rem 0" };
const rowStyle: CSSProperties = { display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" };
const fieldStyle: CSSProperties = { boxSizing: "border-box", width: "100%", minHeight: "44px", padding: "0.5rem", fontSize: "1rem", fontFamily: "inherit", color: "#1a1a1a", background: "#fff", border: "2px solid #102a43", borderRadius: "4px" };
const buttonStyle: CSSProperties = { minHeight: "48px", minWidth: "2.75rem", padding: "0.5rem 0.9rem", fontSize: "1rem", fontWeight: 700, background: "#fff", color: "#102a43", border: "2px solid #102a43", borderRadius: "4px", maxWidth: "100%" };
const linkStyle: CSSProperties = { display: "inline-flex", alignItems: "center", minHeight: "48px", minWidth: "2.75rem", padding: "0.5rem 0.9rem", background: "#102a43", color: "#fff", fontWeight: 700, textDecoration: "none", borderRadius: "4px", maxWidth: "100%", overflowWrap: "anywhere", boxSizing: "border-box" };
const noteStyle: CSSProperties = { margin: 0, padding: "0.75rem", background: "#f4f7fb", borderLeft: "4px solid #102a43" };
