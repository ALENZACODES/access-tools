import { CATALOG } from "./engine.js";
import { mulberry32, pick } from "./rng.js";
import type { GameMeta, GamesRound, HubFilter } from "./types.js";

export const HUB_FILTERS: readonly HubFilter[] = ["all", "favourites", "short"];

export function filterGames(filter: HubFilter, favourites: readonly string[]): GameMeta[] {
  if (filter === "favourites") return CATALOG.filter((game) => favourites.includes(game.id));
  if (filter === "short") return CATALOG.filter((game) => game.estimatedMinutes <= 3);
  return [...CATALOG];
}

export function searchGames(query: string): GameMeta[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...CATALOG];
  return CATALOG.filter((game) =>
    [game.name, game.summary.en, game.summary.fr, game.taskFamily, game.id].join(" ").toLowerCase().includes(needle),
  );
}

export function surpriseGame(favourites: readonly string[], seed: number): GameMeta {
  const pool = favourites.length > 0 ? CATALOG.filter((game) => favourites.includes(game.id)) : [...CATALOG];
  return pick(mulberry32(seed), pool);
}

/**
 * Daily set of three games. The UTC day number modulo 10 picks the first game,
 * and the next two follow in catalog order, wrapping at the end.
 * The same date always returns the same three. A different date can rotate the set.
 */
export function buildDailySet(date: string): GameMeta[] {
  const day = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  const start = ((day % CATALOG.length) + CATALOG.length) % CATALOG.length;
  return [0, 1, 2].map((offset) => {
    const game = CATALOG[(start + offset) % CATALOG.length];
    if (!game) throw new Error("Daily set is missing a game");
    return game;
  });
}

function daysBetween(earlier: string, later: string): number {
  const start = Date.parse(`${earlier}T00:00:00Z`);
  const end = Date.parse(`${later}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

/**
 * Two missed days keep the streak. A third missed day starts it over.
 * Grace remaining is 2 minus the missed days in the latest open gap.
 */
export function streakFromDates(dates: readonly string[], today: string): { streak: number; graceRemaining: number } {
  const unique = [...new Set(dates)].filter((date) => date <= today).sort();
  if (unique.length === 0) return { streak: 0, graceRemaining: 2 };
  let streak = 1;
  let lastGapMissed = 0;
  for (let index = 1; index < unique.length; index += 1) {
    const previous = unique[index - 1];
    const current = unique[index];
    if (!previous || !current) continue;
    const missed = daysBetween(previous, current) - 1;
    if (missed <= 2) {
      streak += 1;
      lastGapMissed = missed;
    } else {
      streak = 1;
      lastGapMissed = 0;
    }
  }
  const last = unique[unique.length - 1];
  if (!last) return { streak: 0, graceRemaining: 2 };
  const pending = last === today ? 0 : daysBetween(last, today) - 1;
  if (pending >= 3) return { streak: 0, graceRemaining: 2 };
  const used = last === today ? lastGapMissed : pending;
  return { streak, graceRemaining: Math.max(0, 2 - used) };
}

export function streakFromRounds(rounds: readonly GamesRound[], today: string): { streak: number; graceRemaining: number } {
  return streakFromDates(
    rounds.filter((round) => round.completed).map((round) => round.endedAt.slice(0, 10)),
    today,
  );
}
