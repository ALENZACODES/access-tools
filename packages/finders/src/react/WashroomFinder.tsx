import { a11yCss, copy, EnglishOnlyNote, EnglishText, RecordText, type PlacePack } from "@access-tools/place";
import { broadenWashroomQuery, washroomFilters } from "../filters.js";
import { finderCopy, finderFill } from "../i18n.js";
import { findWashrooms, type WashroomQuery } from "../washrooms.js";
import {
  DestinationField,
  EmptyState,
  EntryBar,
  FieldList,
  FilterSummary,
  finderCss,
  HiddenList,
  PlaceName,
  useFinderControls,
  type FinderEntry,
} from "./shared.js";

/**
 * Washroom finder. Search by destination, with the saved equipment profile applied and explained.
 * `entry` is set when the finder was opened from a journey result or a place page.
 */
export function WashroomFinder({ pack, query, entry }: { pack: PlacePack; query: WashroomQuery; entry?: FinderEntry }) {
  const lang = query.lang;
  const controls = useFinderControls(query.text, entry);
  const requested: WashroomQuery = { ...query, text: controls.text };
  const requestedFilters = washroomFilters(requested);
  const broadened = controls.broadened && requestedFilters.length > 0;
  const result = findWashrooms(pack, broadened ? broadenWashroomQuery(requested) : requested);
  return (
    <section className="app-ui" aria-labelledby="washroom-heading" lang={lang} data-finder="washroom">
      <style>{a11yCss + finderCss}</style>
      <EntryBar lang={lang} entry={entry} />
      <h2 id="washroom-heading" ref={controls.headingRef} tabIndex={-1}>
        {finderCopy("finder.washroom.heading", lang)}
      </h2>
      <p className="prototype-notice" role="note">
        {finderCopy("finder.demo-data", lang)}
      </p>
      <EnglishOnlyNote lang={lang} />
      <p role="note">{finderCopy("finder.washroom.not-shown", lang)}</p>
      <p>{result.coverage}</p>
      <DestinationField id="washroom-destination" lang={lang} value={controls.text} onChange={controls.setText} headingId="washroom-heading" />
      <FilterSummary
        contextId="washroom-heading"
        lang={lang}
        filters={result.filters}
        turnedOff={broadened ? requestedFilters.map((filter) => filter.label) : []}
        onRestore={controls.restore}
      />
      <p role="status" ref={controls.statusRef} tabIndex={-1}>
        {result.empty
          ? finderCopy("finder.washroom.empty-title", lang)
          : finderFill("finder.washroom.shown", lang, { count: result.hits.length })}
      </p>
      {result.empty ? (
        <EmptyState
          lang={lang}
          filters={result.filters}
          text={controls.text}
          seeded={result.seeded}
          seededKey="finder.washroom.seeded"
          matching={result.destinationCount}
          onBroaden={() => controls.broaden(result.filters.length > 0)}
        />
      ) : null}
      <ul className="finder-list">
        {result.hits.map((hit) => (
          <li key={hit.washroomId} className="card" data-washroom={hit.washroomId}>
            <h3>
              <PlaceName lang={lang} name={hit.placeName} english={hit.placeNameIsEnglish} /> —{" "}
              <RecordText lang={lang} text={hit.washroomName} />
            </h3>
            <p>{hit.recommendation}</p>
            <p>{hit.genderText}</p>
            <p>{hit.attendantIsEnglish ? <EnglishText lang={lang} text={hit.attendantText} fragments={[hit.attendantText]} /> : hit.attendantText}</p>
            <p>
              {finderCopy("finder.distance", lang)}
              {copy("sep.colon", lang)}
              {hit.distanceMetres === null ? finderCopy("finder.unknown", lang) : `${hit.distanceMetres} m`}
            </p>
            <FieldList lang={lang} fields={hit.fields} />
            {hit.phone ? (
              <p>
                <a href={`tel:${hit.phone}`}>{finderFill("finder.call", lang, { phone: hit.phone })}</a>
              </p>
            ) : null}
            {hit.profileNotes.length > 0 ? <p>{hit.profileNotes.join(" ")}</p> : null}
          </li>
        ))}
      </ul>
      {query.showHidden ? (
        <HiddenList
          contextId="washroom-heading"
          lang={lang}
          title={finderCopy("finder.hidden-records", lang)}
          items={result.hidden.map((hit) => ({
            id: hit.washroomId,
            name: (
              <>
                <PlaceName lang={lang} name={hit.placeName} english={hit.placeNameIsEnglish} /> —{" "}
                <RecordText lang={lang} text={hit.washroomName} />
              </>
            ),
            reasons: [...hit.hiddenReasons, ...hit.profileNotes],
          }))}
        />
      ) : null}
    </section>
  );
}
