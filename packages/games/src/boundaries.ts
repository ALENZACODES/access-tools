import { gameCopy, type GameCopyKey } from "./i18n.js";
import type { Language } from "./types.js";

function pair(key: GameCopyKey): Record<Language, string> {
  return { en: gameCopy(key, "en"), fr: gameCopy(key, "fr") };
}

export const GAMES_BOUNDARY = pair("boundary.games");
export const ROUND_DONE = pair("boundary.round-done");
export const PRACTICE_DONE = pair("boundary.practice-done");
export const PRACTICE_BANNER = pair("boundary.practice");
export const DAILY_NOTE = pair("boundary.daily");
export const GRACE_RULE = pair("boundary.grace");
