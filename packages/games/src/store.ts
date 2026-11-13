import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import schema from "./schema/games-records.schema.json" with { type: "json" };
import type { GamesRound, GamesSettings } from "./types.js";

const DB_NAME = "the-app-games";
const SETTINGS = "settings";
const ROUNDS = "rounds";
const SETTINGS_KEY = "settings";

const FORBIDDEN = ["diagnosis", "injurylevel", "ais", "catheter", "medication", "bladder", "bowel", "symptom", "bloodpressure", "profileid"];

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateSettings = ajv.compile(schema.properties.settings);
const validateRound = ajv.compile(schema.properties.round);

function assertClean(value: unknown): void {
  const keys: string[] = [];
  const walk = (item: unknown): void => {
    if (!item || typeof item !== "object") return;
    for (const [key, child] of Object.entries(item)) {
      keys.push(key.toLowerCase().replace(/[^a-z]/g, ""));
      walk(child);
    }
  };
  walk(value);
  const hit = keys.find((key) => FORBIDDEN.includes(key));
  if (hit) throw new Error(`Games data cannot store "${hit}". It stays separate from health and profile data.`);
}

export function defaultSettings(playerId: string): GamesSettings {
  return {
    schemaVersion: "games-settings-1.0.0",
    playerId,
    language: "en",
    textScale: "default",
    contrast: "default",
    reduceMotion: true,
    pace: "relaxed",
    timerEnabled: false,
    favouriteGameIds: [],
    skippedGameIds: [],
    streakOptOut: false,
  };
}

export function parseSettings(input: unknown): GamesSettings {
  assertClean(input);
  if (!validateSettings(input)) {
    throw new Error(`Games settings are not valid. ${validateSettings.errors?.map((error) => error.message).join("; ")}`);
  }
  return input as unknown as GamesSettings;
}

export function parseRound(input: unknown): GamesRound {
  assertClean(input);
  if (!validateRound(input)) {
    throw new Error(`Games round is not valid. ${validateRound.errors?.map((error) => error.message).join("; ")}`);
  }
  return input as unknown as GamesRound;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.addEventListener("upgradeneeded", () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SETTINGS)) db.createObjectStore(SETTINGS);
      if (!db.objectStoreNames.contains(ROUNDS)) db.createObjectStore(ROUNDS);
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

export async function openGamesDatabase(): Promise<IDBDatabase> {
  return open();
}

export async function readSettings(db: IDBDatabase, playerId: string): Promise<GamesSettings> {
  const stored = await done(db.transaction(SETTINGS, "readonly").objectStore(SETTINGS).get(SETTINGS_KEY));
  if (stored == null) return defaultSettings(playerId);
  return parseSettings(stored);
}

export async function writeSettings(db: IDBDatabase, input: unknown): Promise<GamesSettings> {
  const settings = parseSettings(input);
  await done(db.transaction(SETTINGS, "readwrite").objectStore(SETTINGS).put(settings, SETTINGS_KEY));
  return settings;
}

export async function writeRound(db: IDBDatabase, input: unknown): Promise<GamesRound> {
  const round = parseRound(input);
  await done(db.transaction(ROUNDS, "readwrite").objectStore(ROUNDS).put(round, round.roundId));
  return round;
}

export async function readRounds(db: IDBDatabase): Promise<GamesRound[]> {
  const all = await done(db.transaction(ROUNDS, "readonly").objectStore(ROUNDS).getAll());
  return (all as GamesRound[]).map((round) => parseRound(round));
}

export async function deleteGamesData(db: IDBDatabase): Promise<void> {
  const tx = db.transaction([SETTINGS, ROUNDS], "readwrite");
  tx.objectStore(SETTINGS).clear();
  tx.objectStore(ROUNDS).clear();
  await new Promise<void>((resolve, reject) => {
    tx.addEventListener("complete", () => resolve());
    tx.addEventListener("error", () => reject(tx.error));
  });
}

export const GAMES_DATABASE_NAME = DB_NAME;
