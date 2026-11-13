import { copy } from "../i18n.js";
import type { Lang, PlaceRecord } from "../types.js";
import { RecordText } from "./EnglishText.js";

/** The labelled-place list shared by the place demo and the French language test. */
export function FixturePlaceNav({
  places,
  lang,
  currentId,
  onSelect,
}: {
  places: PlaceRecord[];
  lang: Lang;
  currentId?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <nav aria-label={copy("nav.fixture-places", lang)}>
      <h2>{copy("nav.labelled-places", lang)}</h2>
      <ul>
        {places.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={item.id === currentId ? "page" : undefined}
              onClick={(event) => {
                if (!onSelect) return;
                event.preventDefault();
                onSelect(item.id);
              }}
            >
              {lang === "fr" && item.nameFr ? item.nameFr : <RecordText lang={lang} text={item.identity.name} />}
              {" — "}
              <span lang="en">PROTOTYPE-UNVERIFIED</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
