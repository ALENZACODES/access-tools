import { fieldName } from "../catalog.js";
import type { Lang } from "../catalog.js";
import { copy, fill } from "../copy.js";
import { assessPlace } from "../observations.js";
import type { FieldAssessment, FieldObservation } from "../observations.js";

function freshnessText(lang: Lang, a: FieldAssessment): string {
  const t = copy[lang];
  if (a.freshness === "no-observation" || a.restsOn === null) return t.freshness["no-observation"];
  return fill(t.freshness[a.freshness], { date: a.restsOn, days: a.ageDays ?? "?", limit: a.limitDays ?? "?" });
}

/** The audit record for one place: every catalogue field with its value or Unknown, tier and freshness. */
export function RecordPanel(props: { lang: Lang; observations: readonly FieldObservation[]; placeId: string; today: string }) {
  const { lang } = props;
  const t = copy[lang];
  const rows = assessPlace(props.observations, props.placeId, props.today);
  return (
    <section aria-labelledby="record-heading">
      <h2 id="record-heading">{t.recordHeading}</h2>
      <p>{t.recordIntro}</p>
      <ul className="cards">
        {rows.map((a) => (
          <li key={a.field} data-field={a.field} data-tier={a.tier} data-freshness={a.freshness}>
            <h3>{fieldName(lang, a.field)}</h3>
            <dl className="facts">
              <div><dt>{t.value}</dt><dd>{a.value === null ? t.unknown : fill(t.mm, { value: a.value })}</dd></div>
              <div>
                <dt>{t.tier}</dt>
                <dd>{t.tierName[a.tier]}{a.lapsedTier !== null ? ` ${fill(t.lapsed, { tier: a.lapsedTier })}` : ""}</dd>
              </div>
              <div><dt>{t.basisLabel}</dt><dd>{t.basis[a.basis]} {fill(t.observationCount, { count: a.observationCount })}</dd></div>
              <div><dt>{t.freshnessLabel}</dt><dd>{freshnessText(lang, a)}</dd></div>
              <div>
                <dt>{t.flags}</dt>
                <dd>
                  {a.contested ? `${t.contested} ` : ""}
                  {a.needsRecheck ? t.needsRecheck : a.contested ? "" : t.noFlags}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
