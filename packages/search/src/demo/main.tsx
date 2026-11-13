import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  a11yCss,
  appendChange,
  appendCorrection,
  changesFor,
  correctionsFor,
  emptyLog,
  fixturePack,
  FIXTURE_DAY,
  PlacePage,
  readLog,
  writeLog,
  type Lang,
  type ReportLog,
} from "@access-tools/place";
import { emptySearchQuery, type SearchQuery } from "../search.js";
import { SearchPanel } from "../react/SearchPanel.js";

function Demo() {
  const [lang, setLang] = useState<Lang>("en");
  const [query, setQuery] = useState<SearchQuery>(emptySearchQuery("en"));
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [log, setLog] = useState<ReportLog>(() => {
    try {
      return readLog(window.localStorage);
    } catch {
      return emptyLog();
    }
  });
  const place = fixturePack.places.find((item) => item.id === placeId) ?? null;
  const save = (next: ReportLog) => {
    setLog(next);
    try {
      writeLog(window.localStorage, next);
    } catch {
      /* storage may be blocked */
    }
  };
  return (
    <div className="app-ui" lang={lang}>
      <style>{a11yCss}</style>
      <a href="#search-main">{lang === "fr" ? "Aller au contenu" : "Skip to content"}</a>
      <header>
        <h1>{lang === "fr" ? "l'application — recherche" : "the App — search"}</h1>
        <p>
          {lang === "fr"
            ? "Démonstration sur le jeu d'essai étiqueté. Les lieux réels viendront d'access-maps."
            : "Demo on the labelled fixture pack. Real places will come from access-maps."}
        </p>
        <button
          type="button"
          onClick={() => {
            const next = lang === "en" ? "fr" : "en";
            setLang(next);
            setQuery((current) => ({ ...current, lang: next }));
            document.documentElement.lang = next;
          }}
        >
          {lang === "en" ? "Français" : "English"}
        </button>
      </header>
      <main id="search-main">
        <SearchPanel
          pack={fixturePack}
          query={{ ...query, lang }}
          onQueryChange={setQuery}
          onOpenPlace={setPlaceId}
        />
        {place ? (
          <PlacePage
            place={place}
            pack={fixturePack}
            lang={lang}
            today={FIXTURE_DAY}
            headingLevel={2}
            corrections={correctionsFor(log, place.id)}
            changes={changesFor(log, place.id)}
            onCorrection={(input) => {
              const id = crypto.randomUUID();
              save(appendCorrection(log, { ...input, placeId: place.id }, new Date().toISOString(), id));
            }}
            onChange={(input) => {
              const id = crypto.randomUUID();
              save(appendChange(log, { ...input, placeId: place.id }, new Date().toISOString(), id));
            }}
          />
        ) : (
          <p>{lang === "fr" ? "Choisissez un lieu dans les résultats." : "Choose a place from the results."}</p>
        )}
      </main>
    </div>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<Demo />);
