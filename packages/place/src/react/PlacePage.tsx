import type { ChangeReport, Correction, Lang, PlacePack, PlaceRecord } from "../types.js";
import type { ChangeProblem } from "../types.js";
import { projectPlace } from "../project.js";
import { a11yCss } from "./a11yCss.js";
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
  const pending =
    lang === "fr"
      ? `${corrections.length} correction(s) en attente, ${changes.length} signalement(s) en attente. La fiche affichée est inchangée.`
      : `${corrections.length} pending correction(s), ${changes.length} pending change report(s). The displayed record is unchanged.`;
  return (
    <article className="app-ui" lang={lang}>
      <style>{a11yCss}</style>
      <a href="#place-main">{lang === "fr" ? "Aller au contenu" : "Skip to content"}</a>
      <header>
        {headingLevel === 2 ? <h2>{view.title}</h2> : <h1>{view.title}</h1>}
        <p className="prototype-notice" role="note">
          {view.prototypeNotice}
        </p>
        <p className="honesty">{view.honestyNote}</p>
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
                    <h3 id={`w-${washroom.id}`}>{washroom.heading}</h3>
                    <p>{washroom.genderText}</p>
                    <p>{washroom.attendantText}</p>
                    <FieldTable rows={washroom.rows} caption={washroom.heading} lang={lang} />
                  </article>
                ))
              : null}
            {section.id === "parking"
              ? view.bays.map((bay) => (
                  <article key={bay.id} className="card" aria-labelledby={`b-${bay.id}`}>
                    <h3 id={`b-${bay.id}`}>{bay.heading}</h3>
                    <p>{bay.kindText}</p>
                    <p>{bay.vanLiftText}</p>
                    <p>{bay.privilegeText}</p>
                    <FieldTable rows={bay.rows} caption={bay.heading} lang={lang} />
                  </article>
                ))
              : null}
            {section.id === "charging"
              ? view.charging.map((point) => (
                  <article key={point.id} className="card" aria-labelledby={`c-${point.id}`}>
                    <h3 id={`c-${point.id}`}>{point.heading}</h3>
                    <FieldTable rows={point.rows} caption={point.heading} lang={lang} />
                  </article>
                ))
              : null}
            {section.id === "repair" ? (
              <>
                {view.repairers.map((card) => (
                  <article key={card.id} className="card">
                    <h3>{card.heading}</h3>
                    <ul>
                      {card.lines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </article>
                ))}
                {view.supplyStores.map((card) => (
                  <article key={card.id} className="card">
                    <h3>{card.heading}</h3>
                    <ul>
                      {card.lines.map((line) => (
                        <li key={line}>{line}</li>
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
            <h2 id="h-peer">{lang === "fr" ? "Notes de pairs, pas des faits" : "Peer tips, not facts"}</h2>
            <ul>
              {view.peerTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
        ) : null}
        <section aria-labelledby="h-pending">
          <h2 id="h-pending">{lang === "fr" ? "En attente sur cet appareil" : "Pending on this device"}</h2>
          <p role="status">{pending}</p>
          {corrections.length === 0 && changes.length === 0 ? (
            <p>{lang === "fr" ? "Aucun signalement enregistré sur cet appareil." : "No report is saved on this device."}</p>
          ) : (
            <ul>
              {corrections.map((correction) => (
                <li key={correction.id}>
                  {lang === "fr" ? "Correction en attente" : "Pending correction"}: {correction.fieldId}. {correction.suggestedCorrection}
                </li>
              ))}
              {changes.map((change) => (
                <li key={change.id}>
                  {lang === "fr" ? "Signalement en attente" : "Pending change report"}: {change.problem}
                </li>
              ))}
            </ul>
          )}
          <h3>{lang === "fr" ? "Proposer une correction" : "Suggest a correction"}</h3>
          <CorrectionForm place={place} lang={lang} onSubmit={onCorrection} />
          <h3>{lang === "fr" ? "Signaler un changement" : "Report a change"}</h3>
          <ChangeReportForm place={place} lang={lang} onSubmit={onChange} />
        </section>
      </div>
    </article>
  );
}
