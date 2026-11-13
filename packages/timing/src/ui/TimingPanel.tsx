import { useEffect, useId, type CSSProperties } from "react";
import { TIMING_BOUNDARY } from "../boundaries.js";
import { EMERGENCY_PATHWAYS } from "../emergency.js";
import { timingCopy } from "../i18n.js";
import type { Language } from "../types.js";

export interface TimingPanelProps {
  language: Language;
  onLanguage: (language: Language) => void;
}

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
  maxWidth: "100%",
  overflowWrap: "anywhere",
};

export function TimingPanel(props: TimingPanelProps): JSX.Element {
  const baseId = useId();
  const { language } = props;
  const copy = {
    title: timingCopy("timing.title", language),
    emergencyLabel: timingCopy("timing.emergency-label", language),
    source: timingCopy("timing.source", language),
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <main lang={language} style={{ boxSizing: "border-box", width: "100%", maxWidth: "44rem", overflowWrap: "anywhere", fontFamily: "system-ui, sans-serif", color: "#1a1a1a", background: "#fff", display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
        <h1 id={`${baseId}-title`} style={{ margin: 0 }}>
          {copy.title}
        </h1>
        <button type="button" onClick={() => props.onLanguage(language === "en" ? "fr" : "en")} style={buttonStyle}>
          {language === "en" ? timingCopy("lang.show-french", "en") : timingCopy("lang.show-english", "en")}
        </button>
      </div>
      <p role="note" style={noteStyle}>
        {TIMING_BOUNDARY[language]}
      </p>
      <div aria-label={copy.emergencyLabel} style={{ display: "grid", gap: "0.75rem" }}>
        {EMERGENCY_PATHWAYS.map((pathway) => (
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
      </div>
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

