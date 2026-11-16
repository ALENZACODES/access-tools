import { createElement, type ReactElement } from "react";
import { PackFindersPage } from "./PackFindersPage.js";
import type { FinderLang } from "../pack-finders.js";
import type { PackSource } from "../pack-types.js";
import { searchFindersForShell, type ShellFinderContext, type ShellFinderKind } from "../shell.js";

/** Shell adapter: the passed data source is the only source of finder records. */
export function createFindersModule(source: PackSource, lang: FinderLang = "en") {
  function Page(): ReactElement { return createElement(PackFindersPage, { source, lang }); }
  return {
    id: "finders" as const,
    path: "/finders",
    Page,
    Component: Page,
    search: (query: { kind: ShellFinderKind; text: string }, ctx: ShellFinderContext) => searchFindersForShell(source, query, ctx),
  };
}
