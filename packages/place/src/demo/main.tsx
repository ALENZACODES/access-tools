import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { appendChange, appendCorrection, correctionsFor, changesFor, emptyLog, readLog, writeLog } from "../corrections.js";
import { fixturePack, FIXTURE_DAY } from "../fixtures.js";
import { FixturePlaceNav } from "../react/FixturePlaceNav.js";
import { PlacePage } from "../react/PlacePage.js";
import { a11yCss } from "../react/a11yCss.js";
import type { Lang, ReportLog } from "../types.js";

function Demo() {
  const [lang, setLang] = useState<Lang>("en");
  const [placeId, setPlaceId] = useState(fixturePack.places[0]?.id ?? "");
  const [log, setLog] = useState<ReportLog>(() => {
    try {
      return readLog(window.localStorage);
    } catch {
      return emptyLog();
    }
  });
  const place = useMemo(() => fixturePack.places.find((item) => item.id === placeId) ?? fixturePack.places[0], [placeId]);
  if (!place) return null;
  const save = (next: ReportLog) => {
    setLog(next);
    try {
      writeLog(window.localStorage, next);
    } catch {
      /* in-memory only when storage is blocked */
    }
  };
  return (
    <div className="app-ui" lang={lang}>
      <style>{a11yCss}</style>
      <a href="#demo-main">{lang === "fr" ? "Aller au contenu" : "Skip to content"}</a>
      <header>
        <p>{lang === "fr" ? "l'application — pages de lieux" : "the application — place pages"}</p>
        <button
          type="button"
          onClick={() => {
            const next = lang === "en" ? "fr" : "en";
            setLang(next);
            document.documentElement.lang = next;
          }}
        >
          {lang === "en" ? "Français" : "English"}
        </button>
      </header>
      <FixturePlaceNav places={fixturePack.places} lang={lang} currentId={place.id} onSelect={setPlaceId} />
      <main id="demo-main">
      <PlacePage
        place={place}
        pack={fixturePack}
        lang={lang}
        today={FIXTURE_DAY}
        corrections={correctionsFor(log, place.id)}
        changes={changesFor(log, place.id)}
        onCorrection={(input) => {
          const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `c-${Date.now()}`;
          save(appendCorrection(log, { ...input, placeId: place.id }, new Date().toISOString(), id));
        }}
        onChange={(input) => {
          const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `r-${Date.now()}`;
          save(appendChange(log, { ...input, placeId: place.id }, new Date().toISOString(), id));
        }}
      />
      </main>
    </div>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<Demo />);
