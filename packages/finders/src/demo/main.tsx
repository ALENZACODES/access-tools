import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { a11yCss, copy, EquipmentProfileForm, fixturePack, placeById, readProfile, RecordText, SwitchBar, type EquipmentProfile, type Lang, type PlaceRecord } from "@access-tools/place";
import { destinationText } from "../filters.js";
import { finderCopy } from "../i18n.js";
import { ChargingFinder, ParkingFinder, RepairSupplyFinder, WashroomFinder } from "../react/Finders.js";

/** The journey stand-in ends at this fixture. The place stand-in is this fixture lot. Both are demonstration data. */
const JOURNEY_DESTINATION_ID = "fix-community-centre";
const PLACE_PAGE_ID = "fix-parking-lot";
const DEMO_ORIGIN = { latitude: 43.7, longitude: -79.4 };

type DemoView =
  | { screen: "home" }
  | { screen: "washroom" | "parking"; from: "journey" | "place"; destination: string; opener: string };

function DemoPlaceName({ place, lang }: { place: PlaceRecord; lang: Lang }) {
  if (lang === "fr" && place.nameFr) return <>{place.nameFr}</>;
  return <RecordText lang={lang} text={place.identity.name} />;
}

export function FinderDemo() {
  const [view, setView] = useState<DemoView>({ screen: "home" });
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const journeyPlace = placeById(JOURNEY_DESTINATION_ID);
  const pagePlace = placeById(PLACE_PAGE_ID);
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
  // Back puts focus on the control that opened the finder.
  useEffect(() => {
    if (view.screen !== "home" || !returnTo) return;
    document.getElementById(returnTo)?.focus();
    setReturnTo(null);
  }, [view, returnTo]);
  function open(screen: "washroom" | "parking", from: "journey" | "place", place: PlaceRecord, opener: string) {
    setView({ screen, from, destination: destinationText(place, lang), opener });
  }
  function back() {
    if (view.screen !== "home") setReturnTo(view.opener);
    setView({ screen: "home" });
  }
  return (
    <div className="app-ui" lang={lang} ref={rootRef} data-switch-root>
      <style>{a11yCss}</style>
      <a href="#finder-main">{finderCopy("nav.skip", lang)}</a>
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
      {view.screen === "washroom" ? (
        <main id="finder-main" className="stack">
          {/* Inside main so the bar is in a landmark. It stays sticky for the whole of main. */}
          <SwitchBar rootRef={rootRef} nextLabel={copy("switch.next", lang)} chooseLabel={copy("switch.choose", lang)} help={copy("switch.help", lang)} />

          <WashroomFinder
            pack={fixturePack}
            entry={{ from: view.from, onBack: back }}
            query={{
              text: view.destination,
              lang,
              origin: DEMO_ORIGIN,
              transferSide: "any",
              changeTable: false,
              hoist: false,
              registerOnly: false,
              openAt: null,
              showHidden: true,
              profile,
            }}
          />
        </main>
      ) : null}
      {view.screen === "parking" ? (
        <main id="finder-main" className="stack">
          {/* Inside main so the bar is in a landmark. It stays sticky for the whole of main. */}
          <SwitchBar rootRef={rootRef} nextLabel={copy("switch.next", lang)} chooseLabel={copy("switch.choose", lang)} help={copy("switch.help", lang)} />

          <ParkingFinder
            pack={fixturePack}
            entry={{ from: view.from, onBack: back }}
            query={{ text: view.destination, lang, origin: DEMO_ORIGIN, vanLift: false, showHidden: true, month: 11, profile }}
          />
        </main>
      ) : null}
      {view.screen === "home" ? (
      <main id="finder-main" className="stack">
          {/* Inside main so the bar is in a landmark. It stays sticky for the whole of main. */}
          <SwitchBar rootRef={rootRef} nextLabel={copy("switch.next", lang)} chooseLabel={copy("switch.choose", lang)} help={copy("switch.help", lang)} />

        {journeyPlace ? (
          <section aria-labelledby="demo-journey-heading" className="card" data-demo-journey>
            <h2 id="demo-journey-heading">{finderCopy("demo.journey.heading", lang)}</h2>
            <p>{finderCopy("demo.journey.note", lang)}</p>
            <p>
              {finderCopy("finder.destination", lang)}
              {copy("sep.colon", lang)}
              <DemoPlaceName place={journeyPlace} lang={lang} />
            </p>
            <p>
              <button id="demo-journey-washrooms" type="button" onClick={() => open("washroom", "journey", journeyPlace, "demo-journey-washrooms")}>
                {finderCopy("demo.journey.washrooms", lang)}
              </button>
            </p>
            <p>
              <button id="demo-journey-parking" type="button" onClick={() => open("parking", "journey", journeyPlace, "demo-journey-parking")}>
                {finderCopy("demo.journey.parking", lang)}
              </button>
            </p>
          </section>
        ) : null}
        {pagePlace ? (
          <section aria-labelledby="demo-place-heading" className="card" data-demo-place>
            <h2 id="demo-place-heading">{finderCopy("demo.place.heading", lang)}</h2>
            <p>{finderCopy("demo.place.note", lang)}</p>
            <p>
              <DemoPlaceName place={pagePlace} lang={lang} />
            </p>
            <p>
              <button id="demo-place-parking" type="button" onClick={() => open("parking", "place", pagePlace, "demo-place-parking")}>
                {finderCopy("demo.place.parking", lang)}
              </button>
            </p>
          </section>
        ) : null}
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
            origin: DEMO_ORIGIN,
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
            origin: DEMO_ORIGIN,
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
            origin: DEMO_ORIGIN,
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
            origin: DEMO_ORIGIN,
            kind: "all",
            mobileOnly: false,
            outOfHours: false,
            supplyCategory: "any",
            openAt: null,
            showHidden,
          }}
        />
      </main>
      ) : null}
    </div>
  );
}

const root = document.getElementById("root");
if (root?.dataset.demo === "finders") createRoot(root).render(<FinderDemo />);
