import { openDB } from "idb";
import type { PlacePack } from "@access-tools/place";

const DB_NAME = "access-tools-place-pack";
const STORE = "pack";
const KEY = "current";

async function db() {
  return openDB(DB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE);
    },
  });
}

/** Saves a place pack in IndexedDB. Search then runs on that local pack, with no server call. */
export async function savePackOffline(pack: PlacePack): Promise<void> {
  const database = await db();
  await database.put(STORE, pack, KEY);
  database.close();
}

export async function loadPackOffline(): Promise<PlacePack | null> {
  const database = await db();
  const pack = (await database.get(STORE, KEY)) as PlacePack | undefined;
  database.close();
  return pack ?? null;
}
