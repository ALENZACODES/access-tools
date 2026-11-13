import type { ReactNode } from "react";
import { a11yCss, copy, EnglishOnlyNote, EnglishText, RecordText, type Lang, type PlacePack } from "@access-tools/place";
import { finderCopy, finderFill } from "../i18n.js";
import { findCharging, type ChargingQuery } from "../charging.js";
import { findParking, type ParkingQuery } from "../parking.js";
import { findRepairAndSupply, type RepairQuery } from "../repair.js";
import { findWashrooms, type WashroomQuery } from "../washrooms.js";

function PlaceName({ lang, name, english }: { lang: Lang; name: string; english: boolean }) {
  if (!english) return <>{name}</>;
  return <RecordText lang={lang} text={name} />;
}

function HiddenList({
  lang,
  title,
  items,
}: {
  lang: Lang;
  title: string;
  items: Array<{ id: string; name: ReactNode; reasons: string[] }>;
}) {
  if (items.length === 0) return null;
  const colon = copy("sep.colon", lang);
  return (
    <section aria-labelledby={`hidden-${title}`}>
      <h3 id={`hidden-${title}`}>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.name}
            {colon}
            {item.reasons.join(" ")}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WashroomFinder({ pack, query }: { pack: PlacePack; query: WashroomQuery }) {
  const result = findWashrooms(pack, query);
  const lang = query.lang;
  return (
    <section className="app-ui" aria-labelledby="washroom-heading" lang={lang}>
      <style>{a11yCss}</style>
      <h2 id="washroom-heading">{finderCopy("finder.washroom.heading", lang)}</h2>
      <EnglishOnlyNote lang={lang} />
      <p>{result.coverage}</p>
      <p role="status">
        {result.empty
          ? finderCopy("finder.washroom.empty", lang)
          : finderFill("finder.shown", lang, { count: result.hits.length })}
      </p>
      <ul>
        {result.hits.map((hit) => (
          <li key={hit.washroomId} className="card">
            <h3>
              <PlaceName lang={lang} name={hit.placeName} english={hit.placeNameIsEnglish} /> —{" "}
              <RecordText lang={lang} text={hit.washroomName} />
            </h3>
            <p>{hit.recommendation}</p>
            <dl>
              <dt>{finderCopy("finder.distance", lang)}</dt>
              <dd>{hit.distanceMetres === null ? finderCopy("finder.unknown", lang) : `${hit.distanceMetres} m`}</dd>
              <dt>{finderCopy("finder.transfer", lang)}</dt>
              <dd>{hit.transferText}</dd>
              <dt>{finderCopy("finder.change-table", lang)}</dt>
              <dd>
                <EnglishText lang={lang} text={hit.changeTableText} fragments={hit.englishFragments} />
              </dd>
              <dt>{finderCopy("finder.hoist", lang)}</dt>
              <dd>
                <EnglishText lang={lang} text={hit.hoistText} fragments={hit.englishFragments} />
              </dd>
              <dt>{finderCopy("finder.access", lang)}</dt>
              <dd>
                <EnglishText lang={lang} text={hit.accessText} fragments={hit.englishFragments} />
              </dd>
              <dt>{finderCopy("finder.hours", lang)}</dt>
              <dd>
                <RecordText lang={lang} text={hit.hoursText} />
              </dd>
              <dt>{finderCopy("finder.verified", lang)}</dt>
              <dd>
                {hit.verificationDate}. {hit.tierText}
              </dd>
            </dl>
            {hit.phone ? (
              <p>
                <a href={`tel:${hit.phone}`}>{finderFill("finder.call", lang, { phone: hit.phone })}</a>
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {query.showHidden ? (
        <HiddenList
          lang={lang}
          title={finderCopy("finder.hidden-records", lang)}
          items={result.hidden.map((hit) => ({
            id: hit.washroomId,
            name: <PlaceName lang={lang} name={hit.placeName} english={hit.placeNameIsEnglish} />,
            reasons: hit.hiddenReasons,
          }))}
        />
      ) : null}
    </section>
  );
}

export function ParkingFinder({ pack, query }: { pack: PlacePack; query: ParkingQuery }) {
  const result = findParking(pack, query);
  const lang = query.lang;
  return (
    <section className="app-ui" aria-labelledby="parking-heading" lang={lang}>
      <style>{a11yCss}</style>
      <h2 id="parking-heading">{finderCopy("finder.parking.heading", lang)}</h2>
      <EnglishOnlyNote lang={lang} />
      <p role="note">{result.disclaimer}</p>
      <p>
        {finderCopy("finder.parking.note", lang)}
      </p>
      <ul>
        {result.hits.map((hit) => (
          <li key={hit.bayId} className="card">
            <h3>
              <PlaceName lang={lang} name={hit.placeName} english={hit.placeNameIsEnglish} /> —{" "}
              <RecordText lang={lang} text={hit.bayName} />
            </h3>
            <dl>
              <dt>{finderCopy("finder.type", lang)}</dt>
              <dd>{hit.kindText}</dd>
              <dt>{finderCopy("finder.width", lang)}</dt>
              <dd>
                {hit.widthText}. {hit.aisleText}
              </dd>
              <dt>{finderCopy("finder.entrance-distance", lang)}</dt>
              <dd>{hit.distanceToEntranceText}</dd>
              <dt>{finderCopy("finder.payment", lang)}</dt>
              <dd>
                <RecordText lang={lang} text={hit.paymentText} />
              </dd>
              <dt>{finderCopy("finder.date", lang)}</dt>
              <dd>
                {hit.verificationDate}. {hit.tierText}
              </dd>
              <dt>{finderCopy("finder.lift", lang)}</dt>
              <dd>{hit.vanLiftText}</dd>
              <dt>{finderCopy("finder.privilege", lang)}</dt>
              <dd>{hit.privilegeText}</dd>
              <dt>{finderCopy("finder.winter", lang)}</dt>
              <dd>{hit.winterText}</dd>
            </dl>
          </li>
        ))}
      </ul>
      {result.empty ? (
        <p role="status">
          {finderCopy("finder.parking.empty", lang)}
        </p>
      ) : null}
      {query.showHidden ? (
        <HiddenList
          lang={lang}
          title={finderCopy("finder.hidden-bays", lang)}
          items={result.hidden.map((hit) => ({
            id: hit.bayId,
            name: (
              <>
                <PlaceName lang={lang} name={hit.placeName} english={hit.placeNameIsEnglish} />{" "}
                <RecordText lang={lang} text={hit.bayName} />
              </>
            ),
            reasons: hit.hiddenReasons,
          }))}
        />
      ) : null}
    </section>
  );
}

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
