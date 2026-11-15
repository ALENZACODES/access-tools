import { assertEntry, type Entry } from "./model.js";

export const DATABASE = "access-tools-voluntary-diary-v1";
const CONSENT = "consent";
const ENTRIES = "entries";
const AUDIT = "audit";
export interface ConsentRecord { granted: boolean; changedAt: string }
export interface StoredEntry { id: number; entry: Entry }
export interface ConsentEvent { action: "grant" | "revoke"; at: string }

export function openDiary(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore(CONSENT);
      db.createObjectStore(ENTRIES, { autoIncrement: true });
      db.createObjectStore(AUDIT, { autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function complete<T>(transaction: IDBTransaction, request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    let result: T;
    request.onsuccess = () => { result = request.result; };
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error("Transaction aborted"));
  });
}

export async function readConsent(db: IDBDatabase): Promise<ConsentRecord | undefined> {
  const tx = db.transaction(CONSENT, "readonly");
  return complete(tx, tx.objectStore(CONSENT).get("current") as IDBRequest<ConsentRecord | undefined>);
}

export async function setConsent(db: IDBDatabase, granted: boolean): Promise<void> {
  const tx = db.transaction([CONSENT, AUDIT], "readwrite");
  const at = new Date().toISOString();
  tx.objectStore(CONSENT).put({ granted, changedAt: at } satisfies ConsentRecord, "current");
  const request = tx.objectStore(AUDIT).add({ action: granted ? "grant" : "revoke", at } satisfies ConsentEvent);
  await complete(tx, request);
}

export async function addEntry(db: IDBDatabase, entry: Entry): Promise<number> {
  assertEntry(entry);
  // Consent and entry insertion happen in ONE transaction, preventing a revoke race.
  const tx = db.transaction([CONSENT, ENTRIES], "readwrite");
  return new Promise((resolve, reject) => {
    let id: number | undefined;
    const check = tx.objectStore(CONSENT).get("current") as IDBRequest<ConsentRecord | undefined>;
    check.onsuccess = () => {
      if (!check.result?.granted) {
        tx.abort();
        return;
      }
      const insert = tx.objectStore(ENTRIES).add(entry);
      insert.onsuccess = () => { id = Number(insert.result); };
    };
    tx.oncomplete = () => resolve(id!);
    tx.onabort = () => reject(new Error("Consent is required to save an entry"));
    tx.onerror = () => reject(tx.error);
  });
}

export async function listEntries(db: IDBDatabase): Promise<StoredEntry[]> {
  const tx = db.transaction(ENTRIES, "readonly");
  const store = tx.objectStore(ENTRIES);
  return new Promise((resolve, reject) => {
    const rows: StoredEntry[] = [];
    const cursor = store.openCursor();
    cursor.onsuccess = () => {
      const item = cursor.result;
      if (item) {
        assertEntry(item.value);
        rows.push({ id: Number(item.primaryKey), entry: item.value as Entry });
        item.continue();
      }
    };
    tx.oncomplete = () => resolve(rows);
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteEntry(db: IDBDatabase, id: number): Promise<void> {
  const tx = db.transaction(ENTRIES, "readwrite");
  await complete(tx, tx.objectStore(ENTRIES).delete(id));
}

export async function deleteAllEntries(db: IDBDatabase): Promise<void> {
  const tx = db.transaction(ENTRIES, "readwrite");
  await complete(tx, tx.objectStore(ENTRIES).clear());
}

export async function consentHistory(db: IDBDatabase): Promise<ConsentEvent[]> {
  const tx = db.transaction(AUDIT, "readonly");
  return complete(tx, tx.objectStore(AUDIT).getAll() as IDBRequest<ConsentEvent[]>);
}
