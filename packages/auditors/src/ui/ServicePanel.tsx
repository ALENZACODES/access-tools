import type { Lang } from "../catalog.js";
import { copy, fill } from "../copy.js";
import { DEFAULT_SERVICE_LEVELS, STAGES, serviceSummary } from "../workflow.js";
import type { CorrectionCase, ServiceLevels } from "../workflow.js";

function days(levels: ServiceLevels, stage: (typeof STAGES)[number]): number {
  return stage === "triage" ? levels.triageDays : stage === "recheckStart" ? levels.recheckStartDays : levels.closeDays;
}

/** Targets and the service-level summary. With no records of its own, the device shows "no data yet" and no figures. */
export function ServicePanel(props: { lang: Lang; cases: readonly CorrectionCase[]; asOf: string; levels?: ServiceLevels }) {
  const t = copy[props.lang];
  const levels = props.levels ?? DEFAULT_SERVICE_LEVELS;
  const summary = serviceSummary(props.cases, levels, props.asOf);
  const number = (value: number | null) => (value === null ? t.notYet : String(value));
  return (
    <section aria-labelledby="service-heading">
      <h2 id="service-heading">{t.serviceHeading}</h2>
      <p>{t.serviceIntro}</p>
      <h3>{t.targetsHeading}</h3>
      <ul>
        {STAGES.map((stage) => <li key={stage}>{t.stage[stage]}: {fill(t.targetDays, { days: days(levels, stage) })}</li>)}
      </ul>
      {summary.noData ? (
        <p data-testid="service-no-data"><strong>{t.noData}</strong> {t.noDataDetail}</p>
      ) : (
        <div data-testid="service-summary">
          <p>{fill(t.summaryAsOf, { total: summary.total, date: summary.asOf.slice(0, 10) })}</p>
          <dl className="metrics">
            <div><dt>{t.totalOpen}</dt><dd>{summary.open}</dd></div>
            <div><dt>{t.totalResolved}</dt><dd>{summary.resolved}</dd></div>
            <div><dt>{t.totalDeclined}</dt><dd>{summary.declined}</dd></div>
            <div><dt>{t.totalOverdue}</dt><dd data-testid="service-overdue">{summary.overdue}</dd></div>
            <div><dt>{t.medianClose}</dt><dd>{number(summary.medianDaysToClose)}</dd></div>
          </dl>
          <ul className="cards">
            {summary.stages.map((stage) => (
              <li key={stage.stage} data-stage={stage.stage}>
                <h3>{t.stage[stage.stage]}: {fill(t.targetDays, { days: stage.targetDays })}</h3>
                <dl className="facts">
                  <div><dt>{t.stageCompleted}</dt><dd>{stage.completed}</dd></div>
                  <div><dt>{t.stageMet}</dt><dd>{stage.met}</dd></div>
                  <div><dt>{t.stageMissed}</dt><dd>{stage.missed}</dd></div>
                  <div><dt>{t.stageInProgress}</dt><dd>{stage.inProgress}</dd></div>
                  <div><dt>{t.stageOverdue}</dt><dd>{stage.overdue}</dd></div>
                  <div><dt>{t.stageMedian}</dt><dd>{number(stage.medianDays)}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
