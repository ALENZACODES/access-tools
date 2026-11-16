import { RETRIEVED_ON } from "./boundaries.js";
import { DIRECTORY } from "./records.js";
import { searchDirectory } from "./search.js";
import type { DirectoryRecord } from "./types.js";

/**
 * Adapter for the access-main shell route `/navigator`.
 *
 * Shape follows `ModuleResult` and `NavigatorModule` in access-main
 * `packages/shared/src/modules.ts`, contract version 1.1.0. The shell checks
 * each result with `checkModuleResult` before it lists anything. Records are
 * returned as they are: `directory-record-1.0.0` with
 * `verificationTier: "administrator_page"`, which the shell maps to tier E.
 * No record is added, changed, or given an eligibility answer here.
 */
export const SHELL_CONTRACT_VERSION = "1.1.0";

export interface NavigatorShellContext {
  locale: "en" | "fr";
  offline: boolean;
  nowIso: string;
  query?: string;
}

export interface NavigatorShellResult {
  moduleId: "navigator";
  availability: "ready";
  items: DirectoryRecord[];
  messageKey: string;
  /** The UTC date the official pages were read. Not a live check. */
  asOf: string;
  liveStatus: "unavailable";
}

export function listForShell(ctx: NavigatorShellContext, records: readonly DirectoryRecord[] = DIRECTORY): NavigatorShellResult {
  const text = ctx.query?.trim() ?? "";
  const items = text ? searchDirectory(records, { text }) : [...records];
  return {
    moduleId: "navigator",
    availability: "ready",
    items,
    messageKey: "navigator.shellReady",
    asOf: RETRIEVED_ON,
    liveStatus: "unavailable",
  };
}

export const navigatorShellModule = {
  id: "navigator" as const,
  list: (ctx: NavigatorShellContext): Promise<NavigatorShellResult> => Promise.resolve(listForShell(ctx)),
};
