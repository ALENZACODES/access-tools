import { useState } from "react";
import { a11yCss, labelOf, type PlacePack, type PlaceType, type SupplyCategory } from "@access-tools/place";
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
      <h2 id="search-heading">{lang === "fr" ? "Recherche" : "Search"}</h2>
      <p>
        {lang === "fr"
          ? "La recherche tourne sur le paquet chargé dans ce navigateur. Elle n'appelle pas de serveur. Le tri n'est pas un classement d'accessibilité."
          : "Search runs on the pack loaded in this browser. It does not call a server. Sort order is not an accessibility ranking."}
      </p>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <label htmlFor="search-text">{lang === "fr" ? "Mots" : "Words"}</label>
        <input
          id="search-text"
          type="search"
          value={query.text}
          onChange={(event) => set({ text: event.target.value })}
        />
        <label htmlFor="search-municipality">{lang === "fr" ? "Municipalité" : "Municipality"}</label>
        <select
          id="search-municipality"
          value={query.municipality ?? ""}
          onChange={(event) => set({ municipality: event.target.value || undefined })}
        >
          <option value="">{lang === "fr" ? "Toutes" : "Any"}</option>
          {municipalities.map((municipality) => (
            <option key={municipality} value={municipality}>
              {municipality}
            </option>
          ))}
        </select>
        <label htmlFor="search-category">{lang === "fr" ? "Catégorie" : "Category"}</label>
        <select
          id="search-category"
          value={query.category ?? ""}
          onChange={(event) => set({ category: event.target.value || undefined })}
        >
          <option value="">{lang === "fr" ? "Toutes" : "Any"}</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {labelOf(`category.${category}`, lang)}
            </option>
          ))}
        </select>
        <label htmlFor="search-type">{lang === "fr" ? "Type de lieu" : "Place type"}</label>
        <select
          id="search-type"
          value={query.placeType ?? ""}
          onChange={(event) => set({ placeType: (event.target.value || undefined) as PlaceType | undefined })}
        >
          <option value="">{lang === "fr" ? "Tous" : "Any"}</option>
          {placeTypes.map((placeType) => (
            <option key={placeType} value={placeType}>
              {labelOf(`placeType.${placeType}`, lang)}
            </option>
          ))}
        </select>
        <label htmlFor="search-sort">{lang === "fr" ? "Ordre" : "Order"}</label>
        <select
          id="search-sort"
          value={query.sort}
          onChange={(event) => set({ sort: event.target.value as SearchQuery["sort"] })}
        >
          <option value="name">{lang === "fr" ? "Nom" : "Name"}</option>
          <option value="source-date">{lang === "fr" ? "Date de source" : "Source date"}</option>
          <option value="distance">{lang === "fr" ? "Distance à vol d'oiseau" : "Straight-line distance"}</option>
        </select>
        <label htmlFor="search-lat">{lang === "fr" ? "Latitude facultative" : "Optional latitude"}</label>
        <input
          id="search-lat"
          type="text"
          inputMode="decimal"
          value={latitude}
          onChange={(event) => setOrigin(event.target.value, longitude)}
        />
        <label htmlFor="search-lon">{lang === "fr" ? "Longitude facultative" : "Optional longitude"}</label>
        <input
          id="search-lon"
          type="text"
          inputMode="decimal"
          value={longitude}
          onChange={(event) => setOrigin(latitude, event.target.value)}
        />
        <p>
          {lang === "fr"
            ? "Le point sert seulement à trier par distance. Il n'est pas un historique. Cet écran ne lit pas la position de l'appareil."
            : "The point is used only to sort by distance. It is not a location history. This screen does not read the device location."}
        </p>
        <fieldset>
          <legend>{lang === "fr" ? "Filtres" : "Filters"}</legend>
          <p>
            {lang === "fr"
              ? "Un filtre cache les fiches qui ne correspondent pas. Inconnu n'est pas une correspondance. Afficher les résultats cachés explique pourquoi."
              : "A filter hides records that do not match. Unknown is not a match. Show hidden results explains why."}
          </p>
          <label>
            <input
              type="checkbox"
              checked={query.sci.stepFreeEntrance === true}
              onChange={(event) => set({ sci: { ...query.sci, stepFreeEntrance: event.target.checked || undefined } })}
            />
            {lang === "fr" ? " Entrée enregistrée comme sans marche" : " Entrance recorded as step-free"}
          </label>
          <label>
            <input
              type="checkbox"
              checked={query.sci.adultChangeTable === true}
              onChange={(event) => set({ sci: { ...query.sci, adultChangeTable: event.target.checked || undefined } })}
            />
            {lang === "fr" ? " Table de change adulte enregistrée" : " Adult change table recorded"}
          </label>
          <label>
            <input
              type="checkbox"
              checked={query.sci.hoist === true}
              onChange={(event) => set({ sci: { ...query.sci, hoist: event.target.checked || undefined } })}
            />
            {lang === "fr" ? " Lève-personne enregistré" : " Hoist recorded"}
          </label>
          <label>
            <input
              type="checkbox"
              checked={query.sci.vanAccessibleBay === true}
              onChange={(event) => set({ sci: { ...query.sci, vanAccessibleBay: event.target.checked || undefined } })}
            />
            {lang === "fr" ? " Place de type A avec allée enregistrée" : " Type A bay with a recorded aisle"}
          </label>
          <label>
            <input
              type="checkbox"
              checked={query.sci.chargingRecorded === true}
              onChange={(event) => set({ sci: { ...query.sci, chargingRecorded: event.target.checked || undefined } })}
            />
            {lang === "fr" ? " Fiche de recharge présente" : " Charging record present"}
          </label>
          <label htmlFor="search-side">{lang === "fr" ? "Côté de transfert" : "Transfer side"}</label>
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
            <option value="">{lang === "fr" ? "Tous" : "Any"}</option>
            <option value="left">{lang === "fr" ? "Gauche ou les deux" : "Left or both"}</option>
            <option value="right">{lang === "fr" ? "Droite ou les deux" : "Right or both"}</option>
            <option value="both">{lang === "fr" ? "Les deux seulement" : "Both only"}</option>
          </select>
          <label htmlFor="search-supply">{lang === "fr" ? "Catégorie de fournitures liée" : "Linked supply category"}</label>
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
            <option value="">{lang === "fr" ? "Toutes" : "Any"}</option>
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
            {lang === "fr" ? " Afficher les résultats cachés" : " Show hidden results"}
          </label>
        </fieldset>
      </form>
      <p role="status">
        {result.empty && result.matched === 0
          ? lang === "fr"
            ? `Aucun lieu de la graine ne correspond à « ${result.queryText} ». Essayez un mot plus large, une autre catégorie, ou retirez un filtre. Un résultat vide est un trou, pas une preuve qu'aucun lieu n'existe.`
            : `No seeded place matched “${result.queryText}”. Try a broader word, another category, or clear a filter. An empty result is a gap, not proof that no place exists.`
          : result.empty
            ? lang === "fr"
              ? `${result.hidden.length} fiche(s) cachée(s) par les filtres. Aucune fiche affichée.`
              : `${result.hidden.length} record(s) hidden by filters. No record is shown.`
            : lang === "fr"
              ? `${result.hits.length} fiche(s) affichée(s). ${result.hidden.length} cachée(s).`
              : `${result.hits.length} record(s) shown. ${result.hidden.length} hidden.`}
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
              {hit.name}
            </a>
            <p>
              {hit.municipality}. {hit.category}. {hit.tier}. {hit.sourceName}. {hit.sourceDate}.
              {hit.distanceMetres === null
                ? lang === "fr"
                  ? " Distance inconnue."
                  : " Distance unknown."
                : lang === "fr"
                  ? ` Distance à vol d'oiseau ${hit.distanceMetres} m.`
                  : ` Straight-line distance ${hit.distanceMetres} m.`}
            </p>
          </li>
        ))}
      </ul>
      {query.showHidden ? (
        <section aria-labelledby="hidden-heading">
          <h3 id="hidden-heading">{lang === "fr" ? "Résultats cachés" : "Hidden results"}</h3>
          <ul>
            {result.hidden.map((hit) => (
              <li key={hit.placeId}>
                {hit.name}: {hit.hiddenReasons.join(" ")}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {result.pageCount > 1 ? (
        <p>
          <button type="button" onClick={() => set({ page: result.page - 1 })} disabled={result.page <= 1}>
            {lang === "fr" ? "Page précédente" : "Previous page"}
          </button>
          <button type="button" onClick={() => set({ page: result.page + 1 })} disabled={result.page >= result.pageCount}>
            {lang === "fr" ? "Page suivante" : "Next page"}
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
