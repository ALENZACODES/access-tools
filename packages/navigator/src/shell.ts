/**
 * Adapter for the access-main shell route `/navigator`.
 *
 * Shape follows `NavigatorModule` and `ModuleResult` in access-main
 * `packages/shared/src`. Directory records stay in the navigator package;
 * this build does not bundle them into the shell list, and this adapter
 * does not invent entries.
 */
export interface NavigatorShellContext {
  locale: "en" | "fr";
  offline: boolean;
  nowIso: string;
}

export interface NavigatorShellResult {
  moduleId: "navigator";
  availability: "ready";
  items: [];
  messageKey: string;
  asOf: null;
  liveStatus: "unavailable";
}

export function listNavigatorForShell(_ctx: NavigatorShellContext): NavigatorShellResult {
  return {
    moduleId: "navigator",
    availability: "ready",
    items: [],
    messageKey: "modules.ready",
    asOf: null,
    liveStatus: "unavailable",
  };
}

export const navigatorShellModule = {
  id: "navigator" as const,
  list: (ctx: NavigatorShellContext): Promise<NavigatorShellResult> => Promise.resolve(listNavigatorForShell(ctx)),
};
