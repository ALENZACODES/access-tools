import type { ChangeProblem, ChangeReport, Correction, ReportLog } from "./types.js";

export interface CorrectionInput {
  placeId: string;
  fieldId: string;
  suggestedCorrection: string;
  note: string;
}

export interface ChangeInput {
  placeId: string;
  targetId: string;
  problem: ChangeProblem;
  note: string;
}

export function emptyLog(): ReportLog {
  return { corrections: [], changes: [] };
}

export function appendCorrection(log: ReportLog, input: CorrectionInput, submittedAt: string, id: string): ReportLog {
  const correction: Correction = {
    id,
    placeId: input.placeId,
    fieldId: input.fieldId,
    suggestedCorrection: input.suggestedCorrection.trim(),
    note: input.note.trim(),
    submittedAt,
    status: "pending",
    moderation: "not-running",
  };
  return {
    corrections: [...log.corrections, correction],
    changes: [...log.changes],
  };
}

export function appendChange(log: ReportLog, input: ChangeInput, submittedAt: string, id: string): ReportLog {
  const change: ChangeReport = {
    id,
    placeId: input.placeId,
    targetId: input.targetId,
    problem: input.problem,
    note: input.note.trim(),
    submittedAt,
    status: "pending",
    moderation: "not-running",
  };
  return {
    corrections: [...log.corrections],
    changes: [...log.changes, change],
  };
}

export function correctionsFor(log: ReportLog, placeId: string): Correction[] {
  return log.corrections.filter((correction) => correction.placeId === placeId);
}

export function changesFor(log: ReportLog, placeId: string): ChangeReport[] {
  return log.changes.filter((change) => change.placeId === placeId);
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const REPORT_STORAGE_KEY = "access-tools-reports-v1";

export function readLog(storage: StorageLike, key = REPORT_STORAGE_KEY): ReportLog {
  const raw = storage.getItem(key);
  if (!raw) return emptyLog();
  try {
    const parsed = JSON.parse(raw) as Partial<ReportLog>;
    return {
      corrections: Array.isArray(parsed.corrections) ? parsed.corrections : [],
      changes: Array.isArray(parsed.changes) ? parsed.changes : [],
    };
  } catch {
    return emptyLog();
  }
}

export function writeLog(storage: StorageLike, log: ReportLog, key = REPORT_STORAGE_KEY): void {
  storage.setItem(key, JSON.stringify(log));
}

export const MODERATION_NOTE = {
  en: "Saved on this device as pending. This prototype does not moderate or publish reports. The displayed record does not change.",
  fr: "Enregistré sur cet appareil comme en attente. Ce prototype ne modère ni ne publie les signalements. La fiche affichée ne change pas.",
} as const;
