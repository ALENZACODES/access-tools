import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { copy, type CopyKey } from "../i18n.js";
import { CHAIR_TYPES, deleteProfile, parseWidthMm, readProfile, saveProfile, type ChairType, type EquipmentProfile } from "../profile.js";
import type { Lang } from "../types.js";

const CHAIR_LABEL: Record<ChairType, CopyKey> = {
  manual: "profile.chair.manual",
  power: "profile.chair.power",
  scooter: "profile.chair.scooter",
  other: "profile.chair.other",
};

type StatusKey = "profile.saved" | "profile.deleted";
type ErrorKey = "profile.width-invalid" | "profile.storage-failed";

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
  const [chairType, setChairType] = useState<ChairType | "">(saved?.chairType ?? "");
  const [widthText, setWidthText] = useState(saved?.widthMm === null || saved === null ? "" : String(saved.widthMm));
  const [stepFreeRequired, setStepFreeRequired] = useState(saved?.stepFreeRequired ?? false);
  const [adultChangeTable, setAdultChangeTable] = useState(saved?.adultChangeTable ?? false);
  const [statusKey, setStatusKey] = useState<StatusKey | null>(null);
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);
  const [confirming, setConfirming] = useState(false);
  const chairId = useId();
  const chairHintId = useId();
  const widthId = useId();
  const widthHintId = useId();
  const widthErrorId = useId();
  const stepHintId = useId();
  const tableHintId = useId();
  const confirmId = useId();
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openedConfirm = useRef(false);
  const widthInvalid = errorKey === "profile.width-invalid";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (confirming && dialog) {
      openedConfirm.current = true;
      if (!dialog.open) {
        try {
          if (typeof dialog.showModal === "function") dialog.showModal();
          else dialog.setAttribute("open", "");
        } catch {
          dialog.setAttribute("open", "");
        }
      }
      confirmButtonRef.current?.focus();
      return;
    }
    if (dialog?.open) dialog.close();
    if (openedConfirm.current) deleteButtonRef.current?.focus();
  }, [confirming]);

  function clearForm(): void {
    setChairType("");
    setWidthText("");
    setStepFreeRequired(false);
    setAdultChangeTable(false);
  }

  function cancelDelete(): void {
    setConfirming(false);
  }

  function removeProfile(): void {
    deleteProfile(storage);
    clearForm();
    setErrorKey(null);
    setConfirming(false);
    setStatusKey("profile.deleted");
    onChange(null);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const widthMm = parseWidthMm(widthText);
        if (widthMm === "invalid") {
          setErrorKey("profile.width-invalid");
          setStatusKey(null);
          return;
        }
        const result = saveProfile(storage, {
          chairType: chairType === "" ? null : chairType,
          widthMm,
          stepFreeRequired,
          adultChangeTable,
        });
        if (!result.ok) {
          setStatusKey(null);
          setErrorKey(result.error === "width" ? "profile.width-invalid" : "profile.storage-failed");
          return;
        }
        setErrorKey(null);
        setConfirming(false);
        setStatusKey("profile.saved");
        onChange(result.profile);
      }}
    >
      <fieldset>
        <legend>{copy("profile.title", lang)}</legend>
        <p>{copy("profile.intro", lang)}</p>
        <label htmlFor={chairId}>{copy("profile.chair", lang)}</label>
        <select
          id={chairId}
          value={chairType}
          aria-describedby={chairHintId}
          onChange={(event) => setChairType(event.target.value as ChairType | "")}
        >
          <option value="">{copy("profile.chair.unset", lang)}</option>
          {CHAIR_TYPES.map((type) => (
            <option key={type} value={type}>
              {copy(CHAIR_LABEL[type], lang)}
            </option>
          ))}
        </select>
        <p id={chairHintId}>{copy("profile.chair-hint", lang)}</p>
        <label htmlFor={widthId}>{copy("profile.width", lang)}</label>
        <input
          id={widthId}
          type="text"
          inputMode="numeric"
          aria-invalid={widthInvalid || undefined}
          aria-errormessage={widthInvalid ? widthErrorId : undefined}
          aria-describedby={widthInvalid ? `${widthHintId} ${widthErrorId}` : widthHintId}
          value={widthText}
          onChange={(event) => {
            setWidthText(event.target.value);
            if (errorKey === "profile.width-invalid") setErrorKey(null);
          }}
        />
        <p id={widthHintId}>{copy("profile.width-hint", lang)}</p>
        <label>
          <input
            type="checkbox"
            checked={stepFreeRequired}
            aria-describedby={stepHintId}
            onChange={(event) => setStepFreeRequired(event.target.checked)}
          />{" "}
          {copy("profile.step-free", lang)}
        </label>
        <p id={stepHintId}>{copy("profile.step-free-hint", lang)}</p>
        <label>
          <input
            type="checkbox"
            checked={adultChangeTable}
            aria-describedby={tableHintId}
            onChange={(event) => setAdultChangeTable(event.target.checked)}
          />{" "}
          {copy("profile.change-table", lang)}
        </label>
        <p id={tableHintId}>{copy("profile.change-table-hint", lang)}</p>
        <button type="submit">{copy("profile.save", lang)}</button>{" "}
        {confirming ? (
          <dialog
            ref={dialogRef}
            aria-labelledby={confirmId}
            onKeyDown={(event: KeyboardEvent<HTMLDialogElement>) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              event.stopPropagation();
              cancelDelete();
            }}
            onCancel={(event) => {
              event.preventDefault();
              cancelDelete();
            }}
          >
            <p id={confirmId}>{copy("profile.delete-confirm", lang)}</p>
            <button ref={confirmButtonRef} type="button" onClick={removeProfile}>
              {copy("profile.delete-yes", lang)}
            </button>{" "}
            <button type="button" onClick={cancelDelete}>
              {copy("profile.delete-cancel", lang)}
            </button>
          </dialog>
        ) : (
          <button ref={deleteButtonRef} type="button" onClick={() => setConfirming(true)}>
            {copy("profile.delete", lang)}
          </button>
        )}
        {statusKey ? <p role="status">{copy(statusKey, lang)}</p> : null}
        {errorKey ? (
          <p id={errorKey === "profile.width-invalid" ? widthErrorId : undefined} role="alert" className="error">
            {copy(errorKey, lang)}
          </p>
        ) : null}
      </fieldset>
    </form>
  );
}
