import { useEffect, useId, useState, type CSSProperties } from "react";
import { TIMING_BOUNDARY } from "../boundaries.js";
import { blankTimingDocument, parseTimingDocument } from "../document.js";
import { EMERGENCY_PATHWAYS } from "../emergency.js";
import { planTiming } from "../plan.js";
import { HEALTH_AWARE_TIMING_ENABLED } from "../scope.js";
import type { Language, SuppliedLeg, SuppliedWaypoint, TimingDocument } from "../types.js";

export interface TimingPanelProps {
  language: Language;
  document: TimingDocument;
  legs: SuppliedLeg[];
  waypoints: SuppliedWaypoint[];
  onChange: (document: TimingDocument) => void;
  onLanguage: (language: Language) => void;
}

function field(
  label: string,
  hint: string,
  value: number | null,
  onValue: (value: number | null) => void,
  id: string,
) {
  return (
    <div style={{ display: "grid", gap: "0.35rem" }}>
      <label htmlFor={id} style={{ fontWeight: 700 }}>
        {label}
      </label>
      <span id={`${id}-hint`} style={{ color: "#1a1a1a" }}>
        {hint}
      </span>
      <input
        id={id}
        aria-describedby={`${id}-hint`}
        inputMode="numeric"
        value={value ?? ""}
        placeholder=""
        onChange={(event) => {
          const raw = event.target.value.trim();
          onValue(raw === "" ? null : Number(raw));
        }}
        style={inputStyle}
      />
    </div>
  );
}

const inputStyle: CSSProperties = {
  fontSize: "1.125rem",
  minHeight: "48px",
  padding: "0.5rem 0.75rem",
  border: "2px solid #1a1a1a",
  borderRadius: "4px",
  background: "#fff",
  color: "#1a1a1a",
};

const linkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "48px",
  padding: "0.5rem 0.9rem",
  background: "#102a43",
  color: "#fff",
  fontWeight: 700,
  textDecoration: "none",
  borderRadius: "4px",
};

export function TimingPanel(props: TimingPanelProps): JSX.Element {
  const baseId = useId();
  const { language } = props;
  const copy = language === "fr" ? fr : en;
  const [error, setError] = useState<string | null>(null);
  let planError: string | null = null;
  let plan = null as ReturnType<typeof planTiming> | null;
  if (HEALTH_AWARE_TIMING_ENABLED) {
    try {
      plan = planTiming(props.document, props.legs, props.waypoints);
    } catch (caught) {
      planError = caught instanceof Error ? caught.message : "Plan failed";
    }
  }

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function update(patch: Partial<TimingDocument>): void {
    try {
      const next = parseTimingDocument({ ...props.document, ...patch, updatedAt: new Date().toISOString() });
      props.onChange(next);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid timing note");
    }
  }

  const pathways = plan?.emergencyPathways ?? EMERGENCY_PATHWAYS;

  return (
    <main lang={language} style={{ boxSizing: "border-box", width: "100%", maxWidth: "44rem", overflowWrap: "anywhere", fontFamily: "system-ui, sans-serif", color: "#1a1a1a", background: "#fff", display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
        <h1 id={`${baseId}-title`} style={{ margin: 0 }}>
          {copy.title}
        </h1>
        <button type="button" onClick={() => props.onLanguage(language === "en" ? "fr" : "en")} style={buttonStyle}>
          {language === "en" ? "Français" : "English"}
        </button>
      </div>
      <p role="note" style={noteStyle}>
        {TIMING_BOUNDARY[language]}
      </p>
      <div aria-label={copy.emergencyLabel} style={{ display: "grid", gap: "0.75rem" }}>
        {pathways.map((pathway) => (
          <article key={pathway.id} style={{ border: "3px solid #102a43", padding: "0.75rem", display: "grid", gap: "0.4rem" }}>
            <h2 style={{ margin: 0 }}>{pathway.name[language]}</h2>
            <p style={{ margin: 0 }}>{pathway.detail[language]}</p>
            <a href={pathway.href} style={linkStyle}>
              {pathway.action[language]}
            </a>
            {pathway.textHref && pathway.textAction ? (
              <a href={pathway.textHref} style={linkStyle}>
                {pathway.textAction[language]}
              </a>
            ) : null}
            {pathway.sourceUrl ? (
              <a href={pathway.sourceUrl} style={{ color: "#102a43" }}>
                {copy.source}
              </a>
            ) : null}
          </article>
        ))}
        {plan ? <p>{plan.healthLine.message[language]}</p> : null}
      </div>
      {HEALTH_AWARE_TIMING_ENABLED ? null : <p>{copy.gated}</p>}
      {HEALTH_AWARE_TIMING_ENABLED ? (
      <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
        }}
        style={{ display: "grid", gap: "0.9rem" }}
      >
        {field(copy.washroom, copy.washroomHint, props.document.maxTimeBetweenWashroomsMin, (value) => update({ maxTimeBetweenWashroomsMin: value }), `${baseId}-wash`)}
        {field(copy.travel, copy.travelHint, props.document.maxContinuousTravelMin, (value) => update({ maxContinuousTravelMin: value }), `${baseId}-travel`)}
        {field(copy.rest, copy.restHint, props.document.restBreakEveryMin, (value) => update({ restBreakEveryMin: value }), `${baseId}-rest`)}
        {field(copy.lead, copy.leadHint, props.document.reminderLeadMin, (value) => update({ reminderLeadMin: value }), `${baseId}-lead`)}
        <button
          type="button"
          style={buttonStyle}
          onClick={() => props.onChange(parseTimingDocument({ ...blankTimingDocument(), updatedAt: new Date().toISOString() }))}
        >
          {copy.clear}
        </button>
      </form>
      {error ? (
        <p role="alert">{error}</p>
      ) : null}
      {planError ? <p role="alert">{planError}</p> : null}
      {plan?.unsetNote ? <p>{plan.unsetNote[language]}</p> : null}
      {plan && plan.flags.length > 0 ? (
        <ul>
          {plan.flags.map((flag, index) => (
            <li key={`${flag.kind}-${index}`}>{flag.message[language]}</li>
          ))}
        </ul>
      ) : null}
      {plan && plan.reminders.length > 0 ? (
        <ol aria-label={copy.reminders}>
          {plan.reminders.map((reminder, index) => (
            <li key={`${reminder.kind}-${reminder.atMinute}-${index}`}>
              {copy.atMinute} {reminder.atMinute}: {reminder.message[language]}
            </li>
          ))}
        </ol>
      ) : null}
      </>
      ) : null}
    </main>
  );
}

const buttonStyle: CSSProperties = {
  minHeight: "48px",
  padding: "0.5rem 0.9rem",
  fontSize: "1rem",
  fontWeight: 700,
  background: "#fff",
  color: "#102a43",
  border: "2px solid #102a43",
  borderRadius: "4px",
};

const noteStyle: CSSProperties = {
  margin: 0,
  padding: "0.75rem",
  background: "#f4f7fb",
  borderLeft: "4px solid #102a43",
};

const en = {
  title: "Emergency pathways",
  gated: "Personal washroom intervals and continuous-travel limits are not in the prototype. They stay off until a clinical review. This screen does not collect them.",
  emergencyLabel: "Emergency pathways",
  source: "Official page",
  washroom: "Minutes between washroom stops",
  washroomHint: "Optional. Leave blank if you do not want this note. No suggested number.",
  travel: "Minutes of continuous travel",
  travelHint: "Optional. Your own limit for one leg. Leave blank to skip.",
  rest: "Rest break every number of minutes",
  restHint: "Optional travel rest preference. Not a pressure-relief timer.",
  lead: "Remind me this many minutes before my washroom note",
  leadHint: "Optional. Leave blank to use the minute you set, with no extra lead.",
  clear: "Clear timing notes",
  reminders: "Reminders from your notes",
  atMinute: "Minute",
};

const fr = {
  title: "Voies d'urgence",
  gated: "Les intervalles entre toilettes et les limites de déplacement continu ne font pas partie du prototype. Ils restent désactivés jusqu'à une revue clinique. Cet écran ne les recueille pas.",
  emergencyLabel: "Voies d'urgence",
  source: "Page officielle",
  washroom: "Minutes entre les arrêts toilettes",
  washroomHint: "Facultatif. Laissez vide si vous ne voulez pas de cette note. Aucun chiffre suggéré.",
  travel: "Minutes de déplacement continu",
  travelHint: "Facultatif. Votre propre limite pour un tronçon. Laissez vide pour ignorer.",
  rest: "Pause toutes les combien de minutes",
  restHint: "Préférence de repos en déplacement, facultative. Pas un minuteur de soulagement de pression.",
  lead: "Me le rappeler ce nombre de minutes avant ma note toilettes",
  leadHint: "Facultatif. Laissez vide pour utiliser la minute que vous avez inscrite, sans avance.",
  clear: "Effacer les notes de temps",
  reminders: "Rappels selon vos notes",
  atMinute: "Minute",
};
