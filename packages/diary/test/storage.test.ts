import { afterEach, describe, expect, it } from "vitest";
import { addEntry, consentHistory, DATABASE, deleteAllEntries, listEntries, openDiary, readConsent, setConsent } from "../src/storage.js";
import type { Entry } from "../src/model.js";

const sample: Entry = { date: "2026-11-12", category: "dressings", amount: 12.5, rationed: false, consequence: "none" };
async function clearDatabase() {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
afterEach(clearDatabase);
describe("local consent boundary", () => {
  it("requires an explicit grant before writing any row", async () => {
    const db = await openDiary();
    expect(await readConsent(db)).toBeUndefined();
    await expect(addEntry(db, sample)).rejects.toThrow(/Consent/);
    expect(await listEntries(db)).toEqual([]);
    db.close();
  });
  it("revocation stops writes, logs the event and retains rows until deletion", async () => {
    const db = await openDiary();
    await setConsent(db, true);
    await addEntry(db, sample);
    await setConsent(db, false);
    expect((await readConsent(db))?.granted).toBe(false);
    await expect(addEntry(db, sample)).rejects.toThrow(/Consent/);
    expect(await listEntries(db)).toHaveLength(1);
    expect((await consentHistory(db)).map((event) => event.action)).toEqual(["grant", "revoke"]);
    await deleteAllEntries(db);
    expect(await listEntries(db)).toEqual([]);
    db.close();
  });
});
