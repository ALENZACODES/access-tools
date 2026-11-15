import { strings } from "./strings";
import type { AssistanceProfile, Lang } from "./types";

export const emptyProfile: AssistanceProfile = {
  displayName: "", mobilityNotes: "", attendant: "unset", transferNotes: "",
};

export function exportProfileJson(p: AssistanceProfile, exportedAt: string): string {
  return JSON.stringify(
    {
      schema: "access-tools.assistance-profile",
      version: 1,
      exported_at: exportedAt,
      provided_by_person: true,
      fields: {
        displayName: p.displayName,
        mobilityNotes: p.mobilityNotes,
        attendant: p.attendant,
        transferNotes: p.transferNotes,
      },
    },
    null,
    2,
  );
}

export function exportProfileText(p: AssistanceProfile, lang: Lang, exportedAt: string): string {
  const s = strings[lang];
  const colon = lang === "fr" ? "\u202F: " : ": ";
  const val = (v: string) => (v.trim() === "" ? s.unknown : v.trim());
  const att = p.attendant === "yes" ? s.attendantYes : p.attendant === "no" ? s.attendantNo : s.unknown;
  return [
    s.sheetTitle,
    s.sheetNote,
    `${s.exportedOn}${colon}${exportedAt}`,
    "",
    `${s.displayName}${colon}${val(p.displayName)}`,
    `${s.attendant}${colon}${att}`,
    `${s.mobilityNotes}${colon}${val(p.mobilityNotes)}`,
    `${s.transferNotes}${colon}${val(p.transferNotes)}`,
    "",
  ].join("\n");
}
