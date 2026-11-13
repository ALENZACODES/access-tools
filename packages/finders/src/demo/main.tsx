import { useState } from "react";
import { createRoot } from "react-dom/client";
import { a11yCss, fixturePack, type Lang } from "@access-tools/place";
import { ChargingFinder, ParkingFinder, RepairSupplyFinder, WashroomFinder } from "../react/Finders.js";

function Demo() {
  const [lang, setLang] = useState<Lang>("en");
  const [registerOnly, setRegisterOnly] = useState(false);
  const [vanLift, setVanLift] = useState(false);
  const [showHidden, setShowHidden] = useState(true);
  const [range, setRange] = useState("");
  const parsedRange = range.trim() === "" ? null : Number(range);
  const userTestedRangeMetres = parsedRange !== null && Number.isFinite(parsedRange) ? parsedRange : null;
  return (
    <div className="app-ui" lang={lang}>
      <style>{a11yCss}</style>
      <a href="#finder-main">{lang === "fr" ? "Aller au contenu" : "Skip to content"}</a>
      <header>
        <h1>{lang === "fr" ? "l'application — outils de recherche" : "the App — finders"}</h1>
        <p>
          {lang === "fr"
            ? "Démonstration sur le jeu d'essai étiqueté. Ce n'est pas une carte. Les lieux réels viendront d'access-maps."
            : "Demo on the labelled fixture pack. This is not a map. Real places will come from access-maps."}
        </p>
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
      <main id="finder-main" className="stack">
        <fieldset>
          <legend>{lang === "fr" ? "Filtres de démonstration" : "Demo filters"}</legend>
          <label>
            <input type="checkbox" checked={registerOnly} onChange={(event) => setRegisterOnly(event.target.checked)} />
            {lang === "fr" ? " Registre des tables de change et lève-personnes" : " Adult change table and hoist register"}
          </label>
          <label>
            <input type="checkbox" checked={vanLift} onChange={(event) => setVanLift(event.target.checked)} />
            {lang === "fr" ? " Hayon latéral" : " Side lift"}
          </label>
          <label>
            <input type="checkbox" checked={showHidden} onChange={(event) => setShowHidden(event.target.checked)} />
            {lang === "fr" ? " Afficher les fiches cachées" : " Show hidden records"}
          </label>
          <label htmlFor="range">{lang === "fr" ? "Votre autonomie essayée, en mètres (facultatif)" : "Your tested range, in metres (optional)"}</label>
          <input id="range" type="text" inputMode="decimal" value={range} onChange={(event) => setRange(event.target.value)} />
        </fieldset>
        <WashroomFinder
          pack={fixturePack}
          query={{
            text: "",
            lang,
            origin: { latitude: 43.7, longitude: -79.4 },
            transferSide: "any",
            changeTable: false,
            hoist: false,
            registerOnly,
            openAt: null,
            showHidden,
          }}
        />
        <ParkingFinder
          pack={fixturePack}
          query={{
            text: "",
            lang,
            origin: { latitude: 43.7, longitude: -79.4 },
            vanLift,
            showHidden,
            month: 11,
          }}
        />
        <ChargingFinder
          pack={fixturePack}
          query={{
            text: "",
            lang,
            origin: { latitude: 43.7, longitude: -79.4 },
            openAt: null,
            showHidden,
            userTestedRangeMetres,
          }}
        />
        <RepairSupplyFinder
          pack={fixturePack}
          query={{
            text: "",
            lang,
            origin: { latitude: 43.7, longitude: -79.4 },
            kind: "all",
            mobileOnly: false,
            outOfHours: false,
            supplyCategory: "any",
            openAt: null,
            showHidden,
          }}
        />
      </main>
    </div>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<Demo />);
