import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { a11yCss, copy, EquipmentProfileForm, fixturePack, readProfile, SwitchBar, type EquipmentProfile, type Lang } from "@access-tools/place";
import { finderCopy } from "../i18n.js";
import { ChargingFinder, ParkingFinder, RepairSupplyFinder, WashroomFinder } from "../react/Finders.js";

export function FinderDemo() {
  const [lang, setLang] = useState<Lang>("en");
  const [registerOnly, setRegisterOnly] = useState(false);
  const [vanLift, setVanLift] = useState(false);
  const [showHidden, setShowHidden] = useState(true);
  const [profile, setProfile] = useState<EquipmentProfile | null>(() => {
    try {
      return readProfile(window.localStorage);
    } catch {
      return null;
    }
  });
  const [range, setRange] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const parsedRange = range.trim() === "" ? null : Number(range);
  const userTestedRangeMetres = parsedRange !== null && Number.isFinite(parsedRange) ? parsedRange : null;
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return (
    <div className="app-ui" lang={lang} ref={rootRef} data-switch-root>
      <style>{a11yCss}</style>
      <a href="#finder-main">{finderCopy("nav.skip", lang)}</a>
      <SwitchBar rootRef={rootRef} nextLabel={copy("switch.next", lang)} chooseLabel={copy("switch.choose", lang)} help={copy("switch.help", lang)} />
      <header>
        <h1>{finderCopy("demo.title", lang)}</h1>
        <p>{finderCopy("demo.intro", lang)}</p>
        <button
          type="button"
          lang={lang === "en" ? "fr" : "en"}
          onClick={() => {
            const next = lang === "en" ? "fr" : "en";
            setLang(next);
          }}
        >
          {lang === "en" ? finderCopy("lang.show-french", "en") : finderCopy("lang.show-english", "en")}
        </button>
      </header>
      <main id="finder-main" className="stack">
        <EquipmentProfileForm lang={lang} storage={window.localStorage} onChange={setProfile} />
        <fieldset>
          <legend>{finderCopy("demo.filters", lang)}</legend>
          <label>
            <input type="checkbox" checked={registerOnly} onChange={(event) => setRegisterOnly(event.target.checked)} />
            {" "}
            {finderCopy("demo.register", lang)}
          </label>
          <label>
            <input type="checkbox" checked={vanLift} onChange={(event) => setVanLift(event.target.checked)} />
            {" "}
            {finderCopy("demo.lift", lang)}
          </label>
          <label>
            <input type="checkbox" checked={showHidden} onChange={(event) => setShowHidden(event.target.checked)} />
            {" "}
            {finderCopy("demo.hidden", lang)}
          </label>
          <label htmlFor="range">{finderCopy("demo.range", lang)}</label>
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
            profile,
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
            profile,
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
            profile,
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
if (root?.dataset.demo === "finders") createRoot(root).render(<FinderDemo />);
