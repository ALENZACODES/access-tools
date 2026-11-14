import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { SwitchBar } from "../../../place/src/react/SwitchBar.js";
import { DIRECTORY_FRAMING, READING_CONTEXT_NOTE, TIER_MAPPING_NOTE } from "../boundaries.js";
import { directoryCopy } from "../i18n.js";
import { CATEGORY_LABEL, searchDirectory } from "../search.js";
import type { Category, DirectoryRecord, Language, NavigatorNote } from "../types.js";

const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

export interface DirectoryViewProps {
  records: readonly DirectoryRecord[];
  language: Language;
  note: NavigatorNote;
  onLanguage: (language: Language) => void;
  onToggle: (programId: string) => void;
  onClearNote: () => void;
}

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

export function DirectoryView(props: DirectoryViewProps) {
  const titleId = useId();
  const { language } = props;
  const copy = {
    title: directoryCopy("dir.title", language),
    search: directoryCopy("dir.search", language),
    filters: directoryCopy("dir.filters", language),
    results: directoryCopy("dir.results", language),
    checked: directoryCopy("dir.checked", language),
    open: directoryCopy("dir.open", language),
    frenchPage: directoryCopy("dir.french-page", language),
    call: directoryCopy("dir.call", language),
    text988: directoryCopy("dir.text-988", language),
    textConnex: directoryCopy("dir.text-connex", language),
    englishOnly: directoryCopy("dir.english-only", language),
    save: directoryCopy("dir.save", language),
    clear: directoryCopy("dir.clear", language),
    switchHelp: directoryCopy("dir.switch-help", language),
    next: directoryCopy("dir.next", language),
    choose: directoryCopy("dir.choose", language),
    confirmClear: directoryCopy("dir.confirm-clear", language),
    noteMeaning: directoryCopy("dir.note", language),
  };
  const [text, setText] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const results = useMemo(
    () => searchDirectory(props.records, { text, categories: categories.length > 0 ? categories : undefined }),
    [props.records, text, categories],
  );
  const [confirmClear, setConfirmClear] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <main lang={language} style={frame} ref={rootRef} data-switch-root>
      <SwitchBar rootRef={rootRef} nextLabel={copy.next} chooseLabel={copy.choose} help={copy.switchHelp} />
      <header style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
        <h1 id={titleId} style={{ margin: 0 }}>
          {copy.title}
        </h1>
        <button type="button" style={button} onClick={() => props.onLanguage(language === "en" ? "fr" : "en")}>
          {language === "en" ? directoryCopy("lang.show-french", "en") : directoryCopy("lang.show-english", "en")}
        </button>
      </header>
      <p role="note" style={{ margin: 0, padding: "0.75rem", background: "#f4f7fb", borderLeft: "4px solid #102a43" }}>
        {DIRECTORY_FRAMING[language]}
      </p>
      <p>{TIER_MAPPING_NOTE[language]}</p>
      <p>{READING_CONTEXT_NOTE[language]}</p>
      <form role="search" onSubmit={(event) => event.preventDefault()} style={{ display: "grid", gap: "0.75rem" }}>
        <label htmlFor="directory-search">
          {copy.search}
          <input
            id="directory-search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            style={{ ...button, fontWeight: 400, width: "100%", maxWidth: "100%" }}
          />
        </label>
        <fieldset>
          <legend>{copy.filters}</legend>
          {CATEGORIES.map((category) => (
            <label key={category} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", marginRight: "0.8rem", minHeight: "48px" }}>
              <input
                type="checkbox"
                style={{ width: "2.75rem", height: "2.75rem", minWidth: "2.75rem", minHeight: "2.75rem" }}
                checked={categories.includes(category)}
                onChange={() =>
                  setCategories((current) =>
                    current.includes(category) ? current.filter((item) => item !== category) : [...current, category],
                  )
                }
              />
              {CATEGORY_LABEL[category][language]}
            </label>
          ))}
        </fieldset>
      </form>
      <p role="status">
        {results.length} {copy.results}
      </p>
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.8rem" }}>
        {results.map((record) => (
          <li key={record.id} style={{ border: "2px solid #1a1a1a", padding: "0.8rem", display: "grid", gap: "0.45rem", minWidth: 0 }}>
            <h2 style={{ margin: 0 }}>{record.name[language]}</h2>
            <p style={{ margin: 0 }}>
              {CATEGORY_LABEL[record.category][language]} · {record.administrator[language]}
            </p>
            <p style={{ margin: 0 }}>{record.summary[language]}</p>
            {record.doesNot ? <p style={{ margin: 0 }}>{record.doesNot[language]}</p> : null}
            {record.figure ? (
              <p style={{ margin: 0 }}>
                {record.figure.statement[language]} {record.figure.qualifier[language]} {copy.checked} {record.figure.retrievedOn}.
              </p>
            ) : null}
            <p style={{ margin: 0 }}>{record.verificationPlain[language]}</p>
            <p style={{ margin: 0 }}>{record.licenceNote[language]}</p>
            <p style={{ margin: 0 }}>{record.neverMeans[language]}</p>
            <p style={{ margin: 0 }}>
              <a href={record.officialUrl} style={linkStyle}>
                {copy.open} {record.name[language]}
              </a>
              {record.frenchOfficialUrl ? (
                <>
                  {" "}
                  ·{" "}
                  <a href={record.frenchOfficialUrl} style={linkStyle}>
                    {copy.frenchPage}
                  </a>
                </>
              ) : (
                <span>
                  {" "}
                  · {copy.englishOnly}
                </span>
              )}
            </p>
            {record.phone ? (
              <p style={{ margin: 0 }}>
                <a href={record.phone} style={linkStyle}>
                  {copy.call} {record.name[language]}
                  {record.id === "suicide-crisis-helpline" || record.id === "connexontario" || !record.phoneNote
                    ? ""
                    : `, ${record.phoneNote[language]}`}
                </a>
                {record.id === "suicide-crisis-helpline" ? (
                  <>
                    {" "}
                    <a href="sms:988" style={linkStyle}>
                      {copy.text988}
                    </a>
                  </>
                ) : null}
                {record.id === "connexontario" ? (
                  <>
                    {" "}
                    <a href="sms:247247?&body=CONNEX" style={linkStyle}>
                      {copy.textConnex}
                    </a>
                  </>
                ) : null}
                {record.id === "suicide-crisis-helpline" || record.id === "connexontario" ? (
                  record.phoneNote ? <span> {record.phoneNote[language]}</span> : null
                ) : null}
              </p>
            ) : null}
            <button type="button" style={button} onClick={() => props.onToggle(record.id)} aria-pressed={props.note.programIds.includes(record.id)}>
              {copy.save}
            </button>
          </li>
        ))}
      </ul>
      {confirmClear ? (
        <button
          type="button"
          style={button}
          onClick={() => {
            props.onClearNote();
            setConfirmClear(false);
          }}
        >
          {copy.confirmClear}
        </button>
      ) : (
        <button type="button" style={button} onClick={() => setConfirmClear(true)}>
          {copy.clear} ({props.note.programIds.length})
        </button>
      )}
      <p>{copy.noteMeaning}</p>
    </main>
  );
}

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
