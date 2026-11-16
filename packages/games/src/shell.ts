/**
 * Adapter for the access-main shell route `/games`.
 *
 * Shape follows `GamesModule` and `ModuleResult` in access-main
 * `packages/shared/src`. This build does not list activities on that route.
 * A later activity must set clinicalClaim and seizureRiskFlash to false and
 * keyboardOperable to true. This adapter does not invent one.
 */
export interface GamesShellContext {
  locale: "en" | "fr";
  offline: boolean;
  nowIso: string;
}

export interface GamesShellResult {
  moduleId: "games";
  availability: "ready";
  items: [];
  messageKey: string;
  asOf: null;
  liveStatus: "unavailable";
}

export function listGamesForShell(_ctx: GamesShellContext): GamesShellResult {
  return {
    moduleId: "games",
    availability: "ready",
    items: [],
    messageKey: "modules.ready",
    asOf: null,
    liveStatus: "unavailable",
  };
}

export const gamesShellModule = {
  id: "games" as const,
  list: (ctx: GamesShellContext): Promise<GamesShellResult> => Promise.resolve(listGamesForShell(ctx)),
};
