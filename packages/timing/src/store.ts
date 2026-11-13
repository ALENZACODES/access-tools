import { blankTimingDocument, parseTimingDocument } from "./document.js";
import type { TimingDocument } from "./types.js";

const DB_NAME = "the-app-timing";
const STORE = "documents";
const KEY = "constraints";

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

export function openTimingDatabase(): Promise<IDBDatabase> {
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

export async function readTimingDocument(db: IDBDatabase): Promise<TimingDocument> {
  const stored = await requestToPromise(
    db.transaction(STORE, "readonly").objectStore(STORE).get(KEY),
  );
  if (stored == null) return blankTimingDocument();
  return parseTimingDocument(stored);
}

export async function writeTimingDocument(db: IDBDatabase, input: unknown): Promise<TimingDocument> {
  const document = parseTimingDocument(input);
  await requestToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).put(document, KEY));
  return document;
}

export async function deleteTimingDocument(db: IDBDatabase): Promise<void> {
  await requestToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).delete(KEY));
}

export const TIMING_DATABASE_NAME = DB_NAME;
