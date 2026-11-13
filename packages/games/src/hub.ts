import { CATALOG } from "./engine.js";
import { mulberry32, pick, shuffle } from "./rng.js";
import type { GameMeta, GamesRound, HubFilter, Language } from "./types.js";

export function filterGames(filter: HubFilter, favourites: readonly string[]): GameMeta[] {
  return CATALOG.filter((game) => {
    if (filter === "favourites") return favourites.includes(game.id);
    if (filter === "short") return game.short;
    if (filter === "calm") return game.calm;
    if (filter === "words") return game.words;
    if (filter === "numbers") return game.numbers;
    if (filter === "puzzles") return game.puzzle;
    return true;
  });
}

export function searchGames(query: string): GameMeta[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...CATALOG];
  return CATALOG.filter((game) =>
    [game.title.en, game.title.fr, game.summary.en, game.summary.fr, game.area, game.id]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );
}

export function surpriseGame(favourites: readonly string[], seed: number): GameMeta {
  const pool = favourites.length > 0 ? CATALOG.filter((game) => favourites.includes(game.id)) : [...CATALOG];
  return pick(mulberry32(seed), pool);
}

export function buildDailySet(options: { minutes: number; skipIds: readonly string[]; seed: number; calmOnly?: boolean }): GameMeta[] {
  let pool = CATALOG.filter((game) => !options.skipIds.includes(game.id));
  if (options.calmOnly) pool = pool.filter((game) => game.calm);
  if (options.minutes <= 5) pool = pool.filter((game) => game.short);
  const ranked = shuffle(mulberry32(options.seed), pool);
  const picked: GameMeta[] = [];
  let total = 0;
  for (const game of ranked) {
    if (picked.length > 0 && total >= options.minutes) break;
    picked.push(game);
    total += game.estimatedMinutes;
  }
  return picked;
}

export function daysPlayed(rounds: readonly GamesRound[], now: Date): { count: number; message: Record<Language, string> } {
  const start = now.getTime() - 6 * 24 * 60 * 60 * 1000;
  const days = new Set(
    rounds
      .filter((round) => round.completed && Date.parse(round.endedAt) >= start)
      .map((round) => round.endedAt.slice(0, 10)),
  );
  return {
    count: days.size,
    message: {
      en: `${days.size} days with a finished round in the last 7. A missed day is not a failure.`,
      fr: `${days.size} jours avec une manche terminée dans les 7 derniers. Un jour manqué n'est pas un échec.`,
    },
  };
}
