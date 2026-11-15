import { a11yCss, copy, EnglishOnlyNote, RecordText, type PlacePack } from "@access-tools/place";
import { broadenParkingQuery, parkingFilters, parkingProfileUnused } from "../filters.js";
import { finderCopy, finderFill } from "../i18n.js";
import { findParking, type ParkingQuery } from "../parking.js";
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
 * Parking finder. Bays are clustered by destination and shown as a list.
 * The list says which spaces the data records. It never says a space is free.
 */
export function ParkingFinder({ pack, query, entry }: { pack: PlacePack; query: ParkingQuery; entry?: FinderEntry }) {
  const lang = query.lang;
  const controls = useFinderControls(query.text, entry);
  const requested: ParkingQuery = { ...query, text: controls.text };
  const requestedFilters = parkingFilters(requested);
  const broadened = controls.broadened && requestedFilters.length > 0;
  const result = findParking(pack, broadened ? broadenParkingQuery(requested) : requested);
  const colon = copy("sep.colon", lang);
  return (
    <section className="app-ui" aria-labelledby="parking-heading" lang={lang} data-finder="parking">
      <style>{a11yCss + finderCss}</style>
      <EntryBar lang={lang} entry={entry} />
      <h2 id="parking-heading" ref={controls.headingRef} tabIndex={-1}>
        {finderCopy("finder.parking.heading", lang)}
      </h2>
      <p className="prototype-notice" role="note">
        {finderCopy("finder.demo-data", lang)}
      </p>
      <EnglishOnlyNote lang={lang} />
      <p role="note">{finderCopy("finder.parking.exists", lang)}</p>
      <p>{finderCopy("finder.parking.note", lang)}</p>
      <DestinationField id="parking-destination" lang={lang} value={controls.text} onChange={controls.setText} headingId="parking-heading" />
      <FilterSummary
        contextId="parking-heading"
        lang={lang}
        filters={result.filters}
        turnedOff={broadened ? requestedFilters.map((filter) => filter.label) : []}
        onRestore={controls.restore}
        note={parkingProfileUnused(query.profile) ? finderCopy("finder.parking.profile-unused", lang) : null}
      />
      <p role="status" ref={controls.statusRef} tabIndex={-1}>
        {result.empty
          ? finderCopy("finder.parking.empty-title", lang)
          : finderFill("finder.parking.shown", lang, { bays: result.hits.length, places: result.clusters.length })}
      </p>
      {result.empty ? (
        <EmptyState
          lang={lang}
          filters={result.filters}
          text={controls.text}
          seeded={result.seeded}
          seededKey="finder.parking.seeded"
          matching={result.destinationCount}
          onBroaden={() => controls.broaden(result.filters.length > 0)}
        />
      ) : null}
      <ul className="finder-list">
        {result.clusters.map((cluster) => (
          <li key={cluster.placeId} data-destination={cluster.placeId}>
            <h3>
              <PlaceName lang={lang} name={cluster.placeName} english={cluster.placeNameIsEnglish} />
            </h3>
            <p>
              {cluster.municipality}. {finderFill("finder.parking.cluster-count", lang, { count: cluster.bays.length })}
            </p>
            <p>
              {finderCopy("finder.distance", lang)}
              {colon}
              {cluster.straightLineMetres === null ? finderCopy("finder.unknown", lang) : `${cluster.straightLineMetres} m`}
            </p>
            <ul className="finder-list">
              {cluster.bays.map((hit) => (
                <li key={hit.bayId} className="card" data-bay={hit.bayId}>
                  <h4>
                    <RecordText lang={lang} text={hit.bayName} />
                  </h4>
                  <FieldList lang={lang} fields={hit.fields} />
                  <dl>
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
          </li>
        ))}
      </ul>
      {query.showHidden ? (
        <HiddenList
          contextId="parking-heading"
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
