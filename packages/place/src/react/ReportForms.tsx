import { useState } from "react";
import { MODERATION_NOTE } from "../corrections.js";
import { copy, labelOf } from "../i18n.js";
import { correctableFields } from "../project.js";
import { CHANGE_PROBLEMS, type ChangeProblem, type Lang, type PlaceRecord } from "../types.js";

export function CorrectionForm({
  place,
  lang,
  onSubmit,
}: {
  place: PlaceRecord;
  lang: Lang;
  onSubmit: (input: { fieldId: string; suggestedCorrection: string; note: string }) => void;
}) {
  const fields = correctableFields(place, lang);
  const [fieldId, setFieldId] = useState(fields[0]?.id ?? "");
  const [suggested, setSuggested] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const groups = [...new Set(fields.map((field) => field.group))];
  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (!suggested.trim()) {
          setError(copy("form.correction.error", lang));
          return;
        }
        setError("");
        onSubmit({ fieldId, suggestedCorrection: suggested, note });
        setSuggested("");
        setNote("");
      }}
    >
      <p>
        {copy("form.correction.intro", lang)}
      </p>
      <label htmlFor="correction-field">{copy("place.field", lang)}</label>
      <select id="correction-field" value={fieldId} onChange={(event) => setFieldId(event.target.value)}>
        {groups.map((group) => {
          const groupEnglish = fields.some((field) => field.group === group && field.groupEnglish);
          return (
            <optgroup key={group} label={group} lang={groupEnglish ? "en" : undefined}>
              {fields
                .filter((field) => field.group === group)
                .map((field) => (
                  <option key={field.id} value={field.id} lang={lang}>
                    {field.label}
                  </option>
                ))}
            </optgroup>
          );
        })}
      </select>
      <label htmlFor="correction-suggested">{copy("form.correction.suggested", lang)}</label>
      <textarea
        id="correction-suggested"
        value={suggested}
        onChange={(event) => setSuggested(event.target.value)}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "correction-error" : undefined}
      />
      <label htmlFor="correction-note">{copy("form.note-optional", lang)}</label>
      <textarea id="correction-note" value={note} onChange={(event) => setNote(event.target.value)} />
      {error ? (
        <p id="correction-error" className="error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit">{copy("form.correction.save", lang)}</button>
    </form>
  );
}

export function ChangeReportForm({
  place,
  lang,
  onSubmit,
}: {
  place: PlaceRecord;
  lang: Lang;
  onSubmit: (input: { targetId: string; problem: ChangeProblem; note: string }) => void;
}) {
  const [problem, setProblem] = useState<ChangeProblem>("other");
  const [note, setNote] = useState("");
  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ targetId: place.id, problem, note });
        setNote("");
      }}
    >
      <p>
        {copy("form.change.intro", lang)}
      </p>
      <label htmlFor="change-problem">{copy("form.problem", lang)}</label>
      <select id="change-problem" value={problem} onChange={(event) => setProblem(event.target.value as ChangeProblem)}>
        {CHANGE_PROBLEMS.map((item) => (
          <option key={item} value={item}>
            {labelOf(`problem.${item}`, lang)}
          </option>
        ))}
      </select>
      <label htmlFor="change-note">{copy("form.note-optional", lang)}</label>
      <textarea id="change-note" value={note} onChange={(event) => setNote(event.target.value)} />
      <button type="submit">{copy("form.change.save", lang)}</button>
      <p>{lang === "fr" ? MODERATION_NOTE.fr : MODERATION_NOTE.en}</p>
    </form>
  );
}
