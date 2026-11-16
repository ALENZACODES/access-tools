import { useState } from "react";
import { fieldName } from "../catalog.js";
import type { Lang } from "../catalog.js";
import { copy, fill } from "../copy.js";
import { assessPlace } from "../observations.js";
import {
  TRAINING_STEPS, claimTask, completeTask, freshnessTasks, observationsForTask, recognition, releaseTask, setTrainingStep,
  taskQueue, trainingComplete, trainingProgress,
} from "../programme.js";
import type { AuditTask } from "../programme.js";
import { DEVICE_AUDITOR } from "../workspace.js";
import type { Workspace } from "../workspace.js";

export interface PanelProps {
  lang: Lang;
  workspace: Workspace;
  placeId: string;
  today: string;
  onChange: (next: Workspace, message: string) => void;
}

/** Training checklist, the task queue for the chosen place, and count-only progress. */
export function ProgrammePanel({ lang, workspace, placeId, today, onChange }: PanelProps) {
  const t = copy[lang];
  const [note, setNote] = useState("");
  const progress = trainingProgress(workspace.training);
  const trained = trainingComplete(workspace.training);
  const queue = taskQueue(workspace.tasks, placeId);
  const counts = recognition(workspace.tasks, workspace.observations, DEVICE_AUDITOR);

  function replaceTask(next: AuditTask, message: string) {
    onChange({ ...workspace, tasks: workspace.tasks.map((task) => (task.id === next.id ? next : task)) }, message);
  }
  function addFreshness() {
    const made = freshnessTasks(assessPlace(workspace.observations, placeId, today), placeId, workspace.tasks, today)
      .filter((task) => !workspace.tasks.some((existing) => existing.id === task.id));
    const message = made.length > 0 ? fill(t.freshnessAdded, { count: made.length }) : t.freshnessNone;
    setNote(message);
    if (made.length > 0) onChange({ ...workspace, tasks: [...workspace.tasks, ...made] }, message);
  }

  return (
    <section aria-labelledby="programme-heading">
      <h2 id="programme-heading">{t.programmeHeading}</h2>
      <p>{t.programmeIntro}</p>
      <fieldset>
        <legend>{t.trainingLegend}</legend>
        {TRAINING_STEPS.map((step) => (
          <label className="check" key={step}>
            <input
              type="checkbox"
              checked={workspace.training.completed[step] !== undefined}
              onChange={(e) => onChange({ ...workspace, training: setTrainingStep(workspace.training, step, e.target.checked, today) }, "")}
            />
            {t.training[step]}
          </label>
        ))}
      </fieldset>
      <p data-testid="training-progress">{fill(t.trainingProgress, progress)}</p>

      <h3>{t.queueHeading}</h3>
      {!trained ? <p>{t.trainingNeeded}</p> : null}
      {queue.length === 0 ? <p>{t.queueEmpty}</p> : (
        <ul className="cards">
          {queue.map((task) => {
            const ready = observationsForTask(task, workspace.observations).length > 0;
            const name = `${t.taskKind[task.kind]}: ${task.field === null ? t.wholePlace : fieldName(lang, task.field)}`;
            return (
              <li key={task.id} data-task={task.id}>
                <p><strong>{name}</strong></p>
                <p>
                  {t.taskStatus[task.status]}. {fill(t.taskCreated, { date: task.createdOn })}.{" "}
                  {task.origin === "fixture" ? `${t.sample}. ` : ""}{task.caseId ? t.taskFromCase : ""}
                </p>
                {task.status === "open" && trained ? (
                  <button type="button" aria-label={`${t.claim}: ${name}`} onClick={() => replaceTask(claimTask(task, DEVICE_AUDITOR, workspace.training, today), t.taskClaimed)}>{t.claim}</button>
                ) : null}
                {task.status === "claimed" ? (
                  <>
                    {ready ? (
                      <button type="button" aria-label={`${t.complete}: ${name}`} onClick={() => replaceTask(completeTask(task, workspace.observations, today), t.taskCompleted)}>{t.complete}</button>
                    ) : <p>{t.completeNeeds}</p>}
                    <button type="button" className="quiet" aria-label={`${t.release}: ${name}`} onClick={() => replaceTask(releaseTask(task), t.taskReleased)}>{t.release}</button>
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <button type="button" className="quiet" onClick={addFreshness}>{t.addFreshness}</button>
      <p role="status">{note}</p>

      <h3>{t.progressHeading}</h3>
      <p>{t.progressIntro}</p>
      <dl className="metrics">
        <div><dt>{t.auditsCompleted}</dt><dd data-testid="count-audits">{counts.auditsCompleted}</dd></div>
        <div><dt>{t.recheckCompleted}</dt><dd>{counts.recheckCompleted}</dd></div>
        <div><dt>{t.fieldsRecorded}</dt><dd data-testid="count-fields">{counts.fieldsRecorded}</dd></div>
        <div><dt>{t.fieldsRecordedUnknown}</dt><dd>{counts.fieldsRecordedUnknown}</dd></div>
      </dl>
    </section>
  );
}
