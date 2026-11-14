import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { copy, EnglishText, RecordText, type Lang } from "@access-tools/place";
import type { FinderField, FinderFilter } from "../filters.js";
import { finderCopy, finderFill, type FinderKey } from "../i18n.js";

/** Where a finder was opened from. Back hands control to the caller, which shows that screen again. */
export interface FinderEntry {
  from: "journey" | "place";
  onBack: () => void;
}

export const finderCss = `
:where(.app-ui) .finder-fields { margin: 0; }
:where(.app-ui) .finder-field { border-top: 1px solid #4a4a4a; padding: 0.5rem; }
:where(.app-ui) .finder-field dt { font-weight: 700; }
:where(.app-ui) .finder-field dd { margin: 0; overflow-wrap: anywhere; }
:where(.app-ui) .finder-prov span { display: block; }
:where(.app-ui) .finder-list { list-style: none; padding: 0; margin: 0; }
:where(.app-ui) .finder-search label,
:where(.app-ui) .finder-search input { display: block; max-width: 100%; }
:where(.app-ui) .finder-search input { width: 100%; max-width: 24rem; }
:where(.app-ui) [tabindex="-1"]:focus-visible { outline: 3px solid #0b3a82; outline-offset: 2px; }
`;

export function PlaceName({ lang, name, english }: { lang: Lang; name: string; english: boolean }) {
  if (!english) return <>{name}</>;
  return <RecordText lang={lang} text={name} />;
}

export function HiddenList({
  lang,
  title,
  items,
  contextId,
}: {
  lang: Lang;
  title: string;
  items: Array<{ id: string; name: ReactNode; reasons: string[] }>;
  /** The finder heading id. Two finders on one page then name their hidden lists differently. */
  contextId: string;
}) {
  const headingId = useId();
  if (items.length === 0) return null;
  const colon = copy("sep.colon", lang);
  return (
    <section aria-labelledby={`${contextId} ${headingId}`}>
      <h3 id={headingId}>{title}</h3>
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

/** Every field with its value, tier, source and record date. An unknown value reads Unknown and is marked. */
export function FieldList({ lang, fields }: { lang: Lang; fields: FinderField[] }) {
  const colon = copy("sep.colon", lang);
  return (
    <dl className="finder-fields">
      {fields.map((field) => (
        <div key={field.id} className={field.unknown ? "finder-field unknown" : "finder-field"} data-field={field.id}>
          <dt>{field.label}</dt>
          <dd>
            <EnglishText lang={lang} text={field.valueText} fragments={field.englishFragments} />
          </dd>
          <dd className="finder-prov">
            <span>
              {finderCopy("finder.field.tier", lang)}
              {colon}
              {field.tierText}
            </span>
            <span>
              {finderCopy("finder.field.source", lang)}
              {colon}
              {field.sourceName}
            </span>
            <span>
              {finderCopy("finder.field.record-date", lang)}
              {colon}
              {field.recordDate}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function EntryBar({ lang, entry }: { lang: Lang; entry: FinderEntry | undefined }) {
  if (!entry) return null;
  return (
    <div data-finder-entry={entry.from}>
      <p>
        <button type="button" onClick={entry.onBack}>
          {finderCopy(entry.from === "journey" ? "finder.back.journey" : "finder.back.place", lang)}
        </button>
      </p>
      <p>{finderCopy(entry.from === "journey" ? "finder.entry.journey" : "finder.entry.place", lang)}</p>
    </div>
  );
}

export function DestinationField({
  id,
  lang,
  value,
  onChange,
  headingId,
}: {
  id: string;
  lang: Lang;
  value: string;
  onChange: (text: string) => void;
  /** The finder heading. It makes the search landmark name unique when two finders share a page. */
  headingId: string;
}) {
  return (
    <form
      className="finder-search"
      role="search"
      aria-labelledby={`${headingId} ${id}-label`}
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <label id={`${id}-label`} htmlFor={id}>
        {finderCopy("finder.destination", lang)}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        aria-describedby={`${id}-hint`}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
      />
      <p id={`${id}-hint`}>{finderCopy("finder.destination-hint", lang)}</p>
    </form>
  );
}

/** Names each filter that is on and the rule it applies. Says so when none is on. */
export function FilterSummary({
  lang,
  filters,
  turnedOff,
  onRestore,
  note,
  contextId,
}: {
  lang: Lang;
  /** The finder heading id, so two finders on one page name this section differently. */
  contextId: string;
  filters: FinderFilter[];
  /** Labels of the filters the Broaden action turned off for this list. */
  turnedOff: string[];
  onRestore: () => void;
  note?: string | null;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={`${contextId} ${headingId}`} data-finder-filters>
      <h3 id={headingId}>{finderCopy("finder.filters.heading", lang)}</h3>
      {filters.length === 0 ? (
        <p>{finderCopy("finder.filters.none", lang)}</p>
      ) : (
        <ul>
          {filters.map((filter) => (
            <li key={filter.id} data-filter={filter.id}>
              <strong>{filter.label}</strong>
              {". "}
              {finderCopy(filter.origin === "profile" ? "finder.filters.profile" : "finder.filters.screen", lang)} {filter.explanation}
            </li>
          ))}
        </ul>
      )}
      {note ? <p>{note}</p> : null}
      {turnedOff.length > 0 ? (
        <>
          <p>{finderFill("finder.broadened", lang, { list: turnedOff.join(", ") })}</p>
          <p>
            <button type="button" onClick={onRestore}>
              {finderCopy("finder.restore", lang)}
            </button>
          </p>
        </>
      ) : null}
    </section>
  );
}

/** Names the filters, the seeded count, and offers one way to widen the search. */
export function EmptyState({
  lang,
  filters,
  text,
  seeded,
  seededKey,
  matching,
  onBroaden,
}: {
  lang: Lang;
  filters: FinderFilter[];
  text: string;
  seeded: { records: number; places: number };
  seededKey: FinderKey;
  matching: number;
  onBroaden: () => void;
}) {
  const hintId = useId();
  const trimmed = text.trim();
  const canBroaden = filters.length > 0 || trimmed !== "";
  return (
    <div data-finder-empty>
      <p>
        {filters.length > 0
          ? finderFill("finder.empty.filters", lang, { list: filters.map((filter) => filter.label).join(", ") })
          : finderCopy("finder.empty.no-filters", lang)}
      </p>
      <p>{trimmed ? finderFill("finder.empty.destination", lang, { text: trimmed }) : finderCopy("finder.empty.no-destination", lang)}</p>
      <p>{finderFill(seededKey, lang, { records: seeded.records, places: seeded.places, matching })}</p>
      <p>{finderCopy("finder.empty.gap", lang)}</p>
      {canBroaden ? (
        <>
          <p>
            <button type="button" aria-describedby={hintId} onClick={onBroaden}>
              {finderCopy("finder.broaden", lang)}
            </button>
          </p>
          <p id={hintId}>{finderCopy(filters.length > 0 ? "finder.broaden.filters-hint" : "finder.broaden.destination-hint", lang)}</p>
        </>
      ) : null}
    </div>
  );
}

/**
 * Destination text and the Broaden action for one finder.
 * Broaden turns the filters off for this list first. With no filter on, it clears the destination.
 * Focus moves to the result count after either step, because the button it was on is gone.
 */
export function useFinderControls(queryText: string, entry: FinderEntry | undefined) {
  const [text, setText] = useState(queryText);
  const [broadened, setBroadened] = useState(false);
  const [focusStatus, setFocusStatus] = useState(0);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    setText(queryText);
  }, [queryText]);
  useEffect(() => {
    if (focusStatus > 0) statusRef.current?.focus();
  }, [focusStatus]);
  const opened = Boolean(entry);
  useEffect(() => {
    if (opened) headingRef.current?.focus();
  }, [opened]);
  return {
    text,
    setText,
    broadened,
    statusRef: statusRef as RefObject<HTMLParagraphElement>,
    headingRef: headingRef as RefObject<HTMLHeadingElement>,
    broaden(filtersOn: boolean) {
      if (filtersOn) setBroadened(true);
      else setText("");
      setFocusStatus((count) => count + 1);
    },
    restore() {
      setBroadened(false);
      setFocusStatus((count) => count + 1);
    },
  };
}
