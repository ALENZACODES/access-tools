import { useId, useState } from "react";
import { fieldName } from "../catalog.js";
import type { Lang } from "../catalog.js";
import { copy, fill } from "../copy.js";
import { FIELDS } from "../model.js";
import type { Field } from "../model.js";
import { createTask } from "../programme.js";
import {
  DEFAULT_SERVICE_LEVELS, currentState, dueAt, isClosed, isOverdue, openCase, transition,
} from "../workflow.js";
import type { CaseActor, CaseKind, CorrectionCase, ServiceLevels } from "../workflow.js";
import type { Workspace } from "../workspace.js";

export interface CasesProps {
  lang: Lang;
  workspace: Workspace;
  placeId: string;
  /** Who is using the screen. Only the coordinator moves a report on. */
  actor: CaseActor;
  now: () => string;
  newId: () => string;
  levels?: ServiceLevels;
  onChange: (next: Workspace, message: string) => void;
}

function CaseCard(props: CasesProps & { item: CorrectionCase }) {
  const { lang, workspace, item, actor } = props;
  const t = copy[lang];
  const id = useId();
  const levels = props.levels ?? DEFAULT_SERVICE_LEVELS;
  const [declineReason, setDeclineReason] = useState("");
  const [error, setError] = useState("");
  const state = currentState(item);
  const asOf = props.now();
  const due = dueAt(item, levels, asOf);
  const recheckTaskId = item.history.find((event) => event.state === "recheck")?.taskId;
  const recheckTask = workspace.tasks.find((task) => task.id === recheckTaskId);

  function save(next: CorrectionCase, extra: Partial<Workspace> = {}) {
    setError("");
    props.onChange(
      { ...workspace, ...extra, cases: workspace.cases.map((entry) => (entry.id === next.id ? next : entry)) },
      fill(t.caseMoved, { state: t.state[currentState(next)] }),
    );
  }
  function startRecheck() {
    const waiting = workspace.tasks.find(
      (task) => task.caseId === item.id && task.kind === "re-check" && (task.status === "open" || task.status === "claimed"),
    );
    const at = props.now();
    const task = waiting ?? createTask({
      id: `task-recheck-${props.newId()}`, placeId: item.placeId, field: item.field, kind: "re-check", createdOn: at.slice(0, 10), caseId: item.id,
    });
    save(transition(item, "recheck", { at, actor, taskId: task.id }), waiting ? {} : { tasks: [...workspace.tasks, task] });
  }
  function decline(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!declineReason.trim()) { setError(t.errDeclineReason); return; }
    save(transition(item, "declined", { at: props.now(), actor, note: declineReason }));
    setDeclineReason("");
  }

  return (
    <li data-case={item.id} data-state={state}>
      <h3>{item.description}</h3>
      <p>
        {t.kind[item.kind]}. {item.field === null ? t.wholePlace : fieldName(lang, item.field)}.
        {item.origin === "fixture" ? ` ${t.sample}.` : ` ${t.device}.`}
      </p>
      <p><strong>{t.stateLabel}:</strong> <span data-testid="case-state">{t.state[state]}</span></p>
      {due ? <p>{fill(t.due, { date: due.slice(0, 10) })}</p> : null}
      {isOverdue(item, levels, asOf) ? <p className="flag"><strong>{t.overdue}</strong></p> : null}
      <h4>{t.historyHeading}</h4>
      <ol>
        {item.history.map((event, index) => (
          <li key={index}>
            <time dateTime={event.at}>{event.at.slice(0, 10)}</time>: {t.state[event.state]} ({t.actor[event.actor]}){event.note ? `. ${event.note}` : ""}
          </li>
        ))}
      </ol>
      {isClosed(item) ? null : actor !== "coordinator" ? <p>{t.coordinatorOnly}</p> : (
        <div className="actions">
          {state === "received" ? (
            <button type="button" onClick={() => save(transition(item, "triaged", { at: props.now(), actor }))}>{t.doTriage}</button>
          ) : null}
          {state === "triaged" ? <button type="button" onClick={startRecheck}>{t.doRecheck}</button> : null}
          {state === "recheck" ? (
            recheckTask?.status === "done" ? (
              <button type="button" onClick={() => save(transition(item, "resolved", { at: props.now(), actor, observationIds: recheckTask.observationIds }))}>{t.doResolve}</button>
            ) : <p>{t.waitingRecheck}</p>
          ) : null}
          <form onSubmit={decline} noValidate>
            <label>{t.declineReason}
              <input value={declineReason} aria-invalid={error !== ""} aria-describedby={`${id}-error`} onChange={(e) => setDeclineReason(e.target.value)} />
            </label>
            <p id={`${id}-error`} role="alert" className="error">{error}</p>
            <button type="submit" className="quiet">{t.doDecline}</button>
          </form>
        </div>
      )}
    </li>
  );
}

/** The correction and report workflow for one place: a form to send a report and each case with its state and due date. */
export function CasesPanel(props: CasesProps) {
  const { lang, workspace, placeId } = props;
  const t = copy[lang];
  const id = useId();
  const [kind, setKind] = useState<CaseKind>("correction");
  const [field, setField] = useState<Field | "">("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const cases = workspace.cases
    .filter((item) => item.placeId === placeId)
    .sort((a, b) => (b.history[0]?.at ?? "").localeCompare(a.history[0]?.at ?? "") || a.id.localeCompare(b.id));

  function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!description.trim()) { setError(t.errDescription); return; }
    const created = openCase({
      id: `case-${props.newId()}`, placeId, field: field === "" ? null : field, kind, description, at: props.now(),
      actor: props.actor === "coordinator" ? "reporter" : props.actor,
    });
    setError(""); setDescription("");
    props.onChange({ ...workspace, cases: [...workspace.cases, created] }, t.reportSaved);
  }

  return (
    <section aria-labelledby="cases-heading">
      <h2 id="cases-heading">{t.casesHeading}</h2>
      <p>{t.casesIntro}</p>
      <form onSubmit={send} noValidate aria-labelledby={`${id}-new`}>
        <h3 id={`${id}-new`}>{t.newReport}</h3>
        <label>{t.kindLabel}
          <select value={kind} onChange={(e) => setKind(e.target.value as CaseKind)}>
            <option value="correction">{t.kind.correction}</option>
            <option value="barrier">{t.kind.barrier}</option>
          </select>
        </label>
        <label>{t.aboutField}
          <select value={field} onChange={(e) => setField(e.target.value as Field | "")}>
            <option value="">{t.wholePlace}</option>
            {FIELDS.map((name) => <option key={name} value={name}>{fieldName(lang, name)}</option>)}
          </select>
        </label>
        <label>{t.description}
          <textarea value={description} required aria-invalid={error !== ""} aria-describedby={`${id}-error`} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <p id={`${id}-error`} role="alert" className="error">{error}</p>
        <button type="submit">{t.sendReport}</button>
      </form>
      {cases.length === 0 ? <p>{t.casesEmpty}</p> : (
        <ul className="cards">{cases.map((item) => <CaseCard key={item.id} {...props} item={item} />)}</ul>
      )}
    </section>
  );
}
