import { useEffect, useId, useMemo, useState, type CSSProperties } from "react";
import { DIRECTORY_FRAMING, READING_CONTEXT_NOTE, TIER_MAPPING_NOTE } from "../boundaries.js";
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
  const copy = language === "fr" ? fr : en;
  const [text, setText] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const results = useMemo(
    () => searchDirectory(props.records, { text, categories: categories.length > 0 ? categories : undefined }),
    [props.records, text, categories],
  );
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <main lang={language} style={frame}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
        <h1 id={titleId} style={{ margin: 0 }}>
          {copy.title}
        </h1>
        <button type="button" style={button} onClick={() => props.onLanguage(language === "en" ? "fr" : "en")}>
          {language === "en" ? "Français" : "English"}
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
            <p style={{ margin: 0 }}>
              {record.prototypeLabel}
              {record.tier ? ` · ${copy.tier} ${record.tier}` : ` · ${copy.noTier}`}
            </p>
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
                  {record.phoneNote ? `, ${record.phoneNote[language]}` : ""}
                </a>
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
  maxWidth: "100%",
  color: "#102a43",
  overflowWrap: "anywhere",
};

const en = {
  title: "Directory",
  search: "Search programs and services",
  filters: "Categories",
  results: "records. Each one links out. None is an application.",
  checked: "Page checked",
  open: "Official page:",
  frenchPage: "Official French page",
  call: "Call",
  englishOnly: "English only",
  tier: "Tier",
  noTier: "Unchecked. No tier.",
  save: "Save this title on this device",
  clear: "Delete the on-device list",
  confirmClear: "Confirm delete of the on-device list",
  noteMeaning: "The on-device list is only titles you marked. It is not an application and it is not sent anywhere.",
};

const fr: typeof en = {
  title: "Répertoire",
  search: "Chercher des programmes et des services",
  filters: "Catégories",
  results: "fiches. Chacune mène ailleurs. Aucune n'est une demande.",
  checked: "Page consultée",
  open: "Page officielle :",
  frenchPage: "Page officielle en français",
  call: "Appeler",
  englishOnly: "En anglais seulement",
  tier: "Niveau",
  noTier: "Non vérifié. Aucun niveau.",
  save: "Garder ce titre sur cet appareil",
  clear: "Effacer la liste sur l'appareil",
  confirmClear: "Confirmer l'effacement de la liste sur l'appareil",
  noteMeaning: "La liste sur l'appareil ne contient que les titres que vous avez marqués. Ce n'est pas une demande et elle n'est envoyée nulle part.",
};
