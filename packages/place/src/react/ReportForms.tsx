import { useState } from "react";
import { MODERATION_NOTE } from "../corrections.js";
import { labelOf } from "../i18n.js";
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
          setError(lang === "fr" ? "Écrivez la correction proposée." : "Write the suggested correction.");
          return;
        }
        setError("");
        onSubmit({ fieldId, suggestedCorrection: suggested, note });
        setSuggested("");
        setNote("");
      }}
    >
      <p>
        {lang === "fr"
          ? "La correction reste sur cet appareil, en attente. Elle ne change pas la fiche. La modération ne tourne pas dans ce prototype."
          : "The correction stays on this device, pending. It does not change the record. Moderation is not running in this prototype."}
      </p>
      <label htmlFor="correction-field">{lang === "fr" ? "Champ" : "Field"}</label>
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
      <label htmlFor="correction-suggested">{lang === "fr" ? "Correction proposée" : "Suggested correction"}</label>
      <textarea
        id="correction-suggested"
        value={suggested}
        onChange={(event) => setSuggested(event.target.value)}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "correction-error" : undefined}
      />
      <label htmlFor="correction-note">{lang === "fr" ? "Note (facultative)" : "Note (optional)"}</label>
      <textarea id="correction-note" value={note} onChange={(event) => setNote(event.target.value)} />
      {error ? (
        <p id="correction-error" className="error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit">{lang === "fr" ? "Enregistrer la correction sur cet appareil" : "Save correction on this device"}</button>
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
        {lang === "fr"
          ? "Signaler un changement. Le signalement est en attente et n'efface pas la fiche."
          : "Report a change. The report stays pending and does not erase the record."}
      </p>
      <label htmlFor="change-problem">{lang === "fr" ? "Problème" : "Problem"}</label>
      <select id="change-problem" value={problem} onChange={(event) => setProblem(event.target.value as ChangeProblem)}>
        {CHANGE_PROBLEMS.map((item) => (
          <option key={item} value={item}>
            {labelOf(`problem.${item}`, lang)}
          </option>
        ))}
      </select>
      <label htmlFor="change-note">{lang === "fr" ? "Note (facultative)" : "Note (optional)"}</label>
      <textarea id="change-note" value={note} onChange={(event) => setNote(event.target.value)} />
      <button type="submit">{lang === "fr" ? "Enregistrer le signalement sur cet appareil" : "Save report on this device"}</button>
      <p>{lang === "fr" ? MODERATION_NOTE.fr : MODERATION_NOTE.en}</p>
    </form>
  );
}
