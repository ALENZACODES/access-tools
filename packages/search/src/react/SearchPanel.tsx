import { useState } from "react";
import { a11yCss, EnglishOnlyNote, RecordText, labelOf, type PlacePack, type PlaceType, type SupplyCategory } from "@access-tools/place";
import { searchCopy, searchFill } from "../i18n.js";
import { emptySearchQuery, searchPack, type SearchQuery } from "../search.js";

export function SearchPanel({
  pack,
  query,
  onQueryChange,
  onOpenPlace,
}: {
  pack: PlacePack;
  query: SearchQuery;
  onQueryChange: (query: SearchQuery) => void;
  onOpenPlace: (placeId: string) => void;
}) {
  const result = searchPack(pack, query);
  const lang = query.lang;
  const [latitude, setLatitude] = useState(query.origin ? String(query.origin.latitude) : "");
  const [longitude, setLongitude] = useState(query.origin ? String(query.origin.longitude) : "");
  const set = (patch: Partial<SearchQuery>) => onQueryChange({ ...query, ...patch, page: patch.page ?? 1 });
  const setOrigin = (nextLatitude: string, nextLongitude: string) => {
    setLatitude(nextLatitude);
    setLongitude(nextLongitude);
    const lat = Number(nextLatitude);
    const lon = Number(nextLongitude);
    set({
      origin:
        nextLatitude.trim() !== "" && nextLongitude.trim() !== "" && Number.isFinite(lat) && Number.isFinite(lon)
          ? { latitude: lat, longitude: lon }
          : null,
    });
  };
  const municipalities = [...new Set(pack.places.map((place) => place.identity.municipality))];
  const categories = [...new Set(pack.places.map((place) => place.identity.category))].sort();
  const placeTypes = [...new Set(pack.places.map((place) => place.identity.placeType))].sort();
  const supplyCategories = [...new Set(pack.supplyStores.flatMap((store) => store.categoriesPublished))].sort();
  return (
    <section className="app-ui" aria-labelledby="search-heading" lang={lang}>
      <style>{a11yCss}</style>
      <h2 id="search-heading">{searchCopy("search.heading", lang)}</h2>
      <EnglishOnlyNote lang={lang} />
      <p>
        {searchCopy("search.intro", lang)}
      </p>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <label htmlFor="search-text">{searchCopy("search.words", lang)}</label>
        <input
          id="search-text"
          type="search"
          value={query.text}
          onChange={(event) => set({ text: event.target.value })}
        />
        <label htmlFor="search-municipality">{searchCopy("search.municipality", lang)}</label>
        <select
          id="search-municipality"
          value={query.municipality ?? ""}
          onChange={(event) => set({ municipality: event.target.value || undefined })}
        >
          <option value="">{searchCopy("search.any-feminine", lang)}</option>
          {municipalities.map((municipality) => (
            <option key={municipality} value={municipality}>
              {municipality}
            </option>
          ))}
        </select>
        <label htmlFor="search-category">{searchCopy("search.category", lang)}</label>
        <select
          id="search-category"
          value={query.category ?? ""}
          onChange={(event) => set({ category: event.target.value || undefined })}
        >
          <option value="">{searchCopy("search.any-feminine", lang)}</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {labelOf(`category.${category}`, lang)}
            </option>
          ))}
        </select>
        <label htmlFor="search-type">{searchCopy("search.place-type", lang)}</label>
        <select
          id="search-type"
          value={query.placeType ?? ""}
          onChange={(event) => set({ placeType: (event.target.value || undefined) as PlaceType | undefined })}
        >
          <option value="">{searchCopy("search.any-masculine", lang)}</option>
          {placeTypes.map((placeType) => (
            <option key={placeType} value={placeType}>
              {labelOf(`placeType.${placeType}`, lang)}
            </option>
          ))}
        </select>
        <label htmlFor="search-sort">{searchCopy("search.order", lang)}</label>
        <select
          id="search-sort"
          value={query.sort}
          onChange={(event) => set({ sort: event.target.value as SearchQuery["sort"] })}
        >
          <option value="name">{searchCopy("search.sort.name", lang)}</option>
          <option value="source-date">{searchCopy("search.sort.source-date", lang)}</option>
          <option value="distance">{searchCopy("search.sort.distance", lang)}</option>
        </select>
        <label htmlFor="search-lat">{searchCopy("search.latitude", lang)}</label>
        <input
          id="search-lat"
          type="text"
          inputMode="decimal"
          value={latitude}
          onChange={(event) => setOrigin(event.target.value, longitude)}
        />
        <label htmlFor="search-lon">{searchCopy("search.longitude", lang)}</label>
        <input
          id="search-lon"
          type="text"
          inputMode="decimal"
          value={longitude}
          onChange={(event) => setOrigin(latitude, event.target.value)}
        />
        <p>
          {searchCopy("search.origin-note", lang)}
        </p>
        <fieldset>
          <legend>{searchCopy("search.filters", lang)}</legend>
          <p>
            {searchCopy("search.filters-note", lang)}
          </p>
          <label>
            <input
              type="checkbox"
              checked={query.sci.stepFreeEntrance === true}
              onChange={(event) => set({ sci: { ...query.sci, stepFreeEntrance: event.target.checked || undefined } })}
            />
            {" "}
            {searchCopy("search.filter.step-free", lang)}
          </label>
          <label>
            <input
              type="checkbox"
              checked={query.sci.adultChangeTable === true}
              onChange={(event) => set({ sci: { ...query.sci, adultChangeTable: event.target.checked || undefined } })}
            />
            {" "}
            {searchCopy("search.filter.change-table", lang)}
          </label>
          <label>
            <input
              type="checkbox"
              checked={query.sci.hoist === true}
              onChange={(event) => set({ sci: { ...query.sci, hoist: event.target.checked || undefined } })}
            />
            {" "}
            {searchCopy("search.filter.hoist", lang)}
          </label>
          <label>
            <input
              type="checkbox"
              checked={query.sci.vanAccessibleBay === true}
              onChange={(event) => set({ sci: { ...query.sci, vanAccessibleBay: event.target.checked || undefined } })}
            />
            {" "}
            {searchCopy("search.filter.van", lang)}
          </label>
          <label>
            <input
              type="checkbox"
              checked={query.sci.chargingRecorded === true}
              onChange={(event) => set({ sci: { ...query.sci, chargingRecorded: event.target.checked || undefined } })}
            />
            {" "}
            {searchCopy("search.filter.charging", lang)}
          </label>
          <label htmlFor="search-side">{searchCopy("search.transfer-side", lang)}</label>
          <select
            id="search-side"
            value={query.sci.transferSide ?? ""}
            onChange={(event) =>
              set({
                sci: {
                  ...query.sci,
                  transferSide: (event.target.value || undefined) as SciSide,
                },
              })
            }
          >
            <option value="">{searchCopy("search.any-masculine", lang)}</option>
            <option value="left">{searchCopy("search.side.left", lang)}</option>
            <option value="right">{searchCopy("search.side.right", lang)}</option>
            <option value="both">{searchCopy("search.side.both", lang)}</option>
          </select>
          <label htmlFor="search-supply">{searchCopy("search.supply", lang)}</label>
          <select
            id="search-supply"
            value={query.sci.supplyCategory ?? ""}
            onChange={(event) =>
              set({
                sci: {
                  ...query.sci,
                  supplyCategory: (event.target.value || undefined) as SupplyCategory | undefined,
                },
              })
            }
          >
            <option value="">{searchCopy("search.any-feminine", lang)}</option>
            {supplyCategories.map((category) => (
              <option key={category} value={category}>
                {labelOf(`supply.${category}`, lang)}
              </option>
            ))}
          </select>
          <label>
            <input
              type="checkbox"
              checked={query.showHidden}
              onChange={(event) => onQueryChange({ ...query, showHidden: event.target.checked })}
            />
            {" "}
            {searchCopy("search.show-hidden", lang)}
          </label>
        </fieldset>
      </form>
      <p role="status">
        {result.empty && result.matched === 0
          ? searchFill("search.empty.query", lang, { query: result.queryText })
          : result.empty
            ? searchFill("search.empty.hidden", lang, { hidden: result.hidden.length })
            : searchFill("search.summary", lang, { shown: result.hits.length, hidden: result.hidden.length })}
      </p>
      <ul>
        {result.hits.map((hit) => (
          <li key={hit.placeId}>
            <a
              href={`#${hit.placeId}`}
              onClick={(event) => {
                event.preventDefault();
                onOpenPlace(hit.placeId);
              }}
            >
              {hit.nameIsEnglish ? <RecordText lang={lang} text={hit.name} /> : hit.name}
            </a>
            <p>
              {hit.municipality}. {hit.category}. {hit.tier}. {hit.sourceName}. {hit.sourceDate}.
              {" "}
              {hit.distanceMetres === null
                ? searchCopy("search.distance.unknown", lang)
                : searchFill("search.distance.known", lang, { metres: hit.distanceMetres })}
            </p>
            {hit.profileNotes.length > 0 ? <p>{hit.profileNotes.join(" ")}</p> : null}
          </li>
        ))}
      </ul>
      {query.showHidden ? (
        <section aria-labelledby="hidden-heading">
          <h3 id="hidden-heading">{searchCopy("search.hidden", lang)}</h3>
          <ul>
            {result.hidden.map((hit) => (
              <li key={hit.placeId}>
                {hit.nameIsEnglish ? <RecordText lang={lang} text={hit.name} /> : hit.name}: {hit.hiddenReasons.join(" ")}
                {hit.profileNotes.length > 0 ? <p>{hit.profileNotes.join(" ")}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {result.pageCount > 1 ? (
        <p>
          <button type="button" onClick={() => set({ page: result.page - 1 })} disabled={result.page <= 1}>
            {searchCopy("search.previous", lang)}
          </button>
          <button type="button" onClick={() => set({ page: result.page + 1 })} disabled={result.page >= result.pageCount}>
            {searchCopy("search.next", lang)}
          </button>
        </p>
      ) : null}
    </section>
  );
}

type SciSide = "left" | "right" | "both" | undefined;

export function initialQuery(lang: SearchQuery["lang"]): SearchQuery {
  return emptySearchQuery(lang);
}
