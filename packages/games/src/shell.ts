import { GAME_LIBRARY } from "./library.js";
import type { GameMeta } from "./types.js";

/**
 * Adapter for the access-main shell route `/games`.
 *
 * Shape follows `ModuleResult` and `ActivityDefinition` in access-main
 * `packages/shared/src/modules.ts`, contract version 1.1.0. A game is
 * recreation. It is not therapy, not an assessment, and not medical advice,
 * so `clinicalClaim` is always false. No game in the catalogue flashes, and
 * every game is played with a keyboard, a single tap, or Next and Choose.
 * The title is the scope-lock name, which stays in English in both languages.
 * Without an argument the list is the whole library (`GAME_LIBRARY`), so any
 * host gets every game; a host may pass a shorter list.
 */
export const SHELL_CONTRACT_VERSION = "1.1.0";

export interface ShellActivity {
  id: string;
  title: string;
  clinicalClaim: false;
  seizureRiskFlash: false;
  keyboardOperable: true;
}

export interface GamesShellResult {
  moduleId: "games";
  availability: "ready";
  items: ShellActivity[];
  messageKey: string;
  asOf: null;
  liveStatus: "unavailable";
}

export function toShellActivity(game: GameMeta): ShellActivity {
  return { id: game.id, title: game.name, clinicalClaim: false, seizureRiskFlash: false, keyboardOperable: true };
}

export function listGamesForShell(catalog: readonly GameMeta[] = GAME_LIBRARY): GamesShellResult {
  return {
    moduleId: "games",
    availability: "ready",
    items: catalog.map(toShellActivity),
    messageKey: "games.shellReady",
    asOf: null,
    liveStatus: "unavailable",
  };
}

export const gamesShellModule = {
  id: "games" as const,
  list: (): Promise<GamesShellResult> => Promise.resolve(listGamesForShell()),
};
