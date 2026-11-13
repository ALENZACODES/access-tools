import type { NavigatorNote } from "./types.js";

const DB_NAME = "the-app-navigator-notes";
const STORE = "notes";
const KEY = "checklist";

const FORBIDDEN_KEYS = ["diagnosis", "income", "assets", "sin", "healthcard", "catheter", "medication", "symptom"];

function assertIdsOnly(note: NavigatorNote): void {
  if (!note || typeof note !== "object" || Array.isArray(note)) {
    throw new Error("A navigator note stores program ids only.");
  }
  const extra = Object.keys(note).filter((key) => key !== "programIds");
  if (extra.length > 0 || extra.some((key) => FORBIDDEN_KEYS.includes(key.toLowerCase()))) {
    throw new Error("A navigator note cannot store health, income, or identity details.");
  }
  if (!Array.isArray(note.programIds) || note.programIds.some((id) => typeof id !== "string" || id.length > 80)) {
    throw new Error("A navigator note stores program ids only.");
  }
}

export function emptyNote(): NavigatorNote {
  return { programIds: [] };
}

export function toggleProgram(note: NavigatorNote, programId: string): NavigatorNote {
  assertIdsOnly(note);
  const has = note.programIds.includes(programId);
  return { programIds: has ? note.programIds.filter((id) => id !== programId) : [...note.programIds, programId] };
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.addEventListener("upgradeneeded", () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

function done<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

export function openNavigatorNotes(): Promise<IDBDatabase> {
  return open();
}

export async function readNote(db: IDBDatabase): Promise<NavigatorNote> {
  const stored = await done<NavigatorNote | undefined>(db.transaction(STORE, "readonly").objectStore(STORE).get(KEY));
  if (!stored) return emptyNote();
  assertIdsOnly(stored);
  return { programIds: [...stored.programIds] };
}

export async function writeNote(db: IDBDatabase, note: NavigatorNote): Promise<void> {
  assertIdsOnly(note);
  await done(db.transaction(STORE, "readwrite").objectStore(STORE).put({ programIds: [...note.programIds] }, KEY));
}

export async function deleteNote(db: IDBDatabase): Promise<void> {
  await done(db.transaction(STORE, "readwrite").objectStore(STORE).delete(KEY));
}

export const NAVIGATOR_NOTES_DATABASE = DB_NAME;
