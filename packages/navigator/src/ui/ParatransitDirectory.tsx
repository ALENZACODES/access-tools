import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { SwitchBar } from "../../../place/src/react/SwitchBar.js";
import { directoryCopy, directoryFill } from "../i18n.js";
import { PARATRANSIT, publishedPhoneHref } from "../paratransit/entries.js";
import type { ParatransitEntry } from "../paratransit/types.js";
import type { Language } from "../types.js";

const button: CSSProperties = {
  boxSizing: "border-box",
  minHeight: "48px",
  minWidth: "2.75rem",
  maxWidth: "100%",
  padding: "0.55rem 0.8rem",
  font: "inherit",
  fontWeight: 700,
  background: "#fff",
  color: "#102a43",
  border: "2px solid #102a43",
  borderRadius: "4px",
};

const linkStyle: CSSProperties = {
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  minHeight: "44px",
  minWidth: "2.75rem",
  maxWidth: "100%",
  color: "#102a43",
  overflowWrap: "anywhere",
};

const frame: CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  maxWidth: "48rem",
  overflowWrap: "anywhere",
  fontFamily: "system-ui, sans-serif",
  color: "#1a1a1a",
  background: "#fff",
  display: "grid",
  gap: "1rem",
};

export function ParatransitDirectory() {
  const titleId = useId();
  const searchId = useId();
  const [language, setLanguage] = useState<Language>("en");
  const [text, setText] = useState("");
  const rootRef = useRef<HTMLElement>(null);
  const results = useMemo(() => filterAgencies(PARATRANSIT, text), [text]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <main lang={language} style={frame} ref={rootRef} data-switch-root>
      <SwitchBar
        rootRef={rootRef}
        nextLabel={directoryCopy("dir.next", language)}
        chooseLabel={directoryCopy("dir.choose", language)}
        help={directoryCopy("para.switch-help", language)}
      />
      <header style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
        <h1 id={titleId} style={{ margin: 0 }}>
          {directoryCopy("para.title", language)}
        </h1>
        <button type="button" style={button} onClick={() => setLanguage(language === "en" ? "fr" : "en")}>
          {language === "en" ? directoryCopy("lang.show-french", "en") : directoryCopy("lang.show-english", "en")}
        </button>
      </header>
      <p role="note" style={{ margin: 0, padding: "0.75rem", background: "#f4f7fb", borderLeft: "4px solid #102a43" }}>
        {directoryCopy("para.note", language)} {directoryCopy("para.not-ride", language)}
      </p>
      <form role="search" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor={searchId}>
          {directoryCopy("para.search", language)}
          <input
            id={searchId}
            value={text}
            onChange={(event) => setText(event.target.value)}
            style={{ ...button, fontWeight: 400, width: "100%", maxWidth: "100%" }}
          />
        </label>
      </form>
      <p role="status">
        {results.length} {directoryCopy("para.results", language)}
      </p>
      {results.length === 0 ? <p>{directoryCopy("para.empty", language)}</p> : null}
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.8rem" }}>
        {results.map((entry) => (
          <li key={entry.id} style={{ border: "2px solid #1a1a1a", padding: "0.8rem", display: "grid", gap: "0.45rem", minWidth: 0 }}>
            <h2 lang="en" style={{ margin: 0 }}>
              {entry.agencyName}
            </h2>
            <p lang="en" style={{ margin: 0 }}>
              {entry.publisher}
            </p>
            <p style={{ margin: 0 }}>
              {directoryCopy("para.area", language)} {entry.serviceArea[language]}
            </p>
            <p style={{ margin: 0 }}>
              <a href={entry.websiteUrl} style={linkStyle}>
                {directoryFill("para.website", language, { name: entry.agencyName })}
              </a>
              {" · "}
              {directoryCopy("dir.english-only", language)}
            </p>
            <p style={{ margin: 0 }}>
              <a href={entry.bookingUrl} style={linkStyle}>
                {directoryFill("para.booking", language, { name: entry.agencyName })}
              </a>
            </p>
            <p style={{ margin: 0 }}>
              <a href={publishedPhoneHref(entry.phone)} style={linkStyle}>
                {directoryFill("para.call", language, { phone: entry.phone })}
              </a>
            </p>
            <p style={{ margin: 0 }}>
              <a href={entry.sourceUrl} style={linkStyle}>
                {directoryFill("para.source", language, { name: entry.agencyName })}
              </a>
            </p>
            <p style={{ margin: 0 }}>{directoryFill("para.retrieved", language, { date: entry.retrievedOn })}</p>
            <p style={{ margin: 0 }}>
              {directoryCopy("para.tier", language)} {directoryCopy("para.unverified", language)}
            </p>
            <p style={{ margin: 0 }}>{entry.licenceNote[language]}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}

function filterAgencies(entries: readonly ParatransitEntry[], text: string): ParatransitEntry[] {
  const needle = text.trim().toLocaleLowerCase();
  if (!needle) return [...entries];
  return entries.filter((entry) =>
    [entry.agencyName, entry.publisher, entry.serviceArea.en, entry.serviceArea.fr, entry.phone]
      .join(" ")
      .toLocaleLowerCase()
      .includes(needle),
  );
}
