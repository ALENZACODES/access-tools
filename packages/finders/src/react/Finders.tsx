import { a11yCss, EnglishOnlyNote, EnglishText, RecordText, type PlacePack } from "@access-tools/place";
import { finderCopy, finderFill } from "../i18n.js";
import { findCharging, type ChargingQuery } from "../charging.js";
import { findRepairAndSupply, type RepairQuery } from "../repair.js";
import { HiddenList, PlaceName } from "./shared.js";

export { ParkingFinder } from "./ParkingFinder.js";
export { WashroomFinder } from "./WashroomFinder.js";
export type { FinderEntry } from "./shared.js";

export function ChargingFinder({ pack, query }: { pack: PlacePack; query: ChargingQuery }) {
  const result = findCharging(pack, query);
  const lang = query.lang;
  return (
    <section className="app-ui" aria-labelledby="charging-heading" lang={lang}>
      <style>{a11yCss}</style>
      <h2 id="charging-heading">{finderCopy("finder.charging.heading", lang)}</h2>
      <EnglishOnlyNote lang={lang} />
      <p>{result.rangeReminder}</p>
      <p>
        {finderCopy("finder.charging.note", lang)}
      </p>
      <ul>
        {result.hits.map((hit) => (
          <li key={hit.pointId} className="card">
            <h3>
              <PlaceName lang={lang} name={hit.placeName} english={hit.placeNameIsEnglish} /> —{" "}
              <RecordText lang={lang} text={hit.pointName} />
            </h3>
            <p>{hit.recommendation}</p>
            <dl>
              <dt>{finderCopy("finder.distance", lang)}</dt>
              <dd>{hit.distanceMetres === null ? finderCopy("finder.unknown", lang) : `${hit.distanceMetres} m`}</dd>
              <dt>{finderCopy("finder.access", lang)}</dt>
              <dd>{hit.accessText}</dd>
              <dt>{finderCopy("finder.hours", lang)}</dt>
              <dd>
                <RecordText lang={lang} text={hit.hoursText} />
              </dd>
              <dt>{finderCopy("finder.seating", lang)}</dt>
              <dd>{hit.seatingText}</dd>
              <dt>{finderCopy("finder.date", lang)}</dt>
              <dd>
                {hit.verificationDate}. {hit.tierText}
              </dd>
            </dl>
            {hit.rangeText ? <p>{hit.rangeText}</p> : null}
            {hit.phone ? (
              <p>
                <a href={`tel:${hit.phone}`}>{finderFill("finder.call", lang, { phone: hit.phone })}</a>
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {result.empty ? (
        <p role="status">{finderCopy("finder.charging.empty", lang)}</p>
      ) : null}
    </section>
  );
}

export function RepairSupplyFinder({ pack, query }: { pack: PlacePack; query: RepairQuery }) {
  const result = findRepairAndSupply(pack, query);
  const lang = query.lang;
  return (
    <section className="app-ui" aria-labelledby="repair-heading" lang={lang}>
      <style>{a11yCss}</style>
      <h2 id="repair-heading">{finderCopy("finder.repair.heading", lang)}</h2>
      <EnglishOnlyNote lang={lang} />
      <p role="note">{result.disclaimer}</p>
      <p>{result.stockNote}</p>
      <ul>
        {result.hits.map((hit) => (
          <li key={hit.id} className="card">
            <h3>
              <PlaceName lang={lang} name={hit.name} english={hit.nameIsEnglish} />
            </h3>
            <dl>
              <dt>{finderCopy("finder.distance", lang)}</dt>
              <dd>{hit.distanceMetres === null ? finderCopy("finder.unknown", lang) : `${hit.distanceMetres} m`}</dd>
              <dt>{hit.kind === "repair" ? finderCopy("finder.services", lang) : finderCopy("finder.categories", lang)}</dt>
              <dd>{hit.servicesText}</dd>
              <dt>{finderCopy("finder.hours", lang)}</dt>
              <dd>
                <RecordText lang={lang} text={hit.hoursText} />
              </dd>
              <dt>{finderCopy("finder.detail", lang)}</dt>
              <dd>
                <EnglishText lang={lang} text={hit.extraText} fragments={hit.englishFragments} />
              </dd>
              <dt>{finderCopy("finder.date", lang)}</dt>
              <dd>
                {hit.verificationDate}. {hit.tierText}
              </dd>
            </dl>
            {hit.phone ? (
              <p>
                <a href={`tel:${hit.phone}`}>{finderFill("finder.call", lang, { phone: hit.phone })}</a>
              </p>
            ) : (
              <p>{finderCopy("finder.phone-unknown", lang)}</p>
            )}
            {hit.website ? (
              <p>
                <a href={hit.website}>{finderCopy("finder.fixture-page", lang)}</a>
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {result.empty ? (
        <p role="status">{finderCopy("finder.repair.empty", lang)}</p>
      ) : null}
      {query.showHidden ? (
        <HiddenList
          contextId="repair-heading"
          lang={lang}
          title={finderCopy("finder.hidden-records", lang)}
          items={result.hidden.map((hit) => ({
            id: hit.id,
            name: <PlaceName lang={lang} name={hit.name} english={hit.nameIsEnglish} />,
            reasons: hit.hiddenReasons,
          }))}
        />
      ) : null}
    </section>
  );
}
