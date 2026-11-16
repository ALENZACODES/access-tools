import { useId, useState } from "react";
import { fieldName } from "../catalog.js";
import type { Lang } from "../catalog.js";
import { copy, fill } from "../copy.js";
import { barrierStatus, barriersForPlace, respondToBarrier, responseProblems } from "../venue.js";
import type { ResponseKind, VenueResponse } from "../venue.js";
import { isClosed } from "../workflow.js";
import type { CorrectionCase } from "../workflow.js";
import type { Workspace } from "../workspace.js";

export interface VenueProps {
  lang: Lang;
  workspace: Workspace;
  placeId: string;
  /** Returns the current clock time. */
  now: () => string;
  newId: () => string;
  onRespond: (next: Workspace, message: string, response: VenueResponse) => void;
}

function BarrierCard(props: VenueProps & { item: CorrectionCase }) {
  const { lang, workspace, item } = props;
  const t = copy[lang];
  const id = useId();
  const [kind, setKind] = useState<ResponseKind>("acknowledge");
  const [fixedOn, setFixedOn] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const responses = workspace.responses.filter((r) => r.caseId === item.id).sort((a, b) => a.at.localeCompare(b.at));
  const status = barrierStatus(item, workspace.responses, workspace.tasks);

  function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = { id: `response-${props.newId()}`, placeId: props.placeId, kind, at: props.now(), fixedOn, reason };
    const problems = responseProblems(item, input);
    if (problems.includes("fixed-date") || problems.includes("fixed-date-in-future")) { setError(t.errFixedDate); return; }
    if (problems.includes("reason")) { setError(t.errReason); return; }
    if (problems.length > 0) return;
    const result = respondToBarrier(item, workspace.tasks, input);
    setError(""); setReason(""); setFixedOn(""); setKind("acknowledge");
    props.onRespond(
      { ...workspace, responses: [...workspace.responses, result.response], tasks: result.newTask ? [...workspace.tasks, result.newTask] : workspace.tasks },
      result.recheckTaskId ? t.responseSavedRecheck : t.responseSaved,
      result.response,
    );
  }

  return (
    <li data-case={item.id}>
      <h3>{item.description}</h3>
      <p>
        {item.field === null ? t.wholePlace : fieldName(lang, item.field)}. {fill(t.reported, { date: (item.history[0]?.at ?? "").slice(0, 10) })}.
        {item.origin === "fixture" ? ` ${t.sample}.` : ""}
      </p>
      <p><strong>{t.barrierStatusLabel}:</strong> <span data-testid="barrier-status">{t.barrierStatus[status]}</span></p>
      {responses.length > 0 ? (
        <>
          <h4>{t.responsesHeading}</h4>
          <ol>
            {responses.map((r) => (
              <li key={r.id}>
                {r.at.slice(0, 10)}: {t.responseKind[r.kind]}
                {r.kind === "fixed" && r.fixedOn ? `. ${fill(t.fixedOnDate, { date: r.fixedOn })}` : ""}
                {r.kind === "dispute" && r.reason ? `. ${r.reason}` : ""}
              </li>
            ))}
          </ol>
        </>
      ) : null}
      {isClosed(item) ? null : (
        <form onSubmit={send} noValidate>
          <fieldset>
            <legend>{t.respondLegend}</legend>
            {(["acknowledge", "fixed", "dispute"] as const).map((option) => (
              <label className="check" key={option}>
                <input type="radio" name={`${id}-kind`} checked={kind === option} onChange={() => { setKind(option); setError(""); }} />
                {option === "acknowledge" ? t.optAcknowledge : option === "fixed" ? t.optFixed : t.optDispute}
              </label>
            ))}
          </fieldset>
          {kind === "fixed" ? (
            <label>{t.fixedOn}
              <input type="date" value={fixedOn} required aria-invalid={error !== ""} aria-describedby={`${id}-error`} onChange={(e) => setFixedOn(e.target.value)} />
            </label>
          ) : null}
          {kind === "dispute" ? (
            <label>{t.reason}
              <textarea value={reason} required aria-invalid={error !== ""} aria-describedby={`${id}-error`} onChange={(e) => setReason(e.target.value)} />
            </label>
          ) : null}
          <p id={`${id}-error`} role="alert" className="error">{error}</p>
          <button type="submit">{t.sendResponse}</button>
        </form>
      )}
    </li>
  );
}

/** What a venue sees: the barriers reported for its place, and a way to respond to each. */
export function VenuePanel(props: VenueProps) {
  const t = copy[props.lang];
  const barriers = barriersForPlace(props.workspace.cases, props.placeId);
  return (
    <section aria-labelledby="venue-heading">
      <h2 id="venue-heading">{t.venueHeading}</h2>
      <p>{t.venueIntro}</p>
      {barriers.length === 0 ? <p>{t.venueEmpty}</p> : (
        <ul className="cards">{barriers.map((item) => <BarrierCard key={item.id} {...props} item={item} />)}</ul>
      )}
    </section>
  );
}
