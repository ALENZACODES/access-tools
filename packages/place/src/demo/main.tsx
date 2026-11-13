import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { appendChange, appendCorrection, correctionsFor, changesFor, emptyLog, readLog, writeLog } from "../corrections.js";
import { fixturePack, FIXTURE_DAY } from "../fixtures.js";
import { copy } from "../i18n.js";
import { readProfile, type EquipmentProfile } from "../profile.js";
import { EquipmentProfileForm } from "../react/EquipmentProfileForm.js";
import { FixturePlaceNav } from "../react/FixturePlaceNav.js";
import { PlacePage } from "../react/PlacePage.js";
import { a11yCss } from "../react/a11yCss.js";
import type { Lang, ReportLog } from "../types.js";

export function PlaceDemo() {
  const [lang, setLang] = useState<Lang>("en");
  const [placeId, setPlaceId] = useState(fixturePack.places[0]?.id ?? "");
  const [profile, setProfile] = useState<EquipmentProfile | null>(() => {
    try {
      return readProfile(window.localStorage);
    } catch {
      return null;
    }
  });
  const [log, setLog] = useState<ReportLog>(() => {
    try {
      return readLog(window.localStorage);
    } catch {
      return emptyLog();
    }
  });
  const place = useMemo(() => fixturePack.places.find((item) => item.id === placeId) ?? fixturePack.places[0], [placeId]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
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
      <a href="#demo-main">{copy("nav.skip", lang)}</a>
      <header>
        <p>{copy("demo.place-title", lang)}</p>
        <button
          type="button"
          lang={lang === "en" ? "fr" : "en"}
          onClick={() => {
            const next = lang === "en" ? "fr" : "en";
            setLang(next);
          }}
        >
          {lang === "en" ? copy("lang.show-french", "en") : copy("lang.show-english", "en")}
        </button>
      </header>
      <FixturePlaceNav places={fixturePack.places} lang={lang} currentId={place.id} onSelect={setPlaceId} />
      <main id="demo-main">
      <EquipmentProfileForm lang={lang} storage={window.localStorage} onChange={setProfile} />
      <PlacePage
        place={place}
        pack={fixturePack}
        lang={lang}
        today={FIXTURE_DAY}
        profile={profile}
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
if (root?.dataset.demo === "place") createRoot(root).render(<PlaceDemo />);
