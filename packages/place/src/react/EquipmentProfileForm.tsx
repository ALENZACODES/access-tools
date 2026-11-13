import { useId, useState } from "react";
import { copy, type CopyKey } from "../i18n.js";
import { CHAIR_TYPES, deleteProfile, parseWidthMm, readProfile, saveProfile, type ChairType, type EquipmentProfile } from "../profile.js";
import type { Lang } from "../types.js";

const CHAIR_LABEL: Record<ChairType, CopyKey> = {
  manual: "profile.chair.manual",
  power: "profile.chair.power",
  scooter: "profile.chair.scooter",
  other: "profile.chair.other",
};

export function EquipmentProfileForm({
  lang,
  storage,
  onChange,
}: {
  lang: Lang;
  storage: Storage;
  onChange: (profile: EquipmentProfile | null) => void;
}) {
  const saved = readProfile(storage);
  const [name, setName] = useState(saved?.name ?? "");
  const [chairType, setChairType] = useState<ChairType | "">(saved?.chairType ?? "");
  const [widthText, setWidthText] = useState(saved?.widthMm === null || saved === null ? "" : String(saved.widthMm));
  const [stepFreeRequired, setStepFreeRequired] = useState(saved?.stepFreeRequired ?? false);
  const [adultChangeTable, setAdultChangeTable] = useState(saved?.adultChangeTable ?? false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const nameId = useId();
  const chairId = useId();
  const widthId = useId();
  const widthHintId = useId();

  function clearForm(): void {
    setName("");
    setChairType("");
    setWidthText("");
    setStepFreeRequired(false);
    setAdultChangeTable(false);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const widthMm = parseWidthMm(widthText);
        if (widthMm === "invalid") {
          setError(copy("profile.width-invalid", lang));
          setStatus("");
          return;
        }
        const result = saveProfile(storage, {
          name,
          chairType: chairType === "" ? null : chairType,
          widthMm,
          stepFreeRequired,
          adultChangeTable,
        });
        if (!result.ok) {
          setStatus("");
          const errorKey: CopyKey =
            result.error === "width" ? "profile.width-invalid" : result.error === "storage" ? "profile.storage-failed" : "profile.name-required";
          setError(copy(errorKey, lang));
          return;
        }
        setName(result.profile.name);
        setError("");
        setStatus(copy("profile.saved", lang));
        onChange(result.profile);
      }}
    >
      <fieldset>
        <legend>{copy("profile.title", lang)}</legend>
        <p>{copy("profile.intro", lang)}</p>
        <label htmlFor={nameId}>{copy("profile.name", lang)}</label>
        <input id={nameId} type="text" value={name} autoComplete="off" onChange={(event) => setName(event.target.value)} />
        <label htmlFor={chairId}>{copy("profile.chair", lang)}</label>
        <select
          id={chairId}
          value={chairType}
          onChange={(event) => setChairType(event.target.value as ChairType | "")}
        >
          <option value="">{copy("profile.chair.unset", lang)}</option>
          {CHAIR_TYPES.map((type) => (
            <option key={type} value={type}>
              {copy(CHAIR_LABEL[type], lang)}
            </option>
          ))}
        </select>
        <label htmlFor={widthId}>{copy("profile.width", lang)}</label>
        <input
          id={widthId}
          type="text"
          inputMode="numeric"
          aria-describedby={widthHintId}
          value={widthText}
          onChange={(event) => setWidthText(event.target.value)}
        />
        <p id={widthHintId}>{copy("profile.width-hint", lang)}</p>
        <label>
          <input type="checkbox" checked={stepFreeRequired} onChange={(event) => setStepFreeRequired(event.target.checked)} />{" "}
          {copy("profile.step-free", lang)}
        </label>
        <label>
          <input type="checkbox" checked={adultChangeTable} onChange={(event) => setAdultChangeTable(event.target.checked)} />{" "}
          {copy("profile.change-table", lang)}
        </label>
        <button type="submit">{copy("profile.save", lang)}</button>{" "}
        <button
          type="button"
          onClick={() => {
            deleteProfile(storage);
            clearForm();
            setError("");
            setStatus(copy("profile.deleted", lang));
            onChange(null);
          }}
        >
          {copy("profile.delete", lang)}
        </button>
        {status ? <p role="status">{status}</p> : null}
        {error ? (
          <p role="alert" className="error">
            {error}
          </p>
        ) : null}
      </fieldset>
    </form>
  );
}
