import { copy, fill, labelOf } from "../i18n.js";
import type { ChangeReport, Correction, Lang, PlacePack, PlaceRecord } from "../types.js";
import type { ChangeProblem } from "../types.js";
import { correctableFields, projectPlace } from "../project.js";
import { a11yCss } from "./a11yCss.js";
import { EnglishOnlyNote, EnglishText, RecordText } from "./EnglishText.js";
import { FieldTable } from "./FieldTable.js";
import { ChangeReportForm, CorrectionForm } from "./ReportForms.js";

export function PlacePage({
  place,
  pack,
  lang,
  today,
  corrections,
  changes,
  onCorrection,
  onChange,
  headingLevel = 1,
}: {
  place: PlaceRecord;
  pack?: PlacePack;
  lang: Lang;
  today: string;
  corrections: Correction[];
  changes: ChangeReport[];
  onCorrection: (input: { fieldId: string; suggestedCorrection: string; note: string }) => void;
  onChange: (input: { targetId: string; problem: ChangeProblem; note: string }) => void;
  /** Use 2 when this page is embedded under another page heading. */
  headingLevel?: 1 | 2;
}) {
  const view = projectPlace(place, lang, today, pack);
  const pending = fill(copy("place.pending.counts", lang), {
    corrections: corrections.length,
    changes: changes.length,
  });
  return (
    <article className="app-ui" lang={lang}>
      <style>{a11yCss}</style>
      <a href="#place-main">{copy("nav.skip", lang)}</a>
      <header>
        {headingLevel === 2 ? (
          <h2>{lang === "fr" && !place.nameFr ? <RecordText lang={lang} text={view.title} /> : view.title}</h2>
        ) : (
          <h1>{lang === "fr" && !place.nameFr ? <RecordText lang={lang} text={view.title} /> : view.title}</h1>
        )}
        <p className="prototype-notice" role="note">
          {view.prototypeNotice}
        </p>
        <p className="honesty">{view.honestyNote}</p>
        <EnglishOnlyNote lang={lang} />
        <p>
          <strong>{view.tierBadge}</strong>
        </p>
        <p>{view.sourceLine}</p>
      </header>
      <div id="place-main">
        {view.depthStatement ? <p role="status">{view.depthStatement}</p> : null}
        {view.sections.map((section) => (
          <section key={section.id} aria-labelledby={`h-${section.id}`}>
            <h2 id={`h-${section.id}`}>{section.heading}</h2>
            {section.intro ? <p>{section.intro}</p> : null}
            <FieldTable rows={section.rows} caption={section.heading} lang={lang} />
            {section.id === "washrooms"
              ? view.washrooms.map((washroom) => (
                  <article key={washroom.id} className="card" aria-labelledby={`w-${washroom.id}`}>
                    <h3 id={`w-${washroom.id}`}>
                      <EnglishText lang={lang} text={washroom.heading} fragments={washroom.englishFragments} />
                    </h3>
                    <p>{washroom.genderText}</p>
                    <p>
                      <EnglishText lang={lang} text={washroom.attendantText} fragments={washroom.englishFragments} />
                    </p>
                    <FieldTable rows={washroom.rows} caption={washroom.heading} lang={lang} captionEnglish={lang === "fr"} />
                  </article>
                ))
              : null}
            {section.id === "parking"
              ? view.bays.map((bay) => (
                  <article key={bay.id} className="card" aria-labelledby={`b-${bay.id}`}>
                    <h3 id={`b-${bay.id}`}>
                      <RecordText lang={lang} text={bay.heading} />
                    </h3>
                    <p>{bay.kindText}</p>
                    <p>{bay.vanLiftText}</p>
                    <p>{bay.privilegeText}</p>
                    <FieldTable rows={bay.rows} caption={bay.heading} lang={lang} captionEnglish={lang === "fr"} />
                  </article>
                ))
              : null}
            {section.id === "charging"
              ? view.charging.map((point) => (
                  <article key={point.id} className="card" aria-labelledby={`c-${point.id}`}>
                    <h3 id={`c-${point.id}`}>
                      <RecordText lang={lang} text={point.heading} />
                    </h3>
                    <FieldTable rows={point.rows} caption={point.heading} lang={lang} captionEnglish={lang === "fr"} />
                  </article>
                ))
              : null}
            {section.id === "repair" ? (
              <>
                {view.repairers.map((card) => (
                  <article key={card.id} className="card">
                    <h3>
                      <EnglishText lang={lang} text={card.heading} fragments={card.englishFragments} />
                    </h3>
                    <ul>
                      {card.lines.map((line) => (
                        <li key={line}>
                          <EnglishText lang={lang} text={line} fragments={card.englishFragments} />
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
                {view.supplyStores.map((card) => (
                  <article key={card.id} className="card">
                    <h3>
                      <EnglishText lang={lang} text={card.heading} fragments={card.englishFragments} />
                    </h3>
                    <ul>
                      {card.lines.map((line) => (
                        <li key={line}>
                          <EnglishText lang={lang} text={line} fragments={card.englishFragments} />
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </>
            ) : null}
          </section>
        ))}
        {view.peerTips.length > 0 ? (
          <section aria-labelledby="h-peer">
            <h2 id="h-peer">{copy("place.peer-tips", lang)}</h2>
            <ul>
              {view.peerTips.map((tip) => (
                <li key={tip.text}>
                  <EnglishText lang={lang} text={tip.text} fragments={tip.englishFragments} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <section aria-labelledby="h-pending">
          <h2 id="h-pending">{copy("place.pending", lang)}</h2>
          <p role="status">{pending}</p>
          {corrections.length === 0 && changes.length === 0 ? (
            <p>{copy("place.no-report", lang)}</p>
          ) : (
            <ul>
              {corrections.map((correction) => (
                <li key={correction.id}>
                  {copy("place.pending-correction", lang)}:{" "}
                  {correctableFields(place, lang).find((field) => field.id === correction.fieldId)?.label ??
                    copy("place.field", lang)}
                  . {correction.suggestedCorrection}
                </li>
              ))}
              {changes.map((change) => (
                <li key={change.id}>
                  {copy("place.pending-change", lang)}: {labelOf(`problem.${change.problem}`, lang)}
                </li>
              ))}
            </ul>
          )}
          <h3>{copy("place.suggest", lang)}</h3>
          <CorrectionForm place={place} lang={lang} onSubmit={onCorrection} />
          <h3>{copy("place.report-change", lang)}</h3>
          <ChangeReportForm place={place} lang={lang} onSubmit={onChange} />
        </section>
      </div>
    </article>
  );
}
