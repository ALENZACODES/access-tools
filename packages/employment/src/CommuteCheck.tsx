import { useState } from "react";
import { EMPTY_COMMUTE_INPUTS, checkCommute, parseMinutes, parseTime } from "./commute.js";
import type { CommuteMode, CommuteReport, PlanResult } from "./commute.js";
import { depthCatalog } from "./depthCatalog.js";
import { UNKNOWN } from "./record.js";
import type { ListingRecord } from "./record.js";
import { describeCommuteItem } from "./referral.js";
import type { Language } from "./types.js";

const MODES: CommuteMode[] = ["paratransit", "transit", "drive", "roll-or-walk", "other"];

interface Props {
  record: ListingRecord;
  language: Language;
  report: CommuteReport | null;
  onReport: (report: CommuteReport) => void;
  /** Optional journey-plan result handed in as data. Nothing is fetched here. */
  plan?: PlanResult | null;
}

export function CommuteCheck({ record, language, report, onReport, plan = null }: Props) {
  const t = depthCatalog[language];
  const [mode, setMode] = useState<CommuteMode | "">("");
  const [travel, setTravel] = useState("");
  const [limit, setLimit] = useState("");
  const [times, setTimes] = useState({ shiftStart: "", shiftEnd: "", serviceStart: "", serviceEnd: "" });
  const [winter, setWinter] = useState<"" | "yes" | "no">("");
  const id = (name: string) => `commute-${name}`;
  const time = (value: string) => (parseTime(value) === null ? UNKNOWN : value);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onReport(checkCommute({
      ...EMPTY_COMMUTE_INPUTS,
      mode: mode === "" ? UNKNOWN : mode,
      travelMinutes: parseMinutes(travel),
      maxMinutes: parseMinutes(limit),
      shiftStart: time(times.shiftStart), shiftEnd: time(times.shiftEnd),
      serviceStart: time(times.serviceStart), serviceEnd: time(times.serviceEnd),
      winterChecked: winter === "" ? UNKNOWN : winter === "yes",
    }, record, plan));
  };
  const timeField = (name: keyof typeof times) => (
    <div>
      <label htmlFor={id(name)}>{t[name]}</label>
      <input id={id(name)} type="time" value={times[name]} onChange={(event) => setTimes({ ...times, [name]: event.target.value })}/>
    </div>
  );
  return (
    <section className="own-check" aria-labelledby="commute-check-title">
      <h4 id="commute-check-title">{t.commuteHeading}</h4>
      <p>{t.commuteIntro}</p>
      <form onSubmit={submit} className="stack">
        <div>
          <label htmlFor={id("mode")}>{t.mode}</label>
          <select id={id("mode")} value={mode} onChange={(event) => setMode(event.target.value as CommuteMode | "")}>
            <option value="">{t.notEntered}</option>
            {MODES.map((item) => <option key={item} value={item}>{t.modes[item]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={id("travel")}>{t.travelMinutes}</label>
          <input id={id("travel")} inputMode="numeric" autoComplete="off" value={travel} onChange={(event) => setTravel(event.target.value)}/>
        </div>
        <div>
          <label htmlFor={id("limit")}>{t.maxMinutes}</label>
          <input id={id("limit")} inputMode="numeric" autoComplete="off" value={limit} onChange={(event) => setLimit(event.target.value)}/>
        </div>
        {timeField("shiftStart")}
        {timeField("shiftEnd")}
        {timeField("serviceStart")}
        {timeField("serviceEnd")}
        <div>
          <label htmlFor={id("winter")}>{t.winter}</label>
          <select id={id("winter")} value={winter} onChange={(event) => setWinter(event.target.value as "" | "yes" | "no")}>
            <option value="">{t.notEntered}</option>
            <option value="yes">{t.yes}</option>
            <option value="no">{t.no}</option>
          </select>
        </div>
        <button type="submit">{t.runCheck}</button>
      </form>
      <div role="status">
        {report && <>
          <h5>{t.resultsHeading}</h5>
          <p><strong>{t.commuteSummary(report.knownCount, report.unknownCount)}</strong></p>
          <ul className="known-list">
            {report.items.map((item) => <li key={item.key}>{describeCommuteItem(item, language)}</li>)}
          </ul>
        </>}
      </div>
    </section>
  );
}
