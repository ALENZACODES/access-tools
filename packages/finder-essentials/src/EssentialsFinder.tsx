import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { ESSENTIAL_KEYS, findEssentials, knownFact, status } from './finder';
import type { Filters, FinderOptions, FinderResult } from './finder';
import type { EssentialKey, PackRecord, SourceRegistry } from './pack-types';
import { strings } from './i18n';
import type { Locale } from './i18n';

export interface EssentialsFinderProps {
  records: readonly PackRecord[];
  registry: SourceRegistry;
  locale?: Locale;
  origin?: FinderOptions['origin'];
  radiusKm?: number;
}

/** Native controls and an ordinary list: no map service, network connection or automatic submission. */
export function EssentialsFinder({ records, registry, locale = 'en', origin, radiusKm }: EssentialsFinderProps): ReactElement {
  const t = strings[locale];
  const [filters, setFilters] = useState<Filters>({});
  const [result, setResult] = useState<FinderResult | null>(null);
  useEffect(() => {
    let active = true;
    void findEssentials(records, { registry, filters, origin, radiusKm }).then(next => {
      if (active) setResult(next);
    });
    return () => { active = false; };
  }, [records, registry, filters, origin, radiusKm]);
  const labelFor = (key: EssentialKey): string => t.labels[key];
  return (
    <section aria-label={t.heading} lang={locale} style={{ maxWidth: '100%', overflowWrap: 'anywhere' }}>
      <h2>{t.heading}</h2>
      <fieldset style={{ minWidth: 0 }}>
        <legend>{t.filters}</legend>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 15rem), 1fr))', gap: '0.75rem' }}>
          {ESSENTIAL_KEYS.map(key => (
            <label key={key} style={{ display: 'grid', gap: '0.25rem' }}>
              <span>{labelFor(key)}</span>
              <select style={{ minHeight: 44, minWidth: 44, font: 'inherit' }} value={filters[key] ?? 'any'} onChange={event => {
                const value = event.currentTarget.value as Filters[EssentialKey];
                setFilters(previous => ({ ...previous, [key]: value }));
              }}>
                <option value="any">{t.all}</option>
                <option value="yes">{t.yes}</option>
                <option value="no">{t.no}</option>
                <option value="UNKNOWN">{t.unknown}</option>
              </select>
            </label>
          ))}
        </div>
      </fieldset>
      {result && <div role="status" aria-live="polite">
        <p>{t.nearby(result.nearbyCount)}</p>
        {result.matches.length === 0 && <p>{t.noKnown}</p>}
        <p>{t.unknownCount(result.unknownNearby)}</p>
      </div>}
      {result && <ul style={{ paddingInlineStart: '1.5rem' }}>
        {result.matches.map(({ record, distanceKm }) => (
          <li key={record.id} style={{ marginBlock: '1rem' }}>
            <h3>{record.name}</h3>
            {distanceKm !== undefined && <p>{t.distance(distanceKm)}</p>}
            <dl>
              {ESSENTIAL_KEYS.map(key => {
                const fact = knownFact(record.fields?.[key], registry);
                const answer = status(record, key, registry);
                const source = fact ? registry[fact.source_id] : undefined;
                return <div key={key} style={{ marginBlock: '0.4rem' }}>
                  <dt>{labelFor(key)}</dt>
                  <dd style={{ marginInlineStart: '1rem' }}>
                    {answer === 'UNKNOWN' ? t.unknown : answer === 'yes' ? t.yes : t.no}
                    {fact && source ? <> {'\u2014'} {t.source}{locale === 'fr' ? '\u00A0: ' : ': '}{source.name}{locale === 'fr' ? '\u202F; ' : '; '}{fact.licence}{locale === 'fr' ? '\u202F; ' : '; '}{t.fetched}{locale === 'fr' ? '\u00A0: ' : ': '}{fact.retrieved_at}{locale === 'fr' ? '\u202F; ' : '; '}{t.tier}{locale === 'fr' ? '\u00A0: ' : ': '}{fact.tier}</> : null}
                  </dd>
                </div>;
              })}
            </dl>
            {ESSENTIAL_KEYS.some(key => knownFact(record.fields?.[key], registry)?.licence === 'ODbL')
              && <p>{t.odbl}</p>}
          </li>
        ))}
      </ul>}
    </section>
  );
}
